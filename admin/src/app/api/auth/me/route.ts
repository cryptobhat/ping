import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value;

  if (!token) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/v1/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!backendRes.ok) {
      // Token expired or revoked — clear cookie
      const response = NextResponse.json({ success: false, message: 'Session expired' }, { status: 401 });
      response.cookies.set('admin_token', '', { httpOnly: true, path: '/', maxAge: 0 });
      return response;
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ success: false, message: 'Backend unreachable' }, { status: 502 });
  }
}
