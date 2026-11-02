import { NextRequest, NextResponse } from "next/server";
import {
  registerOrRetrieveIndividual,
  getOrCreateParticipant,
  setParticipantCookie,
} from "@/lib/session";
import { syncParticipantRegistration } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, mobileNumber, code, pin, confirmAccountChange, confirmChange } = body;
    const isConfirmed = !!confirmAccountChange || !!confirmChange;

    // 1. If mobile number is provided: Modern Individual Registration flow
    if (mobileNumber) {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: "তোমার নাম প্রদান করো" }, { status: 400 });
      }

      const res = await registerOrRetrieveIndividual(
        name,
        mobileNumber,
        isConfirmed
      );

      if (res.requiresConfirmation) {
        return NextResponse.json(
          {
            requiresConfirmation: true,
            warningMessage: res.warningMessage,
          },
          { status: 409 }
        );
      }

      const { participant, token, isNew } = res;
      if (token) setParticipantCookie(token);

      if (participant) {
        syncParticipantRegistration(participant.id).catch((e) =>
          console.warn("Google Sheet sync error on register:", e)
        );
      }

      return NextResponse.json({
        success: true,
        isNew,
        token,
        participant: {
          id: participant.id,
          name: participant.name,
          code: participant.code,
          mobileNumber: participant.mobileNumber,
          isCommittee: participant.isCommittee,
          attempts: participant.attempts || [],
        },
      });
    }

    // 2. Fallback / Legacy code-based registration flow
    if (!name && !code) {
      return NextResponse.json(
        { error: "তোমার নাম অথবা প্রতিযোগী কোড প্রদান করো" },
        { status: 400 }
      );
    }

    const { participant, token, isNew } = await getOrCreateParticipant(
      name || "",
      code || undefined,
      pin || "2026"
    );

    setParticipantCookie(token);

    syncParticipantRegistration(participant.id).catch((e) =>
      console.warn("Google Sheet sync error on register:", e)
    );

    return NextResponse.json({
      success: true,
      isNew,
      token,
      participant: {
        id: participant.id,
        name: participant.name,
        code: participant.code,
        mobileNumber: participant.mobileNumber,
        isCommittee: participant.isCommittee,
        attempts: participant.attempts || [],
      },
    });
  } catch (err: any) {
    console.error("Participant registration error:", err);
    return NextResponse.json(
      { error: err.message || "নিবন্ধন করতে সমস্যা হয়েছে" },
      { status: 400 }
    );
  }
}
