import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { PartnerKey, UserProfile } from "@/types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "duonest_super_secret_master_key_2026_salt_998877"
);

export const COOKIE_NAME = "duonest_session";

export interface SessionPayload {
  userId: string;
  partnerKey: PartnerKey;
  name: string;
  email: string;
  themeAccent: string;
  hasPin: boolean;
}

/**
 * Creates and signs a JWT token for the user session.
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/**
 * Verifies a JWT token.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Retrieves the current session from incoming cookies.
 */
export async function getCurrentSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Password & PIN hashing functions
 */
export async function hashSecret(secret: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(secret, salt);
}

export async function verifySecret(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
