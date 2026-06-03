import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP, clearOTP, getParticipantById } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email, otpCode } = await request.json();

    if (!email || !otpCode) {
      return NextResponse.json(
        { error: 'Email and OTP code are required' },
        { status: 400 }
      );
    }

    const result = await verifyOTP(email.toLowerCase().trim(), otpCode.toString());

    if (!result.valid) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP code' },
        { status: 401 }
      );
    }

    // Clear OTP after successful verification (single-use)
    await clearOTP(email.toLowerCase().trim());

    const participant = await getParticipantById(result.participantId!);

    return NextResponse.json({
      success: true,
      participant: {
        id: participant!.id,
        name: participant!.name,
        email: participant!.email,
      },
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

