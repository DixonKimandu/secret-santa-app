import bcrypt from 'bcryptjs';
import prisma from './prisma';

let adminInitialized = false;

async function ensureAdminInitialized() {
  if (adminInitialized) return;

  const existingAdmins = await prisma.adminSetting.count();
  if (existingAdmins === 0) {
    const adminHash = bcrypt.hashSync('default-admin-password', 10);
    const superadminHash = bcrypt.hashSync('default-superadmin-password', 10);

    // MongoDB doesn't support skipDuplicates, so we use upsert instead
    await prisma.adminSetting.upsert({
      where: { role: 'admin' },
      update: {},
      create: { role: 'admin', passwordHash: adminHash },
    });

    await prisma.adminSetting.upsert({
      where: { role: 'superadmin' },
      update: {},
      create: { role: 'superadmin', passwordHash: superadminHash },
    });
  }

  adminInitialized = true;
}

// Participant functions
export async function addParticipant(name: string, email: string) {
  return prisma.participant.create({
    data: {
      name,
      email,
    },
  });
}

export async function getParticipants() {
  return prisma.participant.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function getParticipantByEmail(email: string) {
  return prisma.participant.findUnique({
    where: { email },
  });
}

export async function getParticipantById(id: string) {
  return prisma.participant.findUnique({
    where: { id },
  });
}

export async function getMatchedParticipantsButNotReceiver(excludeId: string) {
  // Get all participants excluding the current one
  // Then filter for those with a match
  const allParticipants = await prisma.participant.findMany({
    where: {
      id: { not: excludeId },
      matchedWithId: { not: null }, // Only include participants who have been matched
    },
    orderBy: { name: 'asc' },
  });
  
  // Filter for participants where their matchedWithId is not the excludeId
  return allParticipants.filter(p => p.matchedWithId !== excludeId);
}

export async function createMatch(participantId: string, matchedWithId: string) {
  return prisma.participant.update({
    where: { id: participantId },
    data: {
      hasSpun: true,
      matchedWithId,
    },
  });
}

export async function getAllMatches() {
  const participants = await prisma.participant.findMany({
    where: {
      hasSpun: true,
      matchedWithId: { not: null },
    },
    include: {
      matchedWith: true,
    },
    orderBy: { name: 'asc' },
  });

  return participants
    .filter((p) => p.matchedWith)
    .map((p) => ({
      participant_id: p.id,
      participant_name: p.name,
      participant_email: p.email,
      matched_id: p.matchedWith!.id,
      matched_name: p.matchedWith!.name,
      matched_email: p.matchedWith!.email,
    }));
}

export async function resetMatching() {
  await prisma.participant.updateMany({
    data: {
      hasSpun: false,
      matchedWithId: null,
      otpCode: null,
      otpExpiresAt: null,
    },
  });
}

export async function deleteParticipant(id: string) {
  // First, find the participant to check if they have matches
  const participant = await prisma.participant.findUnique({
    where: { id },
  });

  if (!participant) {
    throw new Error('Participant not found');
  }

  // Clear matches for participants who were matched with this participant
  // (set their matchedWithId to null and hasSpun to false)
  // This handles the case where other participants have this participant as their match
  await prisma.participant.updateMany({
    where: {
      matchedWithId: id,
    },
    data: {
      matchedWithId: null,
      hasSpun: false,
    },
  });

  // If this participant was matched with someone, we don't need to do anything special
  // The relation will be automatically cleared when we delete this participant
  // However, we might want to reset the matched participant's hasSpun status
  // For now, we'll leave it as is - they already spun, just their match is being removed

  // Now delete the participant
  await prisma.participant.delete({
    where: { id },
  });
}

export async function checkParticipantSpun(participantId: string) {
  const participant = await getParticipantById(participantId);
  return participant?.hasSpun === true;
}

// OTP functions
export async function storeOTP(email: string, otpCode: string, expiresAtSeconds: number) {
  const expiresAt = new Date(expiresAtSeconds * 1000);
  await prisma.participant.update({
    where: { email },
    data: {
      otpCode,
      otpExpiresAt: expiresAt,
    },
  });
}

export async function verifyOTP(
  email: string,
  otpCode: string
): Promise<{ valid: boolean; participantId?: string }> {
  const participant = await getParticipantByEmail(email);
  if (!participant || !participant.otpCode || !participant.otpExpiresAt) {
    return { valid: false };
  }

  const now = Date.now();
  if (participant.otpExpiresAt.getTime() < now) {
    return { valid: false };
  }

  if (participant.otpCode !== otpCode) {
    return { valid: false };
  }

  return { valid: true, participantId: participant.id };
}

export async function clearOTP(email: string) {
  await prisma.participant.update({
    where: { email },
    data: {
      otpCode: null,
      otpExpiresAt: null,
    },
  });
}

// Admin functions
export async function verifyAdminPassword(password: string, role: 'admin' | 'superadmin') {
  await ensureAdminInitialized();

  const admin = await prisma.adminSetting.findUnique({
    where: { role },
  });

  if (!admin) {
    return false;
  }

  return bcrypt.compareSync(password, admin.passwordHash);
}

export async function getAdminRole(
  password: string
): Promise<'admin' | 'superadmin' | null> {
  // Check superadmin first
  if (await verifyAdminPassword(password, 'superadmin')) {
    return 'superadmin';
  }
  // Then check admin
  if (await verifyAdminPassword(password, 'admin')) {
    return 'admin';
  }
  return null;
}

export async function updateAdminPassword(
  role: 'admin' | 'superadmin',
  newPassword: string
) {
  await ensureAdminInitialized();

  try {
    const passwordHash = bcrypt.hashSync(newPassword, 10);
    const updated = await prisma.adminSetting.updateMany({
      where: { role },
      data: { passwordHash },
    });
    return updated.count > 0;
  } catch (error) {
    console.error('Error updating admin password:', error);
    return false;
  }
}

export async function getParticipantsNotChosenAsReceiver() {
  // Get all participant IDs
  const allParticipantIds = (await prisma.participant.findMany({
    select: { id: true },
  })).map(p => p.id);

  // Get all IDs that have been chosen as a receiver (i.e., are matchedWithId)
  const chosenReceiverIds = (await prisma.participant.findMany({
    where: { matchedWithId: { not: null } },
    select: { matchedWithId: true },
    distinct: ['matchedWithId'], // Ensure unique receiver IDs
  })).map(p => p.matchedWithId!); // Use ! as we know it's not null from the where clause

  // Find participants whose IDs are in allParticipantIds but not in chosenReceiverIds
  const notChosenAsReceiverIds = allParticipantIds.filter(
    id => !chosenReceiverIds.includes(id)
  );

  // Fetch the full participant objects for these IDs
  return prisma.participant.findMany({
    where: {
      id: { in: notChosenAsReceiverIds },
    },
    orderBy: { name: 'asc' },
  });
}


