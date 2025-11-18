import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";
import { Session } from "next-auth";

type AuthSuccess = {
  error: false;
  session: Session;
  userId: string;
};

type AuthError = {
  error: true;
  response: NextResponse;
};

export async function getAuthSession() {
  return await getServerSession(authOptions);
}

export async function requireAuth(): Promise<AuthSuccess | AuthError> {
  const session = await getAuthSession();

  if (!session || !session.user || !session.user.id) {
    return {
      error: true,
      response: NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      ),
    };
  }

  return {
    error: false,
    session,
    userId: session.user.id,
  };
}
