import { NextRequest, NextResponse } from 'next/server';
import { getParticipants } from '@/lib/db';

// Public endpoint to get participant names for the wheel
// Only returns names and IDs, no sensitive information
export async function GET(request: NextRequest) {
  try {
    const participants = await getParticipants();
    
    // Return only name and id for the wheel visualization
    const wheelParticipants = participants.map((p) => ({
      id: p.id,
      name: p.name,
    }));

    return NextResponse.json({ participants: wheelParticipants });
  } catch (error) {
    console.error('Error fetching participants for wheel:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

