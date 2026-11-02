import { prisma } from "./prisma";
import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";

export interface GradeInfo {
  grade: string;
  titleBn: string;
  titleEn: string;
}

/**
 * Maps score (0-100) or percentage (0-100) to Official Grade and Title.
 */
export function getGradeAndTitle(scoreOrPercentage: number): GradeInfo {
  const rounded = Math.round(scoreOrPercentage);

  if (rounded >= 100) {
    return {
      grade: "O",
      titleBn: "অসাধারণ কৃতিত্ব",
      titleEn: "Outstanding Achievement",
    };
  }
  if (rounded >= 90) {
    return {
      grade: "A+",
      titleBn: "বিশেষ কৃতিত্ব",
      titleEn: "Excellent Achievement",
    };
  }
  if (rounded >= 80) {
    return {
      grade: "A",
      titleBn: "প্রশংসনীয় কৃতিত্ব",
      titleEn: "Very Good Achievement",
    };
  }
  if (rounded >= 70) {
    return {
      grade: "B+",
      titleBn: "উল্লেখযোগ্য কৃতিত্ব",
      titleEn: "Notable Achievement",
    };
  }
  if (rounded >= 60) {
    return {
      grade: "B",
      titleBn: "ভালো কৃতিত্ব",
      titleEn: "Good Achievement",
    };
  }
  if (rounded >= 50) {
    return {
      grade: "C",
      titleBn: "অংশগ্রহণে কৃতিত্ব",
      titleEn: "Meritorious Participation",
    };
  }
  return {
    grade: "D",
    titleBn: "অংশগ্রহণের স্বীকৃতি",
    titleEn: "Participation Recognition",
  };
}

/**
 * Evaluates individual certificate eligibility.
 * Mandatory rules:
 * - Both Day 1 and Day 2 quizzes completed
 * - Day 1 score >= 20 / 50
 * - Day 2 score >= 20 / 50
 * - Combined score >= 40 / 100
 */
export function checkIndividualEligibility(
  day1Score: number | null | undefined,
  day2Score: number | null | undefined
): {
  isEligible: boolean;
  day1Passed: boolean;
  day2Passed: boolean;
  combinedPassed: boolean;
  combinedScore: number;
  message: string;
} {
  const d1 = day1Score ?? -1;
  const d2 = day2Score ?? -1;

  if (d1 < 0 || d2 < 0) {
    return {
      isEligible: false,
      day1Passed: d1 >= 20,
      day2Passed: d2 >= 20,
      combinedPassed: false,
      combinedScore: Math.max(0, d1) + Math.max(0, d2),
      message: "সার্টিফিকেট অর্জনের জন্য কালীপূজা ও ভাইফোঁটা উভয় কুইজ সম্পন্ন করা আবশ্যক।",
    };
  }

  const day1Passed = d1 >= 20;
  const day2Passed = d2 >= 20;
  const combinedScore = d1 + d2;
  const combinedPassed = combinedScore >= 40;

  const isEligible = day1Passed && day2Passed && combinedPassed;

  return {
    isEligible,
    day1Passed,
    day2Passed,
    combinedPassed,
    combinedScore,
    message: isEligible
      ? "Congratulations! You have earned your certificate!"
      : "দুঃখিত! এবারের প্রতিযোগিতায় তুমি সার্টিফিকেট অর্জনের নির্ধারিত যোগ্যতা পূরণ করতে পারোনি। মন খারাপ কোরো না। আগামী বছর আবার নতুন উদ্যমে চেষ্টা করবে। তোমার জন্য রইল মায়ের আশীর্বাদ। ❤️",
  };
}

/**
 * Generates an intuitive unique Certificate Code (e.g. NKP-2026-1048)
 */
export async function generateUniqueCertificateCode(prefix: "NKP" | "FAM" = "NKP"): Promise<string> {
  let code = `${prefix}-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  let exists = await prisma.certificate.findUnique({ where: { certificateCode: code } });
  while (exists) {
    code = `${prefix}-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    exists = await prisma.certificate.findUnique({ where: { certificateCode: code } });
  }
  return code;
}

/**
 * Generates a high-resolution, print-ready A4 landscape PDF certificate.
 * Includes Maa Kali reference visual, gold border, maroon accents, and digital signatures.
 */
export async function generateCertificatePDF(cert: {
  certificateCode: string;
  type: "INDIVIDUAL" | "FAMILY";
  recipientName: string;
  kaliPujaScore: number;
  bhaiPhontaScore: number;
  combinedScore: number;
  maxScore: number;
  percentage: number;
  grade: string;
  achievementTitle: string;
  metadata?: any;
}): Promise<string> {
  const certDir = path.join(process.cwd(), "public", "certificates");
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }

  const fileName = `${cert.certificateCode}.pdf`;
  const filePath = path.join(certDir, fileName);
  const publicPath = `/certificates/${fileName}`;

  // Create A4 Landscape PDF (297 x 210 mm)
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const width = 297;
  const height = 210;

  // 1. Cream Background
  doc.setFillColor(254, 252, 243); // #FEFCF3 Cream
  doc.rect(0, 0, width, height, "F");

  // 2. Antique Gold Ornamental Borders
  doc.setDrawColor(180, 83, 9); // Gold-Amber
  doc.setLineWidth(3);
  doc.rect(8, 8, width - 16, height - 16);

  doc.setDrawColor(217, 119, 6); // Inner Gold Line
  doc.setLineWidth(1);
  doc.rect(12, 12, width - 24, height - 24);

  // Corner Accent Flourishes
  doc.setFillColor(153, 27, 27); // Deep Maroon Corner squares
  doc.rect(7, 7, 5, 5, "F");
  doc.rect(width - 12, 7, 5, 5, "F");
  doc.rect(7, height - 12, 5, 5, "F");
  doc.rect(width - 12, height - 12, 5, 5, "F");

  // 3. Central Maa Kali Reference Visual if available
  const kaliImagePath = path.join(process.cwd(), "public", "media", "images", "maa_kali_divine.jpg");
  if (fs.existsSync(kaliImagePath)) {
    try {
      const imgBuffer = fs.readFileSync(kaliImagePath);
      const base64 = imgBuffer.toString("base64");
      // Placed top-center watermark / emblem
      doc.addImage(`data:image/jpeg;base64,${base64}`, "JPEG", width / 2 - 16, 16, 32, 32);
    } catch (err) {
      console.warn("Could not embed Maa Kali image in PDF:", err);
    }
  }

  // 4. Header Titles
  doc.setTextColor(180, 83, 9);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("With the Divine Blessings of Maa Kali", width / 2, 54, { align: "center" });

  doc.setTextColor(120, 29, 29); // Deep Maroon
  doc.setFontSize(20);
  const mainTitle =
    cert.type === "FAMILY"
      ? "Maa's Blessings - Family Special Achievement Certificate 2026"
      : "Maa's Blessings - Special Achievement Certificate 2026";
  doc.text(mainTitle, width / 2, 63, { align: "center" });

  doc.setTextColor(75, 85, 99);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Nakunda Purbapara Kali Puja & Bhai Phonta Special Quiz 2026", width / 2, 70, { align: "center" });

  // Divider
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.5);
  doc.line(width / 2 - 50, 73, width / 2 + 50, 73);

  // 5. Award Presentation Line
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(11);
  doc.text("This prestigious certificate of merit and divine recognition is proudly awarded to", width / 2, 82, {
    align: "center",
  });

  // 6. Recipient / Family Name Golden Nameplate Box
  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(217, 119, 6);
  doc.roundedRect(width / 2 - 75, 87, 150, 16, 2, 2, "FD");

  doc.setTextColor(153, 27, 27); // Deep Crimson
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(cert.recipientName, width / 2, 98, { align: "center" });

  // 7. Statement of Achievement
  doc.setTextColor(31, 41, 55);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  if (cert.type === "FAMILY") {
    doc.text(
      `for outstanding unified participation in the Family Pack with a Grand Total Score of ${cert.combinedScore} / ${cert.maxScore} (${cert.percentage}%).`,
      width / 2,
      112,
      { align: "center" }
    );
  } else {
    doc.text(
      `for exemplary score across both quizzes: Kali Puja (${cert.kaliPujaScore}/50) + Bhai Phonta (${cert.bhaiPhontaScore}/50) = Combined Score ${cert.combinedScore} / 100.`,
      width / 2,
      112,
      { align: "center" }
    );
  }

  // 8. Grade & Title Badge
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(width / 2 - 50, 119, 100, 12, 2, 2, "FD");

  doc.setTextColor(180, 83, 9);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Grade ${cert.grade}  |  ${cert.achievementTitle}`, width / 2, 127, { align: "center" });

  // If family, list family member names in small elegant text
  if (cert.type === "FAMILY" && cert.metadata?.memberNames) {
    doc.setTextColor(75, 85, 99);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const membersText = `Family Members: ${cert.metadata.memberNames.join("  •  ")}`;
    doc.text(membersText, width / 2, 137, { align: "center" });
  }

  // 9. Digital Name Signatures (Bottom Section)
  const sigY = 162;

  // Signature 1
  doc.setTextColor(153, 27, 27);
  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(13);
  doc.text("Subham Ghorui", 55, sigY, { align: "center" });
  doc.setTextColor(107, 114, 128);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Chief Organizer / Admin", 55, sigY + 5, { align: "center" });
  doc.text("(Digital Name Signature)", 55, sigY + 9, { align: "center" });
  doc.line(30, sigY + 1, 80, sigY + 1);

  // Signature 2
  doc.setTextColor(153, 27, 27);
  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(13);
  doc.text("Dev Gopal Ghosh", width / 2, sigY, { align: "center" });
  doc.setTextColor(107, 114, 128);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Puja Committee President", width / 2, sigY + 5, { align: "center" });
  doc.text("(Digital Name Signature)", width / 2, sigY + 9, { align: "center" });
  doc.line(width / 2 - 25, sigY + 1, width / 2 + 25, sigY + 1);

  // Signature 3
  doc.setTextColor(153, 27, 27);
  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(13);
  doc.text("Bidyut Pal", width - 55, sigY, { align: "center" });
  doc.setTextColor(107, 114, 128);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Puja Committee Secretary", width - 55, sigY + 5, { align: "center" });
  doc.text("(Digital Name Signature)", width - 55, sigY + 9, { align: "center" });
  doc.line(width - 80, sigY + 1, width - 30, sigY + 1);

  // 10. Footer Certificate ID & Verification
  doc.setTextColor(107, 114, 128);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Certificate ID: ${cert.certificateCode}`, 20, height - 16);
  doc.text(`Date of Issuance: Bhai Phonta 2026`, width / 2, height - 16, { align: "center" });
  doc.text(`Nakunda Purbapara Kali Puja 2026`, width - 20, height - 16, { align: "right" });

  // Save PDF to file
  const pdfBytes = doc.output("arraybuffer");
  fs.writeFileSync(filePath, Buffer.from(pdfBytes));

  return publicPath;
}

/**
 * Automatically creates or retrieves Individual Certificate for a participant.
 * Idempotent, safe against duplicate triggers.
 */
export async function autoGenerateIndividualCertificate(participantId: string) {
  // Check if certificate already exists
  const existing = await prisma.certificate.findFirst({
    where: { participantId, type: "INDIVIDUAL" },
  });
  if (existing) {
    return existing;
  }

  // Retrieve participant and completed attempts
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: {
      attempts: {
        where: { isCompleted: true, isInvalidated: false },
        include: { quizEvent: true },
      },
    },
  });

  if (!participant) return null;

  const day1Attempt = participant.attempts.find((a) => a.quizEvent.dayNumber === 1);
  const day2Attempt = participant.attempts.find((a) => a.quizEvent.dayNumber === 2);

  const eligibility = checkIndividualEligibility(day1Attempt?.score, day2Attempt?.score);
  if (!eligibility.isEligible) {
    return null;
  }

  const d1Score = day1Attempt!.score;
  const d2Score = day2Attempt!.score;
  const combined = d1Score + d2Score;
  const gradeInfo = getGradeAndTitle(combined);
  const certificateCode = await generateUniqueCertificateCode("NKP");

  const pdfPath = await generateCertificatePDF({
    certificateCode,
    type: "INDIVIDUAL",
    recipientName: participant.name,
    kaliPujaScore: d1Score,
    bhaiPhontaScore: d2Score,
    combinedScore: combined,
    maxScore: 100,
    percentage: combined,
    grade: gradeInfo.grade,
    achievementTitle: `${gradeInfo.titleBn} / ${gradeInfo.titleEn}`,
  });

  const certificate = await prisma.certificate.create({
    data: {
      certificateCode,
      type: "INDIVIDUAL",
      participantId: participant.id,
      recipientName: participant.name,
      kaliPujaScore: d1Score,
      bhaiPhontaScore: d2Score,
      combinedScore: combined,
      maxScore: 100,
      percentage: combined,
      grade: gradeInfo.grade,
      achievementTitle: `${gradeInfo.titleBn} / ${gradeInfo.titleEn}`,
      status: "GENERATED",
      pdfPath,
    },
  });

  return certificate;
}

/**
 * Automatically checks and generates Family Achievement Certificate.
 * Idempotent: generates once after all members finish and percentage >= 40%.
 */
export async function autoGenerateFamilyCertificate(familyPackId: string) {
  // Check if family certificate already exists
  const existing = await prisma.certificate.findFirst({
    where: { familyPackId, type: "FAMILY" },
  });
  if (existing) {
    return existing;
  }

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

  // Check that all members have completed both quizzes
  let allCompleted = true;
  let totalScore = 0;
  const memberScores: Array<{ name: string; score: number }> = [];

  for (const member of family.members) {
    const d1 = member.attempts.find((a) => a.quizEvent.dayNumber === 1);
    const d2 = member.attempts.find((a) => a.quizEvent.dayNumber === 2);

    if (!d1 || !d2) {
      allCompleted = false;
      break;
    }

    const memberTotal = d1.score + d2.score;
    totalScore += memberTotal;
    memberScores.push({ name: member.name, score: memberTotal });
  }

  if (!allCompleted) {
    return null; // Not ready yet
  }

  const maxPossible = family.members.length * 100;
  const percentage = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;

  if (percentage < 40) {
    return null; // Did not reach 40%
  }

  const gradeInfo = getGradeAndTitle(percentage);
  const certificateCode = await generateUniqueCertificateCode("FAM");

  const pdfPath = await generateCertificatePDF({
    certificateCode,
    type: "FAMILY",
    recipientName: `${family.familyHeadName} ও পরিবার (Family ID: ${family.familyId})`,
    kaliPujaScore: 0,
    bhaiPhontaScore: 0,
    combinedScore: totalScore,
    maxScore: maxPossible,
    percentage: Number(percentage.toFixed(1)),
    grade: gradeInfo.grade,
    achievementTitle: `${gradeInfo.titleBn} / ${gradeInfo.titleEn}`,
    metadata: {
      familyId: family.familyId,
      headName: family.familyHeadName,
      memberCount: family.members.length,
      memberNames: family.members.map((m) => m.name),
      memberScores,
    },
  });

  const certificate = await prisma.certificate.create({
    data: {
      certificateCode,
      type: "FAMILY",
      familyPackId: family.id,
      recipientName: `${family.familyHeadName} ও পরিবার (${family.familyId})`,
      kaliPujaScore: 0,
      bhaiPhontaScore: 0,
      combinedScore: totalScore,
      maxScore: maxPossible,
      percentage: Number(percentage.toFixed(1)),
      grade: gradeInfo.grade,
      achievementTitle: `${gradeInfo.titleBn} / ${gradeInfo.titleEn}`,
      status: "GENERATED",
      pdfPath,
      metadataJson: JSON.stringify({
        familyId: family.familyId,
        headName: family.familyHeadName,
        memberNames: family.members.map((m) => m.name),
        memberScores,
      }),
    },
  });

  // Mark family pack as eligible
  await prisma.familyPack.update({
    where: { id: family.id },
    data: {
      familyScore: totalScore,
      maxPossibleScore: maxPossible,
      achievementPercentage: Number(percentage.toFixed(2)),
      isEligibleForCertificate: true,
    },
  });

  return certificate;
}
