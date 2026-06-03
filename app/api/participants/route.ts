import { NextRequest, NextResponse } from 'next/server';
import { getParticipants, addParticipant, getAdminRole } from '@/lib/db';

export async function GET(request: NextRequest) {
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

    if (!role) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const participants = await getParticipants();
    return NextResponse.json({
      participants: participants.map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        has_spun: p.hasSpun,
      })),
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    if (!role) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const { name, email } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
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

    try {
      const participant = await addParticipant(name.trim(), email.trim().toLowerCase());
      return NextResponse.json({
        success: true,
        participant: {
          id: participant.id,
          name: name.trim(),
          email: email.trim().toLowerCase(),
        },
      });
    } catch (error: any) {
      if (error.message?.includes('UNIQUE constraint')) {
        return NextResponse.json(
          { error: 'Participant with this name or email already exists' },
          { status: 409 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error adding participant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

