import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from './auth';
import { AuthTokenPayload } from '@/types';

/**
 * Authenticate the request and return the user payload
 * @param request - Next.js request object
 * @returns User payload if authenticated, null otherwise
 */
export async function authenticate(request: NextRequest): Promise<AuthTokenPayload | null> {
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  return payload;
}

/**
 * Middleware to require authentication for a route
 * Use this as a wrapper for your API route handlers
 *
 * @param handler - The route handler function
 * @returns Wrapped handler with authentication check
 */
export function withAuth<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: (request: NextRequest, context: { params: any; user: AuthTokenPayload }) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: { params: any }) => {
    const user = await authenticate(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Pass the user payload to the handler
    return handler(request, { params: context?.params || {}, user });
  };
}

/**
 * Middleware to optionally authenticate a route
 * The route will work with or without authentication, but user info will be available if authenticated
 *
 * @param handler - The route handler function
 * @returns Wrapped handler with optional authentication
 */
export function withOptionalAuth<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: (request: NextRequest, context: { params: any; user: AuthTokenPayload | null }) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: { params: any }) => {
    const user = await authenticate(request);

    // Pass the user payload (or null) to the handler
    return handler(request, { params: context?.params || {}, user });
  };
}

/**
 * Middleware to require specific roles
 *
 * @param requiredRoles - Array of roles that are allowed
 * @param handler - The route handler function
 * @returns Wrapped handler with role-based authentication check
 */
export function withRole<T extends (...args: any[]) => Promise<NextResponse>>(
  requiredRoles: string[],
  handler: (request: NextRequest, context: { params: any; user: AuthTokenPayload }) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: { params: any }) => {
    const user = await authenticate(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    if (user.role && !requiredRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden. You do not have permission to access this resource.' },
        { status: 403 }
      );
    }

    return handler(request, { params: context?.params || {}, user });
  };
}
