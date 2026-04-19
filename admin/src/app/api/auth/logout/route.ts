import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value;

  // Call backend logout to invalidate jwtVersion
  if (token) {
    try {
      await fetch(`${BACKEND_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Best effort — still clear cookie even if backend call fails
    }
  }

  const response = NextResponse.json({ success: true, message: 'Logged out' });
  response.cookies.set('admin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Delete cookie
  });

  return response;
}
