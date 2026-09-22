import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Take secret key from .env.local and change it into Uint8Array
const secretKey = process.env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

// payload inside JWT
type SessionPayload = {
  userId: string;
  expiresAt: Date;
  name?: string; // we need name for display on Navbar
  walletAddress?: string; // we need walletAddress for display on Profile
};

// encryption funciton to create JWT from Payload
export async function encrypt(payload: SessionPayload) {
  console.log("🔒 [Session] Mengenkripsi payload:", payload);
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" }) // HS256: using a shared secret key to sign JWT
    .setIssuedAt()
    .setExpirationTime(payload.expiresAt)
    .sign(encodedKey);
  console.log(
    "🔑 [Session] JWT Token berhasil dibuat:",
    token.slice(0, 25) + "...",
  );
  return token;
}

// decryption function to decrypt JWT
export async function decrypt(session: string | undefined) {
  console.log("🔍 [Session] Memeriksa & mendekripsi session cookie...");
  if (!session) {
    console.log("⚠️ [Session] Session cookie kosong / tidak ditemukan");
    return null;
  }
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"], // specify the algorithm used to sign the JWT
      clockTolerance: 60, // allow 60 seconds tolerance for time-based validation
    });
    console.log("✅ [Session] Dekripsi berhasil! Payload user:", payload);
    return payload;
  } catch (error) {
    console.error("❌ [Session] Verifikasi session token gagal:", error);
    return null;
  }
}

// creating session and store it into HttpOnly Cookie
export async function createSession(
  userId: string,
  name?: string,
  walletAddress?: string,
) {
  console.log("🚀 [Session] Memulai createSession untuk userId:", userId);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = await encrypt({ userId, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    httpOnly: true, // tidak bisa diakses oleh client-side script, prevent XSS
    secure: process.env.NODE_ENV === "production", // hanya akan dikirim lewat koneksi HTTPS
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
  console.log(
    "🍪 [Session] Cookie 'session' berhasil disimpan ke HttpOnly cookie!",
  );
}

// function to delete cookie session when logout
export async function deleteSession() {
  console.log("🗑️ [Session] Menghapus cookie session...");
  const cookieStore = await cookies();
  cookieStore.delete("session");
  console.log("👋 [Session] Cookie session telah dihapus (User logged out)");
}

// function to read session payload in Server Components
// cookie vs session : cookie = penyimpanan sementara, session = penyimpanan permanen
export async function getSession() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session")?.value;
  return await decrypt(cookie);
}

