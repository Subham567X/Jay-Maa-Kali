import { NextRequest, NextResponse } from "next/server";
import { joinExistingFamilyPack } from "@/lib/family";
import { signParticipantToken, setParticipantCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { memberName, mobileNumber, familyId } = body;

    const { familyPack, member } = await joinExistingFamilyPack({
      memberName,
      mobileNumber,
      familyId,
    });

    const token = signParticipantToken({
      participantId: member.id,
      code: member.code,
      name: member.name,
      mobileNumber: member.mobileNumber,
      isCommittee: member.isCommittee,
      familyPackId: familyPack.id,
      isFamilyHead: member.isFamilyHead,
    });

    setParticipantCookie(token);

    return NextResponse.json({
      success: true,
      message: `স্বাগতম ${member.name}! আপনি সফলভাবে ফ্যামিলি প্যাক (${familyPack.familyId})-এ প্রবেশ করেছেন।`,
      familyPack: {
        id: familyPack.id,
        familyId: familyPack.familyId,
        familyHeadName: familyPack.familyHeadName,
        memberCount: familyPack.memberCount,
        familyScore: familyPack.familyScore,
      },
      member: {
        id: member.id,
        code: member.code,
        name: member.name,
        isFamilyHead: member.isFamilyHead,
        isCommittee: member.isCommittee,
        attempts: member.attempts || [],
      },
      token,
    });
  } catch (err: any) {
    console.error("Family join error:", err);
    return NextResponse.json(
      { error: err.message || "ফ্যামিলি প্যাকে যোগ দিতে ব্যর্থ হয়েছে" },
      { status: 400 }
    );
  }
}
