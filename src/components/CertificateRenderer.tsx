"use client";

import React, { useRef, useEffect, useState } from "react";
import { Download, Printer, ShieldCheck, Award, Eye } from "lucide-react";

interface CertificateProps {
  certificate: {
    certificateCode: string;
    type?: string;
    recipientName: string;
    kaliPujaScore?: number;
    bhaiPhontaScore?: number;
    combinedScore: number;
    maxScore?: number;
    percentage?: number;
    grade: string;
    achievementTitle: string;
    pdfPath?: string;
    metadata?: any;
  };
}

export function CertificateRenderer({ certificate }: CertificateProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High resolution: 1920 x 1080 (A4 Landscape ratio)
    canvas.width = 1920;
    canvas.height = 1080;

    // 1. Cream Background
    ctx.fillStyle = "#FEFCF3";
    ctx.fillRect(0, 0, 1920, 1080);

    // 2. Antique Gold Ornamental Borders
    ctx.strokeStyle = "#B45309";
    ctx.lineWidth = 14;
    ctx.strokeRect(36, 36, 1920 - 72, 1080 - 72);

    ctx.strokeStyle = "#D97706";
    ctx.lineWidth = 4;
    ctx.strokeRect(56, 56, 1920 - 112, 1080 - 112);

    // Deep Maroon Corner Squares
    ctx.fillStyle = "#991B1B";
    ctx.fillRect(32, 32, 28, 28);
    ctx.fillRect(1920 - 60, 32, 28, 28);
    ctx.fillRect(32, 1080 - 60, 28, 28);
    ctx.fillRect(1920 - 60, 1080 - 60, 28, 28);

    // 3. Central Maa Kali Reference Visual
    const kaliImg = new window.Image();
    kaliImg.crossOrigin = "anonymous";
    kaliImg.src = "/media/images/maa_kali_divine.jpg";

    kaliImg.onload = () => {
      // Draw circular or soft rounded emblem of Maa Kali at top
      ctx.save();
      ctx.beginPath();
      ctx.arc(960, 165, 60, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(kaliImg, 900, 105, 120, 120);
      ctx.restore();

      // Gold border ring around Maa Kali
      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(960, 165, 62, 0, Math.PI * 2, true);
      ctx.stroke();

      drawCertificateText();
    };

    kaliImg.onerror = () => {
      drawCertificateText();
    };

    const drawCertificateText = () => {
      // 4. Blessing Line
      ctx.fillStyle = "#B45309";
      ctx.font = "bold 26px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("মা কালীর অশেষ আশীর্বাদে  •  With the Divine Blessings of Maa Kali", 960, 260);

      // 5. Main Title
      const title =
        certificate.type === "FAMILY"
          ? "মায়ের আশীর্বাদ – পারিবারিক বিশেষ কৃতিত্ব সম্মান ২০২৬"
          : "মায়ের আশীর্বাদ – বিশেষ কৃতিত্ব সম্মান ২০২৬";
      ctx.fillStyle = "#781D1D";
      ctx.font = "bold 52px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
      ctx.fillText(title, 960, 330);

      // Event Subtitle
      ctx.fillStyle = "#4B5563";
      ctx.font = "600 24px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
      ctx.fillText("নকুন্ডা পূর্বপাড়া কালীপূজা ও ভাইফোঁটা বিশেষ কুইজ ২০২৬", 960, 375);

      // Divider Line
      ctx.strokeStyle = "#D97706";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(700, 395);
      ctx.lineTo(1220, 395);
      ctx.stroke();

      // 6. Certificate Statement
      ctx.fillStyle = "#374151";
      ctx.font = "normal 22px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
      ctx.fillText(
        "এই সম্মানপত্রটি নকুন্ডা পূর্বপাড়া কালীপূজা – ২০২৬ উপলক্ষে আয়োজিত বিশেষ কুইজ প্রতিযোগিতায়",
        960,
        440
      );
      ctx.fillText(
        "অংশগ্রহণকারীর অর্জিত মেধা ও যোগ্যতার ভিত্তিতে সশ্রদ্ধ চিত্তে প্রদান করা হলো।",
        960,
        472
      );

      // 7. Recipient Golden Nameplate
      ctx.fillStyle = "#FFFBEB";
      ctx.strokeStyle = "#D97706";
      ctx.lineWidth = 2;
      ctx.fillRect(660, 505, 600, 75);
      ctx.strokeRect(660, 505, 600, 75);

      ctx.fillStyle = "#991B1B";
      ctx.font = "bold 44px 'Hind Siliguri', 'Noto Sans Bengali', serif";
      ctx.fillText(certificate.recipientName, 960, 558);

      // 8. Score & Achievement Statement
      ctx.fillStyle = "#1F2937";
      ctx.font = "600 24px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
      if (certificate.type === "FAMILY") {
        ctx.fillText(
          `ফ্যামিলি প্যাক সম্মিলিত স্কোর: ${certificate.combinedScore} / ${certificate.maxScore || 500} (${certificate.percentage || 0}%)`,
          960,
          625
        );
      } else {
        ctx.fillText(
          `কালীপূজা স্কোর: ${certificate.kaliPujaScore ?? "-"}  |  ভাইফোঁটা স্কোর: ${certificate.bhaiPhontaScore ?? "-"}  |  সম্মিলিত স্কোর: ${certificate.combinedScore} / ১০০`,
          960,
          625
        );
      }

      // Grade Badge
      ctx.fillStyle = "#FEF3C7";
      ctx.fillRect(720, 655, 480, 45);
      ctx.strokeStyle = "#D97706";
      ctx.lineWidth = 1;
      ctx.strokeRect(720, 655, 480, 45);

      ctx.fillStyle = "#B45309";
      ctx.font = "bold 22px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
      ctx.fillText(
        `গ্রেড: ${certificate.grade}  •  ${certificate.achievementTitle}`,
        960,
        686
      );

      // 9. Digital Name Signatures (Bottom)
      const sigY = 875;

      // Sig 1
      ctx.fillStyle = "#991B1B";
      ctx.font = "italic bold 32px 'Hind Siliguri', 'Noto Sans Bengali', cursive";
      ctx.fillText("শুভম ঘোড়ুই", 360, sigY);
      ctx.strokeStyle = "#9CA3AF";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(250, sigY + 8);
      ctx.lineTo(470, sigY + 8);
      ctx.stroke();
      ctx.fillStyle = "#6B7280";
      ctx.font = "normal 16px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
      ctx.fillText("প্রধান উদ্যোক্তা / অ্যাডমিন", 360, sigY + 30);
      ctx.fillText("ডিজিটাল নাম স্বাক্ষর", 360, sigY + 50);

      // Sig 2
      ctx.fillStyle = "#991B1B";
      ctx.font = "italic bold 32px 'Hind Siliguri', 'Noto Sans Bengali', cursive";
      ctx.fillText("দেবগোপাল ঘোষ", 960, sigY);
      ctx.beginPath();
      ctx.moveTo(850, sigY + 8);
      ctx.lineTo(1070, sigY + 8);
      ctx.stroke();
      ctx.fillStyle = "#6B7280";
      ctx.font = "normal 16px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
      ctx.fillText("পূজা কমিটি সভাপতি", 960, sigY + 30);
      ctx.fillText("ডিজিটাল নাম স্বাক্ষর", 960, sigY + 50);

      // Sig 3
      ctx.fillStyle = "#991B1B";
      ctx.font = "italic bold 32px 'Hind Siliguri', 'Noto Sans Bengali', cursive";
      ctx.fillText("বিদ্যুৎ পাল", 1560, sigY);
      ctx.beginPath();
      ctx.moveTo(1450, sigY + 8);
      ctx.lineTo(1670, sigY + 8);
      ctx.stroke();
      ctx.fillStyle = "#6B7280";
      ctx.font = "normal 16px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
      ctx.fillText("পূজা কমিটি সম্পাদক", 1560, sigY + 30);
      ctx.fillText("ডিজিটাল নাম স্বাক্ষর", 1560, sigY + 50);

      // 10. Footer Certificate ID
      ctx.fillStyle = "#9CA3AF";
      ctx.font = "normal 16px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Certificate ID: ${certificate.certificateCode}`, 70, 1020);

      ctx.textAlign = "right";
      ctx.fillText("নকুন্ডা পূর্বপাড়া কালীপূজা ২০২৬", 1850, 1020);

      setIsRendered(true);
    };
  }, [certificate]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-4xl space-y-6 animate-fadeIn">
      {/* High-Resolution Certificate Canvas Card */}
      <div className="card-devotional p-3 sm:p-5 rounded-3xl border-2 border-amber-500 shadow-2xl overflow-hidden bg-black/40">
        <canvas
          ref={canvasRef}
          className="w-full h-auto rounded-2xl shadow-xl border border-amber-500/30"
          style={{ aspectRatio: "16 / 9" }}
        />
      </div>

      {/* Action Controls: View, Download PDF, Print */}
      <div className="flex flex-wrap items-center justify-center gap-4 font-bengali">
        <a
          href={`/api/certificate/download?code=${certificate.certificateCode}`}
          target="_blank"
          rel="noreferrer"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-bold text-sm shadow-xl flex items-center gap-2 transition-all hover:scale-105"
        >
          <Download className="w-4 h-4" />
          <span>অফিশিয়াল পিডিএফ ডাউনলোড করুন</span>
        </a>

        <button
          onClick={handlePrint}
          className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-sm shadow-md flex items-center gap-2 transition-all"
        >
          <Printer className="w-4 h-4 text-amber-400" />
          <span>প্রিন্ট করুন</span>
        </button>
      </div>

      <div className="text-center text-xs text-slate-400 font-bengali">
        আইডি: <span className="font-mono text-amber-300 font-bold">{certificate.certificateCode}</span> • 
        গ্রেড: <span className="font-bold text-amber-400">{certificate.grade}</span> ({certificate.achievementTitle})
      </div>
    </div>
  );
}
