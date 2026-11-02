import { prisma } from "./prisma";
import { normalizeName, checkCommitteeExclusion } from "./committee";
import { generateParticipantCode } from "./session";

export interface FamilyRegistrationMemberInput {
  name: string;
}

export interface RegisterFamilyPackInput {
  familyHeadName: string;
  mobileNumber: string;
  memberNames: string[]; // 4 to 9 additional member names (total 5 to 10 including Head)
}

/**
 * Validates a 10-digit Indian mobile number.
 */
export function validateIndianMobile(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-+]/g, "");
  // If prefixed with 91 or 0, strip down to 10 digits
  const last10 = cleaned.slice(-10);
  return /^[6-9]\d{9}$/.test(last10);
}

export function cleanIndianMobile(phone: string): string {
  const cleaned = phone.replace(/[\s\-+]/g, "");
  return cleaned.slice(-10);
}

/**
 * Generates an intuitive unique Family ID, e.g. FAM-2026-4821
 */
export async function generateUniqueFamilyId(): Promise<string> {
  let familyId = `FAM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  let exists = await prisma.familyPack.findUnique({ where: { familyId } });
  while (exists) {
    familyId = `FAM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    exists = await prisma.familyPack.findUnique({ where: { familyId } });
  }
  return familyId;
}

/**
 * Registers a new Family Pack with 5 to 10 members.
 * Creates separate Participant profiles for all members sharing the Family Head's mobile number.
 * Permanently locks the family list upon creation.
 */
export async function registerFamilyPack(input: RegisterFamilyPackInput) {
  const { familyHeadName, mobileNumber, memberNames } = input;

  if (!familyHeadName || !familyHeadName.trim()) {
    throw new Error("পরিবার প্রধানের (Family Head) নাম আবশ্যক");
  }

  const cleanPhone = cleanIndianMobile(mobileNumber);
  if (!validateIndianMobile(cleanPhone)) {
    throw new Error("অনুগ্রহ করে একটি সঠিক ১০-সংখ্যার ভারতীয় মোবাইল নম্বর দিন");
  }

  // Combine family head + additional members
  const allNames = [
    familyHeadName.trim(),
    ...memberNames.map((n) => n.trim()).filter((n) => n.length > 0),
  ];

  if (allNames.length < 5) {
    throw new Error("ফ্যামিলি প্যাকে সর্বনিম্ন ৫ জন সদস্য থাকা আবশ্যক");
  }
  if (allNames.length > 10) {
    throw new Error("ফ্যামিলি প্যাকে সর্বোচ্চ ১০ জন সদস্য নিবন্ধন করা যাবে");
  }

  // Check for duplicate names within the same family registration
  const normalizedSet = new Set<string>();
  for (const name of allNames) {
    const norm = normalizeName(name);
    if (normalizedSet.has(norm)) {
      throw new Error(`একই পরিবারে "${name}" নামটি একাধিকবার দেওয়া হয়েছে। প্রতিটি সদস্যের নাম আলাদা হতে হবে।`);
    }
    normalizedSet.add(norm);
  }

  // Check if a family pack with this mobile number already exists
  const existingFamily = await prisma.familyPack.findFirst({
    where: { mobileNumber: cleanPhone },
  });
  if (existingFamily) {
    throw new Error(
      `এই মোবাইল নম্বরটিতে (${cleanPhone}) ইতিমধ্যে একটি ফ্যামিলি প্যাক (${existingFamily.familyId}) নিবন্ধিত রয়েছে। অনুগ্রহ করে বিদ্যমান ফ্যামিলি প্যাকে যোগ দিন।`
    );
  }

  const familyId = await generateUniqueFamilyId();
  const maxPossibleScore = allNames.length * 100;

  // Transaction: Create FamilyPack and all individual Participant records
  const result = await prisma.$transaction(async (tx) => {
    const familyPack = await tx.familyPack.create({
      data: {
        familyId,
        familyHeadName: familyHeadName.trim(),
        mobileNumber: cleanPhone,
        memberCount: allNames.length,
        isLocked: true, // Permanently locked!
        maxPossibleScore,
      },
    });

    const createdMembers = [];

    for (let i = 0; i < allNames.length; i++) {
      const name = allNames[i];
      const isHead = i === 0;
      const norm = normalizeName(name);

      // Check committee match
      const committeeCheck = await checkCommitteeExclusion(name);

      // Unique participant code
      let code = `MK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      let codeExists = await tx.participant.findUnique({ where: { code } });
      while (codeExists) {
        code = `MK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        codeExists = await tx.participant.findUnique({ where: { code } });
      }

      const participant = await tx.participant.create({
        data: {
          code,
          name,
          normalizedName: norm,
          mobileNumber: cleanPhone,
          isFamilyHead: isHead,
          familyPackId: familyPack.id,
          isCommittee: committeeCheck.isCommittee,
          committeeMatchReason: committeeCheck.matchReason || null,
        },
      });

      createdMembers.push(participant);
    }

    return { familyPack, members: createdMembers };
  });

  return result;
}

/**
 * Validates and authenticates a family member joining on their separate device.
 */
export async function joinExistingFamilyPack(input: {
  memberName: string;
  mobileNumber: string;
  familyId?: string;
}) {
  const { memberName, mobileNumber, familyId } = input;

  if (!memberName || !memberName.trim()) {
    throw new Error("আপনার নিবন্ধিত নামটি লিখুন");
  }

  const cleanPhone = cleanIndianMobile(mobileNumber);
  if (!validateIndianMobile(cleanPhone)) {
    throw new Error("সঠিক ১০-সংখ্যার পারিবারিক মোবাইল নম্বর প্রদান করুন");
  }

  // Find family pack by mobile number (and familyId if provided)
  const familyPack = await prisma.familyPack.findFirst({
    where: {
      mobileNumber: cleanPhone,
      ...(familyId ? { familyId: familyId.trim().toUpperCase() } : {}),
    },
    include: {
      members: {
        include: { attempts: true },
      },
    },
  });

  if (!familyPack) {
    throw new Error("প্রদত্ত মোবাইল নম্বর বা ফ্যামিলি আইডি দিয়ে কোনো ফ্যামিলি প্যাক খুঁজে পাওয়া যায়নি");
  }

  const normInput = normalizeName(memberName.trim());

  // Match against locked members list
  const member = familyPack.members.find(
    (m) =>
      m.normalizedName === normInput ||
      normalizeName(m.name) === normInput ||
      m.name.trim().toLowerCase() === memberName.trim().toLowerCase()
  );

  if (!member) {
    throw new Error(
      `"${memberName}" নামটি এই ফ্যামিলি প্যাকের নিবন্ধিত সদস্যদের তালিকায় নেই। অনুগ্রহ করে সঠিক বানানে নিবন্ধিত নাম লিখুন।`
    );
  }

  return { familyPack, member };
}

/**
 * Recalculates and updates the aggregated family score, percentage, and completion status.
 */
export async function recalculateFamilyScore(familyPackId: string) {
  const family = await prisma.familyPack.findUnique({
    where: { id: familyPackId },
    include: {
      members: {
        include: {
          attempts: {
            where: { isCompleted: true, isInvalidated: false },
            include: { quizEvent: true },
          },
        },
      },
    },
  });

  if (!family) return null;

  let totalFamilyScore = 0;
  let allMembersCompletedBoth = true;

  const memberSummary = family.members.map((member) => {
    const day1Attempt = member.attempts.find((a) => a.quizEvent.dayNumber === 1);
    const day2Attempt = member.attempts.find((a) => a.quizEvent.dayNumber === 2);

    const day1Score = day1Attempt?.score ?? 0;
    const day2Score = day2Attempt?.score ?? 0;
    const combinedScore = day1Score + day2Score;

    totalFamilyScore += combinedScore;

    if (!day1Attempt || !day2Attempt) {
      allMembersCompletedBoth = false;
    }

    return {
      memberId: member.id,
      name: member.name,
      isHead: member.isFamilyHead,
      day1Score,
      day2Score,
      combinedScore,
      bothCompleted: !!(day1Attempt && day2Attempt),
    };
  });

  const maxPossible = family.members.length * 100;
  const percentage = maxPossible > 0 ? (totalFamilyScore / maxPossible) * 100 : 0;
  const isEligible = allMembersCompletedBoth && percentage >= 40;

  const updatedFamily = await prisma.familyPack.update({
    where: { id: familyPackId },
    data: {
      familyScore: totalFamilyScore,
      maxPossibleScore: maxPossible,
      achievementPercentage: Number(percentage.toFixed(2)),
      isEligibleForCertificate: isEligible,
    },
  });

  return {
    familyPack: updatedFamily,
    allMembersCompletedBoth,
    memberSummary,
  };
}
