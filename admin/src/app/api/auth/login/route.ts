import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, otp } = body;

    // Forward to backend verify-otp
    const backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });

    const data = await backendRes.json();

    if (!backendRes.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || 'Login failed' },
        { status: backendRes.status }
      );
    }

    // Check if new user (not allowed for admin)
    if (data.data.isNewUser) {
      return NextResponse.json(
        { success: false, message: 'No account found. Admin users must be pre-created.' },
        { status: 403 }
      );
    }

    // Server-side role check — only ADMIN can access
    const user = data.data.user;
    if (!user || user.role === 'USER') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    const token = data.data.token;

    // Set httpOnly cookie with the token
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          phone: user.phone,
          role: user.role,
          profileImage: user.profileImage,
        },
      },
    });

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
