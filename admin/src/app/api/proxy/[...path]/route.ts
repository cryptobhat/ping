import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

async function proxyRequest(req: NextRequest, { params }: { params: { path: string[] } }) {
  const token = req.cookies.get('admin_token')?.value;

  if (!token) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  const path = params.path.join('/');
  const url = new URL(`/api/${path}`, BACKEND_URL);

  // Forward query parameters
  req.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try {
      fetchOptions.body = await req.text();
    } catch {
      // No body
    }
  }

  try {
    const backendRes = await fetch(url.toString(), fetchOptions);
    const data = await backendRes.json();

    if (backendRes.status === 401) {
      // Token invalid — clear cookie and redirect
      const response = NextResponse.json(data, { status: 401 });
      response.cookies.set('admin_token', '', { httpOnly: true, path: '/', maxAge: 0 });
      return response;
    }

    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Backend unreachable' },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
