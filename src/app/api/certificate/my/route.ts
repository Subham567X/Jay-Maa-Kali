import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyParticipantRequest } from "@/lib/session";
import { autoGenerateIndividualCertificate, autoGenerateFamilyCertificate } from "@/lib/certificates";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyParticipantRequest(req);
    if (!session) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস" }, { status: 401 });
    }

    // Try auto-generation if eligible
    await autoGenerateIndividualCertificate(session.participantId);

    // 1. If in a family pack
    if (session.familyPackId) {
      const family = await prisma.familyPack.findUnique({
        where: { id: session.familyPackId },
        include: {
          members: {
            include: { certificates: true },
          },
          certificates: true,
        },
      });

      if (!family) {
        return NextResponse.json({ error: "ফ্যামিলি প্যাক পাওয়া যায়নি" }, { status: 404 });
      }

      const isHead = session.isFamilyHead || session.name === family.familyHeadName;

      if (!isHead) {
        return NextResponse.json(
          {
            canAccess: false,
            hasFamilyCertificate: false,
            message: "ফ্যামিলি প্যাকের নিয়ম অনুযায়ী শুধুমাত্র পরিবার প্রধান (Family Head) সার্টিফিকেট দেখতে ও ডাউনলোড করতে পারেন।",
          },
          { status: 403 }
        );
      }

      // Try generating family certificate if eligible
      await autoGenerateFamilyCertificate(family.id);

      const refreshedFamily = await prisma.familyPack.findUnique({
        where: { id: family.id },
        include: {
          members: {
            include: { certificates: true },
          },
          certificates: true,
        },
      });

      const memberCertificates = (refreshedFamily?.members || []).map((m) => ({
        memberId: m.id,
        memberName: m.name,
        isHead: m.isFamilyHead,
        certificate: m.certificates.find((c) => c.type === "INDIVIDUAL") || null,
      }));

      const familyCertificate = refreshedFamily?.certificates.find((c) => c.type === "FAMILY") || null;

      return NextResponse.json({
        success: true,
        isFamily: true,
        isFamilyHead: true,
        hasFamilyCertificate: !!familyCertificate,
        familyCertificate,
        memberCertificates,
      });
    }

    // 2. Individual participant
    const certificate = await prisma.certificate.findFirst({
      where: { participantId: session.participantId, type: "INDIVIDUAL" },
    });

    return NextResponse.json({
      success: true,
      isFamily: false,
      certificate,
    });
  } catch (err: any) {
    console.error("Certificate fetch error:", err);
    return NextResponse.json({ error: "সার্টিফিকেট লোড করতে সমস্যা হয়েছে" }, { status: 500 });
  }
}
