import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { comparePassword, generateToken } from '@/lib/auth';
import { LoginRequest, AuthResponse, User } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Username and password are required',
        } as AuthResponse,
        { status: 400 }
      );
    }

    // Connect to database
    const db = await getDatabase();
    const usersCollection = db.collection<User>('users');

    // Find user by username
    const user = await usersCollection.findOne({ username });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid username or password',
        } as AuthResponse,
        { status: 401 }
      );
    }

    // Compare passwords
    const passwordMatch = await comparePassword(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid username or password',
        } as AuthResponse,
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    // Return success response with token
    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      } as AuthResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during login',
      } as AuthResponse,
      { status: 500 }
    );
  }
}
