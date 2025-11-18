import { getServerSession } from "next-auth/next";
import { authOptions, getAuthUser } from "./auth";
import { NextResponse } from "next/server";
import { Session } from "next-auth";
import { cookies } from 'next/headers';

type AuthSuccess = {
  error: false;
  session?: Session;
  userId: string;
  email?: string;
  name?: string;
};

type AuthError = {
  error: true;
  response: NextResponse;
};

export async function getAuthSession() {
  return await getServerSession(authOptions);
}

/**
 * Require authentication - supports both NextAuth (social) and JWT (email/password)
 * Checks NextAuth session first, then falls back to JWT token
 */
export async function requireAuth(): Promise<AuthSuccess | AuthError> {
  // Try NextAuth first (social login)
  const session = await getAuthSession();

  if (session && session.user && session.user.id) {
    return {
      error: false,
      session,
      userId: session.user.id,
      email: session.user.email || undefined,
      name: session.user.name || undefined,
    };
  }

  // Fall back to JWT authentication (email/password)
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (token) {
      const { verifyToken } = await import('./auth');
      const payload = verifyToken(token);

      if (payload && payload.userId) {
        return {
          error: false,
          userId: payload.userId,
          email: payload.email,
          name: payload.name,
        };
      }
    }
  } catch (error) {
    console.error('Error checking JWT auth:', error);
  }

  // No valid authentication found
  return {
    error: true,
    response: NextResponse.json(
      { error: "Unauthorized. Please sign in." },
      { status: 401 }
    ),
  };
}
