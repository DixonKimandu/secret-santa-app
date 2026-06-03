import { NextRequest, NextResponse } from 'next/server';
import { getParticipantById, checkParticipantSpun, getAllMatches } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { participantId } = await request.json();

    if (!participantId || typeof participantId !== 'string') {
      return NextResponse.json(
        { error: 'Participant ID is required' },
        { status: 400 }
      );
    }

    const participant = await getParticipantById(participantId);

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    const hasSpun = await checkParticipantSpun(participantId);

    if (!hasSpun) {
      return NextResponse.json({
        hasSpun: false,
      });
    }

    // If they've spun, find their match
    const allMatches = await getAllMatches();
    const match = allMatches.find((m) => m.participant_id === participantId);

    if (match) {
      return NextResponse.json({
        hasSpun: true,
        matchedParticipant: {
          id: match.matched_id,
          name: match.matched_name,
        },
      });
    }

    return NextResponse.json({
      hasSpun: true,
      matchedParticipant: null,
    });
  } catch (error) {
    console.error('Error checking spin status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

