import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/auth";
import { buildParticipantRowData } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস" }, { status: 401 });
    }

    const participants = await prisma.participant.findMany({
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });

    const headers = [
      "প্রতিযোগী কোড",
      "নাম",
      "রেজিস্ট্রেশনের সময়",
      "কমিটি সদস্য",
      "Day 1 স্কোর",
      "Day 1 সময়",
      "Day 2 স্কোর",
      "Day 2 সময়",
      "মোট স্কোর",
      "মোট সময়",
      "কুইজ স্ট্যাটাস",
      "সর্বশেষ আপডেট",
    ];

    let csvContent = "\uFEFF" + headers.join(",") + "\n"; // Include UTF-8 BOM for Excel Bengali rendering

    for (const p of participants) {
      const row = await buildParticipantRowData(p.id);
      if (row) {
        const line = [
          `"${row.code}"`,
          `"${row.name.replace(/"/g, '""')}"`,
          `"${row.registeredAt}"`,
          `"${row.isCommittee}"`,
          `"${row.day1Score}"`,
          `"${row.day1Duration}"`,
          `"${row.day2Score}"`,
          `"${row.day2Duration}"`,
          `"${row.totalScore}"`,
          `"${row.totalDuration}"`,
          `"${row.status}"`,
          `"${row.lastUpdated}"`,
        ].join(",");
        csvContent += line + "\n";
      }
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="nakunda_participants_scores_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err: any) {
    console.error("Sheets export error:", err);
    return NextResponse.json({ error: "CSV ফাইল এক্সপোর্ট করতে সমস্যা হয়েছে" }, { status: 500 });
  }
}
