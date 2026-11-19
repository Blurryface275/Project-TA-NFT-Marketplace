import "server-only";

export function getBackendUrl(): string {
  const raw =
    process.env.BACKEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ||
    "http://localhost:3001";
  return raw.replace(/\/+$/, "");
}

export async function backendFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const apiKey = process.env.INTERNAL_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("INTERNAL_API_KEY environment variable is not set");
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const headers = new Headers(init?.headers);
  headers.set("x-internal-key", apiKey);

  if (init?.body instanceof FormData) {
    headers.delete("content-type");
  }

  return fetch(`${getBackendUrl()}${normalizedPath}`, {
    ...init,
    headers,
  });
}
