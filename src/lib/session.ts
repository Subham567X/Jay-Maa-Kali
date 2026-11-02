import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";
import { normalizeName, checkCommitteeExclusion } from "./committee";
import { validateIndianMobile, cleanIndianMobile } from "./family";

const JWT_SECRET = process.env.JWT_SECRET || "nakunda_kali_puja_secret_token_2026_divine_blessings";
const PARTICIPANT_COOKIE = "nakunda_participant_session";

export interface ParticipantSession {
  participantId: string;
  code: string;
  name: string;
  mobileNumber?: string | null;
  isCommittee: boolean;
  familyPackId?: string | null;
  isFamilyHead?: boolean;
}

export function signParticipantToken(payload: ParticipantSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyParticipantToken(token: string): ParticipantSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as ParticipantSession;
  } catch {
    return null;
  }
}

export async function getParticipantSession(): Promise<ParticipantSession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(PARTICIPANT_COOKIE)?.value;
  if (!token) return null;
  return verifyParticipantToken(token);
}

export async function verifyParticipantRequest(req: NextRequest): Promise<ParticipantSession | null> {
  const cookieToken = req.cookies.get(PARTICIPANT_COOKIE)?.value;
  const headerToken = req.headers.get("x-participant-token");
  const token = cookieToken || headerToken;
  if (!token) return null;
  return verifyParticipantToken(token);
}

export function setParticipantCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(PARTICIPANT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

export function clearParticipantCookie() {
  const cookieStore = cookies();
  cookieStore.delete(PARTICIPANT_COOKIE);
}

/**
 * Generates an intuitive participant code, e.g. MK-2026-4821
 */
export function generateParticipantCode(): string {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `MK-2026-${randomDigits}`;
}

export const ACCOUNT_CHANGE_WARNING_BN =
  "সতর্কবার্তা! আপনার নাম বা মোবাইল নম্বর পরিবর্তন করলে আগের কুইজের স্কোর ও অংশগ্রহণের সমস্ত রেকর্ড মুছে যাবে। আপনি কি নিশ্চিত?";

/**
 * Registers or retrieves an Individual Participant with 10-digit Indian Mobile Number.
 * Prevents multiple unrelated identities under the same mobile number.
 * Enforces confirmation dialog before overwriting or changing account details.
 */
export async function registerOrRetrieveIndividual(
  rawName: string,
  rawMobile: string,
  confirmAccountChange: boolean = false
): Promise<{
  participant?: any;
  token?: string;
  isNew?: boolean;
  requiresConfirmation?: boolean;
  warningMessage?: string;
}> {
  const trimmedName = rawName.trim();
  if (!trimmedName) {
    throw new Error("আপনার পূর্ণ নাম প্রদান করুন");
  }

  const cleanPhone = cleanIndianMobile(rawMobile);
  if (!validateIndianMobile(cleanPhone)) {
    throw new Error("সঠিক ১০ সংখ্যার ভারতীয় মোবাইল নম্বর লিখুন (উদাঃ 9876543210)");
  }

  const norm = normalizeName(trimmedName);

  // 1. Check if participant with this mobile number already exists (excluding family pack members)
  const existingByPhone = await prisma.participant.findFirst({
    where: {
      mobileNumber: cleanPhone,
      familyPackId: null, // Individual participants
    },
    include: { attempts: true },
  });

  if (existingByPhone) {
    // If the name matches, return cleanly
    if (existingByPhone.normalizedName === norm || existingByPhone.name.toLowerCase() === trimmedName.toLowerCase()) {
      const token = signParticipantToken({
        participantId: existingByPhone.id,
        code: existingByPhone.code,
        name: existingByPhone.name,
        mobileNumber: existingByPhone.mobileNumber,
        isCommittee: existingByPhone.isCommittee,
      });
      return { participant: existingByPhone, token, isNew: false };
    }

    // Name is different for the same mobile number: require confirmation
    if (!confirmAccountChange) {
      return {
        requiresConfirmation: true,
        warningMessage: ACCOUNT_CHANGE_WARNING_BN,
      };
    }

    // Confirmation provided: wipe previous quiz attempts and update name
    await prisma.quizAttempt.deleteMany({
      where: { participantId: existingByPhone.id },
    });

    const committeeCheck = await checkCommitteeExclusion(trimmedName);

    const updated = await prisma.participant.update({
      where: { id: existingByPhone.id },
      data: {
        name: trimmedName,
        normalizedName: norm,
        isCommittee: committeeCheck.isCommittee,
        committeeMatchReason: committeeCheck.matchReason || null,
      },
      include: { attempts: true },
    });

    const token = signParticipantToken({
      participantId: updated.id,
      code: updated.code,
      name: updated.name,
      mobileNumber: updated.mobileNumber,
      isCommittee: updated.isCommittee,
    });

    return { participant: updated, token, isNew: false };
  }

  // 2. Check committee exclusion
  const committeeCheck = await checkCommitteeExclusion(trimmedName);

  // 3. Generate unique participant code
  let code = generateParticipantCode();
  let codeExists = await prisma.participant.findUnique({ where: { code } });
  while (codeExists) {
    code = generateParticipantCode();
    codeExists = await prisma.participant.findUnique({ where: { code } });
  }

  const newParticipant = await prisma.participant.create({
    data: {
      name: trimmedName,
      normalizedName: norm,
      mobileNumber: cleanPhone,
      code,
      pinHash: "2026",
      isCommittee: committeeCheck.isCommittee,
      committeeMatchReason: committeeCheck.matchReason || null,
    },
    include: { attempts: true },
  });

  const token = signParticipantToken({
    participantId: newParticipant.id,
    code: newParticipant.code,
    name: newParticipant.name,
    mobileNumber: newParticipant.mobileNumber,
    isCommittee: newParticipant.isCommittee,
  });

  return { participant: newParticipant, token, isNew: true };
}

/**
 * Legacy lookup by code (backwards compatibility)
 */
export async function getOrCreateParticipant(
  rawName: string,
  existingCode?: string,
  pin: string = "2026"
): Promise<{ participant: any; token: string; isNew: boolean }> {
  const trimmedName = rawName.trim();
  const norm = normalizeName(trimmedName);

  if (existingCode && existingCode.trim().length > 0) {
    const byCode = await prisma.participant.findUnique({
      where: { code: existingCode.trim().toUpperCase() },
      include: { attempts: true },
    });
    if (byCode) {
      const token = signParticipantToken({
        participantId: byCode.id,
        code: byCode.code,
        name: byCode.name,
        mobileNumber: byCode.mobileNumber,
        isCommittee: byCode.isCommittee,
        familyPackId: byCode.familyPackId,
        isFamilyHead: byCode.isFamilyHead,
      });
      return { participant: byCode, token, isNew: false };
    }
  }

  const existingByName = await prisma.participant.findFirst({
    where: { normalizedName: norm },
    include: { attempts: true },
  });

  if (existingByName) {
    const token = signParticipantToken({
      participantId: existingByName.id,
      code: existingByName.code,
      name: existingByName.name,
      mobileNumber: existingByName.mobileNumber,
      isCommittee: existingByName.isCommittee,
      familyPackId: existingByName.familyPackId,
      isFamilyHead: existingByName.isFamilyHead,
    });
    return { participant: existingByName, token, isNew: false };
  }

  const committeeCheck = await checkCommitteeExclusion(trimmedName);

  let code = generateParticipantCode();
  let codeExists = await prisma.participant.findUnique({ where: { code } });
  while (codeExists) {
    code = generateParticipantCode();
    codeExists = await prisma.participant.findUnique({ where: { code } });
  }

  const participant = await prisma.participant.create({
    data: {
      name: trimmedName,
      normalizedName: norm,
      code,
      pinHash: pin,
      isCommittee: committeeCheck.isCommittee,
      committeeMatchReason: committeeCheck.matchReason || null,
    },
    include: { attempts: true },
  });

  const token = signParticipantToken({
    participantId: participant.id,
    code: participant.code,
    name: participant.name,
    mobileNumber: participant.mobileNumber,
    isCommittee: participant.isCommittee,
  });

  return { participant, token, isNew: true };
}
