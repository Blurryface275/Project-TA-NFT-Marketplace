import test from "node:test";
import assert from "node:assert/strict";
import {
  encrypt as jwtEncrypt,
  decrypt as jwtDecrypt,
} from "@/lib/jwt";
import {
  encrypt as sessionEncrypt,
  decrypt as sessionDecrypt,
  createSession,
  updateSessionWallet,
  deleteSession,
  getSession,
} from "@/lib/session";
import { backendFetch, getBackendUrl } from "@/lib/backend";
import { login } from "@/app/login/actions";

const cookieStore = (globalThis as { __testCookieStore?: Map<string, string> })
  .__testCookieStore;

const savedSessionSecret = process.env.SESSION_SECRET;
const savedInternalKey = process.env.INTERNAL_API_KEY;
const savedBackendUrl = process.env.BACKEND_URL;

function restoreEnv() {
  if (savedSessionSecret === undefined) {
    delete process.env.SESSION_SECRET;
  } else {
    process.env.SESSION_SECRET = savedSessionSecret;
  }

  if (savedInternalKey === undefined) {
    delete process.env.INTERNAL_API_KEY;
  } else {
    process.env.INTERNAL_API_KEY = savedInternalKey;
  }

  if (savedBackendUrl === undefined) {
    delete process.env.BACKEND_URL;
  } else {
    process.env.BACKEND_URL = savedBackendUrl;
  }
}

test("jwt.ts throws when SESSION_SECRET is missing, empty, or whitespace", async () => {
  try {
    const expiresAt = new Date(Date.now() + 60_000);

    for (const secret of [undefined, "", "   "]) {
      if (secret === undefined) {
        delete process.env.SESSION_SECRET;
      } else {
        process.env.SESSION_SECRET = secret;
      }

      await assert.rejects(
        () => jwtEncrypt({ userId: "1", expiresAt }),
        /SESSION_SECRET/,
      );
      await assert.rejects(() => jwtDecrypt(undefined), /SESSION_SECRET/);
      await assert.rejects(() => jwtDecrypt("invalid.token.here"), /SESSION_SECRET/);
    }
  } finally {
    restoreEnv();
  }
});

test("jwt.ts encrypts and decrypts payload when SESSION_SECRET is configured", async () => {
  try {
    process.env.SESSION_SECRET = "unit-test-session-secret-123";
    const expiresAt = new Date(Date.now() + 60_000);

    assert.equal(await jwtDecrypt(undefined), null);

    const token = await jwtEncrypt({
      userId: "42",
      role: "ORGANIZER",
      expiresAt,
    });
    const decoded = await jwtDecrypt(token);

    assert.ok(decoded);
    assert.equal(decoded.userId, "42");
    assert.equal(decoded.role, "ORGANIZER");
  } finally {
    restoreEnv();
  }
});

test("session.ts throws when SESSION_SECRET is missing, empty, or whitespace", async () => {
  try {
    const expiresAt = new Date(Date.now() + 60_000);

    for (const secret of [undefined, "", "   "]) {
      if (secret === undefined) {
        delete process.env.SESSION_SECRET;
      } else {
        process.env.SESSION_SECRET = secret;
      }

      await assert.rejects(
        () => sessionEncrypt({ userId: "1", expiresAt }),
        /SESSION_SECRET/,
      );
      await assert.rejects(() => sessionDecrypt(undefined), /SESSION_SECRET/);
      await assert.rejects(
        () => sessionDecrypt("invalid.token.here"),
        /SESSION_SECRET/,
      );
    }
  } finally {
    restoreEnv();
  }
});

test("session.ts updateSessionWallet retains organizersId and organizationName, and deleteSession clears cookie", async () => {
  try {
    cookieStore?.clear();
    process.env.SESSION_SECRET = "unit-test-session-secret-123";

    await createSession(
      "42",
      "Org User",
      null,
      "org@example.com",
      "ORGANIZER",
      9,
      "Acme Org",
    );

    await updateSessionWallet("0xabc123");
    const updated = await getSession();

    assert.ok(updated);
    assert.equal(updated.userId, "42");
    assert.equal(updated.name, "Org User");
    assert.equal(updated.email, "org@example.com");
    assert.equal(updated.role, "ORGANIZER");
    assert.equal(updated.walletAddress, "0xabc123");
    assert.equal(updated.organizersId, 9);
    assert.equal(updated.organizationName, "Acme Org");

    await deleteSession();
    assert.equal(await getSession(), null);
  } finally {
    cookieStore?.clear();
    restoreEnv();
  }
});

test("backendFetch throws when INTERNAL_API_KEY is missing or whitespace", async () => {
  try {
    for (const key of [undefined, "", "   "]) {
      if (key === undefined) {
        delete process.env.INTERNAL_API_KEY;
      } else {
        process.env.INTERNAL_API_KEY = key;
      }

      await assert.rejects(
        () => backendFetch("/api/events"),
        /INTERNAL_API_KEY/,
      );
    }
  } finally {
    restoreEnv();
  }
});

test("backendFetch injects x-internal-key and preserves FormData boundary without forcing JSON content-type", async () => {
  const originalFetch = globalThis.fetch;
  try {
    process.env.INTERNAL_API_KEY = "internal-secret-abc";
    process.env.BACKEND_URL = "http://localhost:3001/";

    assert.equal(getBackendUrl(), "http://localhost:3001");

    const captured: Array<{ url: string; init?: RequestInit }> = [];
    globalThis.fetch = (async (
      input: string | URL | Request,
      init?: RequestInit,
    ) => {
      captured.push({ url: String(input), init });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;

    await backendFetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com" }),
    });

    const jsonHeaders = new Headers(captured[0].init?.headers);
    assert.equal(captured[0].url, "http://localhost:3001/api/auth/login");
    assert.equal(jsonHeaders.get("x-internal-key"), "internal-secret-abc");
    assert.equal(jsonHeaders.get("content-type"), "application/json");

    const form = new FormData();
    form.set("eventName", "Konser Test");

    await backendFetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: form,
    });

    const formHeaders = new Headers(captured[1].init?.headers);
    assert.equal(captured[1].url, "http://localhost:3001/api/events");
    assert.equal(formHeaders.get("x-internal-key"), "internal-secret-abc");
    assert.equal(formHeaders.get("content-type"), null);
    assert.ok(captured[1].init?.body instanceof FormData);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnv();
  }
});

test("login server action injects x-internal-key via backendFetch and creates session", async () => {
  const originalFetch = globalThis.fetch;
  try {
    cookieStore?.clear();
    process.env.INTERNAL_API_KEY = "action-internal-key";
    process.env.SESSION_SECRET = "action-session-secret";
    process.env.BACKEND_URL = "http://localhost:3001";

    let capturedUrl = "";
    let capturedKey: string | null = null;
    globalThis.fetch = (async (
      input: string | URL | Request,
      init?: RequestInit,
    ) => {
      capturedUrl = String(input);
      capturedKey = new Headers(init?.headers).get("x-internal-key");
      return new Response(
        JSON.stringify({
          id: 7,
          name: "Promotor",
          walletAddress: null,
          email: "org@example.com",
          role: "ORGANIZER",
          organizersId: 12,
          organizationName: "Garuda Live",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;

    const formData = new FormData();
    formData.set("email", "org@example.com");
    formData.set("password", "password123");

    await assert.rejects(
      () => login(undefined, formData),
      /NEXT_REDIRECT:\/dashboard/,
    );

    assert.equal(capturedUrl, "http://localhost:3001/api/auth/login");
    assert.equal(capturedKey, "action-internal-key");

    const session = await getSession();
    assert.ok(session);
    assert.equal(session.userId, "7");
    assert.equal(session.organizersId, 12);
    assert.equal(session.organizationName, "Garuda Live");
  } finally {
    globalThis.fetch = originalFetch;
    cookieStore?.clear();
    restoreEnv();
  }
});
