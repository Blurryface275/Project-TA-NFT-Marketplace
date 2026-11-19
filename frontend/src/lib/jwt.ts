import { SignJWT, jwtVerify } from "jose";

export function getEncodedKey(): Uint8Array {
  const secretKey = process.env.SESSION_SECRET;
  if (!secretKey || secretKey.trim() === "") {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secretKey);
}

export async function decrypt(session: string | undefined) {
  const encodedKey = getEncodedKey();
  if (!session) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
      clockTolerance: 60,
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function encrypt(
  payload: Record<string, unknown> & { expiresAt: Date | string | number },
) {
  const encodedKey = getEncodedKey();
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(payload.expiresAt)
    .sign(encodedKey);
  return token;
}
