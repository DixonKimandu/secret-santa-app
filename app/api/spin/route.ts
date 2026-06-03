import { NextRequest, NextResponse } from 'next/server';
import {
  getParticipantById,
  createMatch,
  checkParticipantSpun,
  getParticipantsNotChosenAsReceiver,
} from '@/lib/db';
import { sendMatchConfirmationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { participantId } = await request.json();

    console.log('Spin request received:', { participantId, type: typeof participantId });

    if (!participantId || typeof participantId !== 'string') {
      console.error('Invalid participantId:', { participantId, type: typeof participantId });
      return NextResponse.json(
        { error: 'Participant ID is required and must be a string' },
        { status: 400 }
      );
    }

    const participant = await getParticipantById(participantId);
    console.log('Participant found:', participant ? { id: participant.id, name: participant.name } : 'not found');

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    // Check if participant has already spun
    const hasSpun = await checkParticipantSpun(participantId);
    console.log('Participant has spun:', hasSpun);
    if (hasSpun) {
      return NextResponse.json(
        { error: 'You have already spun the wheel' },
        { status: 400 }
      );
    }

    // Get available participants (excluding self and those already chosen as a receiver)
    let availableParticipants = await getParticipantsNotChosenAsReceiver();

    // Exclude the current participant (spinner) from the list of available matches
    availableParticipants = availableParticipants.filter(p => p.id !== participantId);
    console.log('Available participants after excluding self:', availableParticipants.length, availableParticipants.map((p: any) => ({ id: p.id, name: p.name })));

    if (availableParticipants.length === 0) {
      console.error('No available participants found for participantId:', participantId);
      return NextResponse.json(
        { error: 'No available participants to match with. Make sure there are at least 2 participants and others haven\'t all spun yet.' },
        { status: 400 }
      );
    }

    // Randomly select a match
    const randomIndex = Math.floor(Math.random() * availableParticipants.length);
    const matchedParticipant = availableParticipants[randomIndex];

    // Create the match
    try {
      await createMatch(participantId, matchedParticipant.id);
      console.log('Match created successfully:', { participantId, matchedWithId: matchedParticipant.id });
    } catch (error: any) {
      console.error('Failed to create match:', error);
      throw error; // Re-throw to be caught by outer catch
    }

    // Send confirmation email (don't block on email failure)
    try {
      await sendMatchConfirmationEmail(
        participant.email,
        participant.name,
        matchedParticipant.name
      );
      console.log('Match confirmation email sent successfully');
    } catch (error: any) {
      // Log error but don't fail the request if email fails
      console.error('Failed to send match confirmation email:', error);
      // Continue - the match is still created successfully
    }

    // Return the match result so the user can see who they're matched with
    return NextResponse.json({
      success: true,
      message: 'Wheel spun successfully!',
      matchedParticipant: {
        id: matchedParticipant.id,
        name: matchedParticipant.name,
      },
    });
  } catch (error: any) {
    console.error('Error spinning wheel:', error);
    const errorMessage = error?.message || 'Internal server error';
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === 'development' ? error?.stack : undefined },
      { status: 500 }
    );
  }
}

