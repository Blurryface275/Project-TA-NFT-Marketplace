import { Buffer } from "buffer";
globalThis.Buffer = Buffer;

import { toWebAuthnKey, WebAuthnMode } from "@zerodev/passkey-validator";

const out = document.getElementById("out")!;
let busy = false;

window.addEventListener("blur", () =>
  console.log("[blur] halaman kehilangan fokus"),
);
window.addEventListener("focus", () =>
  console.log("[focus] halaman dapat fokus"),
);

document.getElementById("register")!.addEventListener("click", async () => {
  if (busy) {
    console.warn("[guard] panggilan ganda dicegah");
    return;
  }
  busy = true;

  console.log("[cek] hasFocus =", document.hasFocus());
  out.textContent = "Menunggu prompt biometrik...";

  try {
    const webAuthnKey = await toWebAuthnKey({
      passkeyName: "edward-" + Date.now(),
      passkeyServerUrl: import.meta.env.VITE_PASSKEY_SERVER_URL,
      mode: WebAuthnMode.Register,
      passkeyServerHeaders: {},
    });
    console.log("[sukses]", webAuthnKey);
    out.textContent = JSON.stringify(
      webAuthnKey,
      (_, v) => (typeof v === "bigint" ? v.toString() : v),
      2,
    );
  } catch (e) {
    console.error("[gagal]", e);
    out.textContent = "GAGAL: " + (e as Error).message;
  } finally {
    busy = false;
  }
});
