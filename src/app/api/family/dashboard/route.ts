import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyParticipantRequest } from "@/lib/session";
import { recalculateFamilyScore, cleanIndianMobile } from "@/lib/family";
import { checkIndividualEligibility } from "@/lib/certificates";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyParticipantRequest(req);
    const { searchParams } = new URL(req.url);
    const queryFamilyId = searchParams.get("familyId");
    const queryMobile = searchParams.get("mobileNumber");

    let familyPackId = session?.familyPackId || null;

    if (!familyPackId && (queryFamilyId || queryMobile)) {
      const found = await prisma.familyPack.findFirst({
        where: {
          OR: [
            queryFamilyId ? { familyId: queryFamilyId.trim().toUpperCase() } : {},
            queryMobile ? { mobileNumber: cleanIndianMobile(queryMobile) } : {},
          ],
        },
      });
      if (found) familyPackId = found.id;
    }

    if (!familyPackId) {
      return NextResponse.json(
        { error: "কোনো ফ্যামিলি প্যাক সেশন বা আইডি পাওয়া যায়নি" },
        { status: 404 }
      );
    }

    // Refresh aggregated score
    await recalculateFamilyScore(familyPackId);

    const family = await prisma.familyPack.findUnique({
      where: { id: familyPackId },
      include: {
        members: {
          include: {
            attempts: {
              where: { isCompleted: true, isInvalidated: false },
              include: { quizEvent: true },
            },
            certificates: {
              where: { type: "INDIVIDUAL" },
            },
          },
        },
        certificates: {
          where: { type: "FAMILY" },
        },
      },
    });

    if (!family) {
      return NextResponse.json({ error: "ফ্যামিলি প্যাক খুঁজে পাওয়া যায়নি" }, { status: 404 });
    }

    const isFamilyHead = session ? session.isFamilyHead || session.name === family.familyHeadName : false;

    // Build member scorecard
    let allCompleted = true;
    const membersData = family.members.map((m) => {
      const d1 = m.attempts.find((a) => a.quizEvent.dayNumber === 1);
      const d2 = m.attempts.find((a) => a.quizEvent.dayNumber === 2);

      const d1Score = d1?.score ?? null;
      const d2Score = d2?.score ?? null;
      const combined = (d1Score ?? 0) + (d2Score ?? 0);
      const bothDone = d1 !== undefined && d2 !== undefined;

      if (!bothDone) allCompleted = false;

      const eligibility = checkIndividualEligibility(d1Score, d2Score);

      return {
        id: m.id,
        code: m.code,
        name: m.name,
        isHead: m.isFamilyHead,
        day1Score: d1Score !== null ? `${d1Score} / 50` : "অসম্পূর্ণ",
        day2Score: d2Score !== null ? `${d2Score} / 50` : "অসম্পূর্ণ",
        combinedScore: bothDone ? `${combined} / 100` : "-",
        rawCombined: combined,
        bothCompleted: bothDone,
        isIndividualEligible: eligibility.isEligible,
        hasIndividualCertificate: m.certificates.length > 0,
        individualCertificate: isFamilyHead && m.certificates.length > 0 ? m.certificates[0] : null,
      };
    });

    const maxScore = family.members.length * 100;
    const percentage = maxScore > 0 ? Number(((family.familyScore / maxScore) * 100).toFixed(1)) : 0;
    const isFamilyEligible = allCompleted && percentage >= 40;

    const familyCert = family.certificates.find((c) => c.type === "FAMILY");

    return NextResponse.json({
      success: true,
      totalFamilyScore: family.familyScore,
      family: {
        id: family.id,
        familyId: family.familyId,
        familyHeadName: family.familyHeadName,
        mobileNumber: isFamilyHead ? family.mobileNumber : `${family.mobileNumber.slice(0, 3)}****${family.mobileNumber.slice(-3)}`,
        memberCount: family.members.length,
        isLocked: family.isLocked,
        familyScore: family.familyScore,
        maxPossibleScore: maxScore,
        achievementPercentage: percentage,
        allMembersCompletedBoth: allCompleted,
        isEligibleForCertificate: isFamilyEligible,
      },
      members: membersData,
      isFamilyHead,
      canAccessCertificates: isFamilyHead, // Only Family Head can view/download
      familyCertificate: isFamilyHead && familyCert ? familyCert : null,
      statusMessage: allCompleted
        ? isFamilyEligible
          ? "অভিনন্দন! আপনার পরিবার সম্মিলিতভাবে ৪০% এর বেশি নম্বর অর্জন করে ফ্যামিলি অ্যাচিভমেন্ট সার্টিফিকেটের যোগ্যতা অর্জন করেছে!"
          : "সকল সদস্য কুইজ সম্পন্ন করেছেন। তবে সার্টিফিকেটের জন্য প্রয়োজনীয় ৪০% পূর্ণ হয়নি।"
        : "পরিবারের সকল সদস্য এখনও উভয় কুইজ সম্পন্ন করেননি। সবাই কুইজ সম্পন্ন করলে ফাইনাল ফ্যামিলি সার্টিফিকেট মূল্যায়িত হবে।",
    });
  } catch (err: any) {
    console.error("Family dashboard error:", err);
    return NextResponse.json({ error: "ড্যাশবোর্ড লোড করতে সমস্যা হয়েছে" }, { status: 500 });
  }
}
