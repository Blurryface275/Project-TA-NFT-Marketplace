export { cn } from "cn";

export function resolveIpfsUrl(uri?: string | null): string {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) {
    const gateway = (
      process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud"
    )
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
    return `https://${gateway}/ipfs/${uri.slice(7)}`;
  }
  if (uri.startsWith("/")) {
    return `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}${uri}`;
  }
  return uri;
}
