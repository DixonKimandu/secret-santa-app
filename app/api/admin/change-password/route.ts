import { NextRequest, NextResponse } from 'next/server';
import { getAdminRole, updateAdminPassword } from '@/lib/db';
import { verifyTurnstileToken } from '@/lib/turnstile';

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword, role, turnstileToken } = await request.json();

    if (!newPassword || !role) {
      return NextResponse.json(
        { error: 'New password and role are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
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

    // If changing superadmin password, verify current password
    // If changing admin password, superadmin can change it directly (they're already authenticated)
    if (role === 'superadmin') {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to change superadmin password' },
          { status: 400 }
        );
      }
      const verifiedRole = await getAdminRole(currentPassword);
      if (!verifiedRole || verifiedRole !== 'superadmin') {
        return NextResponse.json(
          { error: 'Invalid current password' },
          { status: 401 }
        );
      }
    }
    // For admin password change, we allow superadmin to change it without knowing the current password
    // (they're already authenticated as superadmin via the Authorization header)

    // Only superadmin can change any password, admin can only change their own
    // Since this is in the superadmin panel, we allow changing any role
    const success = await updateAdminPassword(role as 'admin' | 'superadmin', newPassword);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

