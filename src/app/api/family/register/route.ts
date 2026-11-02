import { NextRequest, NextResponse } from "next/server";
import { registerFamilyPack } from "@/lib/family";
import { signParticipantToken, setParticipantCookie } from "@/lib/session";
import { syncParticipantRegistration } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { familyHeadName, mobileNumber, memberNames } = body;

    const { familyPack, members } = await registerFamilyPack({
      familyHeadName,
      mobileNumber,
      memberNames: memberNames || [],
    });

    // The family head is the first member
    const headMember = members.find((m) => m.isFamilyHead) || members[0];

    const token = signParticipantToken({
      participantId: headMember.id,
      code: headMember.code,
      name: headMember.name,
      mobileNumber: headMember.mobileNumber,
      isCommittee: headMember.isCommittee,
      familyPackId: familyPack.id,
      isFamilyHead: true,
    });

    setParticipantCookie(token);

    // Sync all members to Google Sheet
    for (const m of members) {
      syncParticipantRegistration(m.id).catch((e) =>
        console.warn("Google Sheet sync error on family register:", e)
      );
    }

    return NextResponse.json({
      success: true,
      message: `ফ্যামিলি প্যাক (${familyPack.familyId}) সফলভাবে নিবন্ধিত ও লক করা হয়েছে!`,
      familyPack: {
        id: familyPack.id,
        familyId: familyPack.familyId,
        familyHeadName: familyPack.familyHeadName,
        mobileNumber: familyPack.mobileNumber,
        memberCount: familyPack.memberCount,
        isLocked: familyPack.isLocked,
        maxPossibleScore: familyPack.maxPossibleScore,
      },
      headMember: {
        id: headMember.id,
        code: headMember.code,
        name: headMember.name,
        isFamilyHead: true,
      },
      token,
    });
  } catch (err: any) {
    console.error("Family registration error:", err);
    return NextResponse.json(
      { error: err.message || "ফ্যামিলি প্যাক নিবন্ধন করতে সমস্যা হয়েছে" },
      { status: 400 }
    );
  }
}
