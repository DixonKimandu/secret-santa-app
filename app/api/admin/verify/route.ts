import { NextRequest, NextResponse } from 'next/server';
import { getAdminRole } from '@/lib/db';
import { verifyTurnstileToken } from '@/lib/turnstile';

export async function POST(request: NextRequest) {
  try {
    const { password, turnstileToken } = await request.json();

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Verify Turnstile token
    if (!turnstileToken || !(await verifyTurnstileToken(turnstileToken))) {
      return NextResponse.json(
        { error: 'Human verification failed. Please complete the verification challenge.' },
        { status: 403 }
      );
    }

    const role = await getAdminRole(password);

    if (!role) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    return NextResponse.json({ role, success: true });
  } catch (error) {
    console.error('Error verifying admin:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

