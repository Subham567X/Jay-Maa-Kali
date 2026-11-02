import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const published = await prisma.winnerApproval.findFirst({
      where: { status: "PUBLISHED" },
      include: {
        participant: true,
      },
    });

    if (!published) {
      return NextResponse.json({
        hasPublishedWinner: false,
        message: "উভয় দিনের কুইজ সমাপ্তির পর ফলাফল যাচাইপূর্বক চুড়ান্ত সম্মাননা সার্টিফিকেট প্রকাশিত হবে।",
      });
    }

    return NextResponse.json({
      hasPublishedWinner: true,
      certificate: {
        title: "মায়ের আশীর্বাদ – শ্রেষ্ঠ জ্ঞানী সম্মান ২০২৬",
        winnerName: published.participantName,
        eventName: "নকুন্ডা কালীপূজা ২০২৬ বিশেষ মহাজ্ঞান কুইজ",
        year: "২০২৬",
        certificateCode: published.certificateCode,
        day1Score: published.day1Score,
        day2Score: published.day2Score,
        combinedScore: published.combinedScore,
        blessingMessage: "মা ভবতারিণীর রাতুল চরণে তোমার ভক্তি, মেধা ও একাগ্রতা চিরভাস্বর থাকুক। মায়ের আশীর্বাদে তোমার ভবিষ্যৎ জীবন আনন্দ ও আলোকময় হোক।",
        committeeSignatory: "নকুন্ডা কালীপূজা কমিটির সকল সদস্য ও সদস্যাবৃন্দ",
        publishedAt: published.approvedAt || published.updatedAt,
      },
    });
  } catch (err: any) {
    console.error("Certificate fetch error:", err);
    return NextResponse.json({ error: "সার্টিফিকেট তথ্য লোড করতে ব্যর্থ" }, { status: 500 });
  }
}
