import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User, AuthResponse } from '@/types';
import { comparePassword, generateToken, isValidEmail } from '@/lib/auth';
import { serialize } from 'cookie';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, username, password } = body;

    // Validate input - require either email or username, plus password
    if ((!email && !username) || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email or username and password are required',
          message: 'Email or username and password are required',
        } as AuthResponse,
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format',
          message: 'Invalid email format',
        } as AuthResponse,
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();
    const usersCollection = db.collection<User>('users');

    // Find user by email or username
    let user: User | null = null;

    if (email) {
      user = await usersCollection.findOne({ email: email.toLowerCase() });
    } else if (username) {
      user = await usersCollection.findOne({ username });
    }

    if (!user || !user.password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
          message: 'Invalid email/username or password',
        } as AuthResponse,
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
          message: 'Invalid email/username or password',
        } as AuthResponse,
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name || user.username || '',
      username: user.username,
      role: user.role,
    });

    // Set cookie
    const cookie = serialize('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Return user info (without password) - support both old and new response formats
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      token, // Include token in response for Bearer auth clients
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    } as AuthResponse);

    response.headers.set('Set-Cookie', cookie);
    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An error occurred during login',
      } as AuthResponse,
      { status: 500 }
    );
  }
}
