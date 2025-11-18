import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWTPayload, AuthUser } from '@/types';
import { NextRequest } from 'next/server';
import { parse } from 'cookie';
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "./mongodb-client";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

// ============================================================================
// Email/Password Authentication Functions
// ============================================================================

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: AuthUser): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * At least 8 characters with uppercase, lowercase, and number
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

/**
 * Strong password validation
 * At least 8 characters with uppercase, lowercase, and number
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  return { valid: true };
}

/**
 * Validate username format
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters long' };
  }

  if (username.length > 30) {
    return { valid: false, error: 'Username must be no more than 30 characters long' };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return {
      valid: false,
      error: 'Username can only contain letters, numbers, and underscores',
    };
  }

  return { valid: true };
}

/**
 * Alias for email validation
 */
export function validateEmail(email: string): boolean {
  return isValidEmail(email);
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  // Expected format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }

  return null;
}

/**
 * Get authenticated user from request
 * Supports both cookie-based and header-based authentication
 * Returns the JWT payload if authenticated, null otherwise
 */
export function getAuthUser(request: NextRequest): JWTPayload | null {
  try {
    // Try to get token from Authorization header first
    const authHeader = request.headers.get('authorization');
    let token = extractTokenFromHeader(authHeader);

    // Fall back to cookie if no header token
    if (!token) {
      const cookieHeader = request.headers.get('cookie') || '';
      const cookies = parse(cookieHeader);
      token = cookies.auth_token || null;
    }

    if (!token) {
      return null;
    }

    return verifyToken(token);
  } catch (error) {
    return null;
  }
}

// ============================================================================
// NextAuth Configuration (Social Authentication)
// ============================================================================

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise) as any,
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }

        try {
          const client = await clientPromise;
          const db = client.db();

          // Find user by email or username
          const user = await db.collection('users').findOne({
            $or: [
              { email: credentials.email },
              { username: credentials.email }
            ]
          });

          if (!user) {
            throw new Error("No user found with this email");
          }

          // Check if user has a password (not OAuth-only user)
          if (!user.password) {
            throw new Error("Please sign in with your OAuth provider");
          }

          // Verify password
          const isValid = await comparePassword(credentials.password, user.password);

          if (!isValid) {
            throw new Error("Invalid password");
          }

          // Return user object
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name || user.username || user.email,
            image: user.image || null,
          };
        } catch (error: any) {
          throw new Error(error.message || "Authentication failed");
        }
      }
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []),
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
      ? [FacebookProvider({
          clientId: process.env.FACEBOOK_CLIENT_ID,
          clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        })]
      : []),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [GitHubProvider({
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        })]
      : []),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email || "";
        token.name = user.name || "";
        token.image = user.image || "";
      }
      if (account) {
        token.provider = account.provider;
      }
      // For credentials provider, set provider to 'credentials'
      if (!token.provider && user) {
        token.provider = 'credentials';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
        (session.user as any).provider = token.provider || 'credentials';
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
