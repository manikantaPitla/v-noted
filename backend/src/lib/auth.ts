import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
}

export async function verifyGoogleToken(credential: string) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (payload) {
      return {
        googleId: payload.sub,
        email: payload.email || '',
        name: payload.name || payload.email?.split('@')[0] || 'User',
        avatar: payload.picture || '',
      };
    }
  } catch {
    console.log('ID token verification failed, attempting access token fetch...');
  }

  console.log('[Auth] Attempting userinfo fetch with access_token length:', credential.length);
  const response = await fetch(
    `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${credential}`
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[Auth] Google API Error:', response.status, errorBody);
    throw new Error(`Invalid Google token: ${response.status}`);
  }

  const payload = await response.json();
  console.log('[Auth] Google User authenticated:', payload.email);

  return {
    googleId: payload.sub,
    email: payload.email || '',
    name: payload.name || payload.email?.split('@')[0] || 'User',
    avatar: payload.picture || '',
  };
}

export function signJwt(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyJwt(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
