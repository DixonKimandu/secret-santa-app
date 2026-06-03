import { NextRequest, NextResponse } from 'next/server';
import { getParticipantByEmail, storeOTP } from '@/lib/db';
import { sendOTPEmail } from '@/lib/email';
import { verifyTurnstileToken } from '@/lib/turnstile';

export async function POST(request: NextRequest) {
  try {
    const { email, turnstileToken } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const participant = await getParticipantByEmail(email.toLowerCase().trim());

    if (!participant) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If this email is registered, an OTP has been sent.',
      });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Math.floor(Date.now() / 1000) + 600; // 10 minutes

    // Store OTP in database
    await storeOTP(participant.email, otpCode, expiresAt);

    // Send email
    try {
      await sendOTPEmail(participant.email, otpCode, participant.name);
    } catch (error: any) {
      console.error('Error sending OTP email:', error);
      // Return the detailed error message from the email function
      const errorMessage = error.message || 'Failed to send OTP email. Please check SMTP configuration.';
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email',
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

