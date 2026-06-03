import { NextRequest, NextResponse } from 'next/server';
import { resetMatching, getAdminRole } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const password = authHeader.substring(7);
    const role = await getAdminRole(password);

    if (!role || role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Superadmin access required' },
        { status: 403 }
      );
    }

    await resetMatching();
    return NextResponse.json({
      success: true,
      message: 'All matches have been reset',
    });
  } catch (error) {
    console.error('Error resetting matches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

