import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User, AuthResponse } from '@/types';
import { hashPassword, isValidEmail, isValidPassword, validatePassword, validateUsername, generateToken } from '@/lib/auth';
import { serialize } from 'cookie';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, username } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email and password are required',
          message: 'Email and password are required',
        } as AuthResponse,
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format',
          message: 'Invalid email format',
        } as AuthResponse,
        { status: 400 }
      );
    }

    // Use stronger password validation if available
    if (!isValidPassword(password)) {
      const strongValidation = validatePassword(password);
      return NextResponse.json(
        {
          success: false,
          error: strongValidation.error || 'Password must be at least 6 characters long',
          message: strongValidation.error || 'Password must be at least 6 characters long',
        } as AuthResponse,
        { status: 400 }
      );
    }

    // Validate username if provided
    if (username) {
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: usernameValidation.error,
            message: usernameValidation.error,
          } as AuthResponse,
          { status: 400 }
        );
      }
    }

    // Connect to database
    const { db } = await connectToDatabase();
    const usersCollection = db.collection<User>('users');

    // Check if user already exists (by email)
    const existingUserByEmail = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingUserByEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'User with this email already exists',
          message: 'User with this email already exists',
        } as AuthResponse,
        { status: 400 }
      );
    }

    // Check if username already exists (if username provided)
    if (username) {
      const existingUserByUsername = await usersCollection.findOne({ username });
      if (existingUserByUsername) {
        return NextResponse.json(
          {
            success: false,
            error: 'Username already exists',
            message: 'Username already exists',
          } as AuthResponse,
          { status: 409 }
        );
      }
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const now = new Date();
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(7);

    const newUser: User = {
      id: userId,
      email: email.toLowerCase(),
      username: username || undefined,
      password: hashedPassword,
      name: name || username || email.split('@')[0],
      role: 'user',
      provider: 'email',
      dateCreated: now,
      dateUpdated: now,
      createdAt: now,
      updatedAt: now,
    };

    await usersCollection.insertOne(newUser);

    // Generate JWT token
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name || '',
      username: newUser.username,
      role: newUser.role,
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
      message: 'User registered successfully',
      token, // Include token in response for Bearer auth clients
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
      },
    } as AuthResponse, { status: 201 });

    response.headers.set('Set-Cookie', cookie);
    return response;

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An error occurred during registration',
      } as AuthResponse,
      { status: 500 }
    );
  }
}
