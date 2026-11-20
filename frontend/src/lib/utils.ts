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
// formatting untuk id token separation (xxx-xxx-xxx)
export function formatTicketId(tokenId?: number | string | null): string {
  if (tokenId === undefined || tokenId === null || tokenId === "") return "";
  // lookahead (?=\d) bikin strip muncul progresif saat diketik, tanpa strip menggantung di akhir
  return String(tokenId)
    .replace(/\D/g, "")
    .slice(0, 9)
    .replace(/(\d{3})(?=\d)/g, "$1-");
}
