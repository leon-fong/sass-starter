import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NewUser } from '@/lib/db/schema';

const key = new TextEncoder().encode(process.env.AUTH_SECRET);
const SALT_ROUNDS = 10;
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

export const SESSION_COOKIE_NAME = 'session';

export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string
) {
  return compare(plainTextPassword, hashedPassword);
}

type SessionData = {
  user: { id: number };
  expires: string;
};

type SessionCookieStore = {
  set: (
    name: string,
    value: string,
    options: ReturnType<typeof getSessionCookieOptions>
  ) => void;
};

export function createSessionExpiry() {
  return new Date(Date.now() + SESSION_DURATION_MS);
}

export function getSessionCookieOptions(expires: Date) {
  return {
    expires,
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const
  };
}

export async function signToken(payload: SessionData) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 day from now')
    .sign(key);
}

export async function verifyToken(input: string) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload as SessionData;
}

export async function getSession() {
  const session = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!session) return null;
  return await verifyToken(session);
}

export async function setSessionCookie(
  cookieStore: SessionCookieStore,
  session: SessionData,
  expires: Date
) {
  cookieStore.set(
    SESSION_COOKIE_NAME,
    await signToken(session),
    getSessionCookieOptions(expires)
  );
}

export async function setSession(user: NewUser) {
  const expiresInOneDay = createSessionExpiry();
  const session: SessionData = {
    user: { id: user.id! },
    expires: expiresInOneDay.toISOString(),
  };
  await setSessionCookie(await cookies(), session, expiresInOneDay);
}
