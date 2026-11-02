import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyParticipantRequest } from "@/lib/session";
import { verifyAdminRequest } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const id = searchParams.get("id");

    if (!code && !id) {
      return NextResponse.json({ error: "সার্টিফিকেট কোড বা আইডি দিন" }, { status: 400 });
    }

    const certificate = await prisma.certificate.findFirst({
      where: {
        OR: [
          code ? { certificateCode: code.trim().toUpperCase() } : {},
          id ? { id } : {},
        ],
      },
      include: {
        participant: true,
        familyPack: {
          include: { members: true },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json({ error: "সার্টিফিকেট পাওয়া যায়নি" }, { status: 404 });
    }

    // Authorization check
    const adminSession = await verifyAdminRequest(req);
    const participantSession = await verifyParticipantRequest(req);

    let isAuthorized = false;

    if (adminSession) {
      isAuthorized = true;
    } else if (participantSession) {
      // 1. Direct recipient of individual certificate
      if (certificate.participantId === participantSession.participantId) {
        // If part of family pack, only family head can download
        if (participantSession.familyPackId) {
          isAuthorized = !!participantSession.isFamilyHead;
        } else {
          isAuthorized = true;
        }
      }

      // 2. Family Head downloading member certificate
      if (certificate.familyPackId && certificate.familyPackId === participantSession.familyPackId) {
        isAuthorized = !!participantSession.isFamilyHead;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "এই সার্টিফিকেট ডাউনলোড করার অনুমতি আপনার নেই। ফ্যামিলি প্যাকে কেবল পরিবার প্রধান ডাউনলোড করতে পারেন।" },
        { status: 403 }
      );
    }

    // Locate PDF file
    const localDir = path.join(process.cwd(), "public", "certificates");
    const tmpDir = path.join("/tmp", "certificates");
    let filePath = path.join(localDir, `${certificate.certificateCode}.pdf`);
    if (!fs.existsSync(filePath) && fs.existsSync(path.join(tmpDir, `${certificate.certificateCode}.pdf`))) {
      filePath = path.join(tmpDir, `${certificate.certificateCode}.pdf`);
    }

    if (!fs.existsSync(filePath)) {
      // Regenerate if missing
      const { generateCertificatePDF } = await import("@/lib/certificates");
      await generateCertificatePDF({
        certificateCode: certificate.certificateCode,
        type: certificate.type as any,
        recipientName: certificate.recipientName,
        kaliPujaScore: certificate.kaliPujaScore,
        bhaiPhontaScore: certificate.bhaiPhontaScore,
        combinedScore: certificate.combinedScore,
        maxScore: certificate.maxScore,
        percentage: certificate.percentage,
        grade: certificate.grade,
        achievementTitle: certificate.achievementTitle,
        metadata: certificate.metadataJson ? JSON.parse(certificate.metadataJson) : undefined,
      });
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "পিডিএফ ফাইল তৈরি করতে ব্যর্থ হয়েছে" }, { status: 500 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${certificate.certificateCode}.pdf"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (err: any) {
    console.error("Certificate download error:", err);
    return NextResponse.json({ error: "ডাউনলোড করতে ত্রুটি হয়েছে" }, { status: 500 });
  }
}
