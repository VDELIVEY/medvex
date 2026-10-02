import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';

export type SessionRole = 'ministry' | 'superadmin' | 'admin' | 'doctor' | 'receptionist' | 'cashier' | 'lab' | 'pharmacy';

export interface Session {
  staffId: string | null;
  institutionId: string | null;
  name: string;
  role: SessionRole;
  expiresAt: number;
}

const COOKIE_NAME = 'medqr_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function getSecret() {
  const secret = process.env.MEDQR_SESSION_SECRET || (process.env.NODE_ENV !== 'production' ? process.env.SUPABASE_SERVICE_ROLE_KEY : '');
  if (!secret || secret.length < 32) throw new Error('MEDQR_SESSION_SECRET must be at least 32 characters');
  return secret;
}

function sign(value: string) {
  return createHmac('sha256', getSecret()).update(value).digest('base64url');
}

export function createSession(input: Omit<Session, 'expiresAt'>) {
  const payload = Buffer.from(JSON.stringify({ ...input, expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000 })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function getSession(request: Request): Session | null {
  const cookie = request.headers.get('cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (!cookie) return null;
  const token = decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1));
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Session;
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

export function requireSession(request: Request, roles?: SessionRole[]) {
  const session = getSession(request);
  if (!session || (roles && !roles.includes(session.role))) {
    return { response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }), session: null };
  }
  return { response: null, session };
}

export function setSessionCookie(response: NextResponse, session: Omit<Session, 'expiresAt'>) {
  response.cookies.set(COOKIE_NAME, createSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
  });
  return response;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 0, path: '/' });
  return response;
}