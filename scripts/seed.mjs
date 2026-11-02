import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { day1Questions, day2Questions } from "./questions-data.mjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌸 Beginning Database Seed for মায়ের আশীর্বাদ – Kali Puja 2026...");

  // 1. Create Default Admin User
  const adminUsername = process.env.ADMIN_DEFAULT_USER || "admin";
  const adminPassword = process.env.ADMIN_DEFAULT_PASS || "NakundaMaa@2026";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.adminUser.upsert({
    where: { username: adminUsername },
    update: { passwordHash, name: "Subham Ghorui (প্রধান অ্যাডমিন)" },
    create: {
      username: adminUsername,
      passwordHash,
      name: "Subham Ghorui (প্রধান অ্যাডমিন)",
      role: "SUPER_ADMIN",
    },
  });
  console.log(`✅ Admin user verified: ${admin.username}`);

  const subhamAdmin = await prisma.adminUser.upsert({
    where: { username: "subham" },
    update: { passwordHash, name: "Subham Ghorui (প্রধান অ্যাডমিন)" },
    create: {
      username: "subham",
      passwordHash,
      name: "Subham Ghorui (প্রধান অ্যাডমিন)",
      role: "SUPER_ADMIN",
    },
  });
  console.log(`✅ Subham admin user verified: ${subhamAdmin.username}`);

  // 2. Seed Committee Members with Aliases
  const committeeData = [
    {
      name: "Dev Gopal Ghosh",
      normalizedName: "dev gopal ghosh",
      aliases: JSON.stringify([
        "dev gopal ghosh",
        "devgopal ghosh",
        "deb gopal ghosh",
        "debgopal ghosh",
        "দেভ গোপাল ঘোষ",
        "দেব গোপাল ঘোষ",
        "দেবগোপাল ঘোষ",
        "dev gopal",
        "deb gopal",
        "dev ghosh",
        "deb ghosh",
      ]),
      notes: "Nakunda Kali Puja Committee Member",
    },
    {
      name: "Subham Ghorui",
      normalizedName: "subham ghorui",
      aliases: JSON.stringify([
        "subham ghorui",
        "subham ghorai",
        "shubham ghorui",
        "shubham ghorai",
        "subham gorai",
        "subham gorui",
        "শুভম ঘোড়ুই",
        "শুভম ঘোড়াই",
        "সুভম ঘোড়ুই",
        "সুভম ঘোড়াই",
        "শুভম",
      ]),
      notes: "Subham Ghorui & Subham Ghorai are recognized aliases for the same committee member",
    },
    {
      name: "Bidyut Pal",
      normalizedName: "bidyut pal",
      aliases: JSON.stringify([
        "bidyut pal",
        "bidyut paul",
        "biddut pal",
        "biddut paul",
        "vidyut pal",
        "বিদ্যুৎ পাল",
        "বিদুত পাল",
        "বিদ্দুত পাল",
        "বিদ্যুত পাল",
      ]),
      notes: "Nakunda Kali Puja Committee Member",
    },
  ];

  for (const c of committeeData) {
    const existing = await prisma.committeeMember.findFirst({
      where: { normalizedName: c.normalizedName },
    });
    if (!existing) {
      await prisma.committeeMember.create({ data: c });
    } else {
      await prisma.committeeMember.update({
        where: { id: existing.id },
        data: { aliases: c.aliases, name: c.name },
      });
    }
  }
  console.log(`✅ Seeded ${committeeData.length} Committee Members with full alias support.`);

  // 3. Seed Quiz Events
  const day1Event = await prisma.quizEvent.upsert({
    where: { slug: "kali-puja" },
    update: {
      title: "কালীপূজা বিশেষ কুইজ",
      subtitle: "প্রথম দিন – মা কালীর আরাধনা ও মহাশক্তি পরম্পরা",
      description: "মা কালীর মহিমা, পুরাণ, শাক্ত সাহিত্য ও কালীপূজার ৫০টি বিশেষ জ্ঞানভিত্তিক প্রশ্নমালা।",
      timeLimitSeconds: 3600, // 60 minutes
      totalQuestions: 50,
      isOpen: true,
      isLocked: false,
    },
    create: {
      dayNumber: 1,
      slug: "kali-puja",
      title: "কালীপূজা বিশেষ কুইজ",
      subtitle: "প্রথম দিন – মা কালীর আরাধনা ও মহাশক্তি পরম্পরা",
      description: "মা কালীর মহিমা, পুরাণ, শাক্ত সাহিত্য ও কালীপূজার ৫০টি বিশেষ জ্ঞানভিত্তিক প্রশ্নমালা।",
      timeLimitSeconds: 3600, // 60 minutes
      totalQuestions: 50,
      isOpen: true,
      isLocked: false,
    },
  });

  const day2Event = await prisma.quizEvent.upsert({
    where: { slug: "bhai-phonta" },
    update: {
      title: "ভাইফোঁটা বিশেষ কুইজ",
      subtitle: "দ্বিতীয় দিন – ভ্রাতৃদ্বিতীয়া ও চিরন্তন পারিবারিক সংস্কৃতি",
      description: "যমরাজ ও যমুনার পৌরাণিক কথা, ভাইফোঁটার রীতি ও বাঙালির লোকঐতিহ্যের ৫০টি বিশিষ্ট প্রশ্ন।",
      timeLimitSeconds: 3600, // 60 minutes
      totalQuestions: 50,
      isOpen: true,
      isLocked: false,
    },
    create: {
      dayNumber: 2,
      slug: "bhai-phonta",
      title: "ভাইফোঁটা বিশেষ কুইজ",
      subtitle: "দ্বিতীয় দিন – ভ্রাতৃদ্বিতীয়া ও চিরন্তন পারিবারিক সংস্কৃতি",
      description: "যমরাজ ও যমুনার পৌরাণিক কথা, ভাইফোঁটার রীতি ও বাঙালির লোকঐতিহ্যের ৫০টি বিশিষ্ট প্রশ্ন।",
      timeLimitSeconds: 3600, // 60 minutes
      totalQuestions: 50,
      isOpen: true,
      isLocked: false,
    },
  });
  console.log(`✅ Quiz Events created/verified: Day 1 & Day 2.`);

  // 4. Seed Questions & Options for Day 1
  console.log(`⏳ Seeding Day 1 questions (Target: exactly 50)...`);
  for (const q of day1Questions) {
    const question = await prisma.quizQuestion.upsert({
      where: {
        quizEventId_questionNumber: {
          quizEventId: day1Event.id,
          questionNumber: q.questionNumber,
        },
      },
      update: {
        questionText: q.questionText,
        explanation: q.explanation,
        isActive: true,
      },
      create: {
        quizEventId: day1Event.id,
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        explanation: q.explanation,
        isActive: true,
      },
    });

    // Seed options
    for (const opt of q.options) {
      await prisma.quizOption.upsert({
        where: {
          questionId_optionKey: {
            questionId: question.id,
            optionKey: opt.key,
          },
        },
        update: {
          optionText: opt.text,
          isCorrect: opt.isCorrect,
        },
        create: {
          questionId: question.id,
          optionKey: opt.key,
          optionText: opt.text,
          isCorrect: opt.isCorrect,
        },
      });
    }
  }
  const day1Count = await prisma.quizQuestion.count({ where: { quizEventId: day1Event.id } });
  console.log(`✅ Day 1 questions seeded: ${day1Count}/50 verified.`);

  // 5. Seed Questions & Options for Day 2
  console.log(`⏳ Seeding Day 2 questions (Target: exactly 50)...`);
  for (const q of day2Questions) {
    const question = await prisma.quizQuestion.upsert({
      where: {
        quizEventId_questionNumber: {
          quizEventId: day2Event.id,
          questionNumber: q.questionNumber,
        },
      },
      update: {
        questionText: q.questionText,
        explanation: q.explanation,
        isActive: true,
      },
      create: {
        quizEventId: day2Event.id,
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        explanation: q.explanation,
        isActive: true,
      },
    });

    for (const opt of q.options) {
      await prisma.quizOption.upsert({
        where: {
          questionId_optionKey: {
            questionId: question.id,
            optionKey: opt.key,
          },
        },
        update: {
          optionText: opt.text,
          isCorrect: opt.isCorrect,
        },
        create: {
          questionId: question.id,
          optionKey: opt.key,
          optionText: opt.text,
          isCorrect: opt.isCorrect,
        },
      });
    }
  }
  const day2Count = await prisma.quizQuestion.count({ where: { quizEventId: day2Event.id } });
  console.log(`✅ Day 2 questions seeded: ${day2Count}/50 verified.`);

  // 6. Seed Media Assets
  const defaultAssets = [
    {
      assetKey: "blessing_video",
      title: "মা কালীর আশীর্বাদ ও স্নেহবাণী (ভিডিও ১)",
      type: "VIDEO",
      url: "/media/video/video%201.mp4",
      posterUrl: "/media/images/kali_video_poster.jpg",
      subtitlesText: null,
      durationSeconds: 0,
    },
    {
      assetKey: "devotional_song",
      title: "মায়ের চরণে আমার গান",
      type: "AUDIO",
      url: "/media/audio/mayer_charane_gaan.mp3",
      posterUrl: "/media/images/song_cover.jpg",
      metadataJson: JSON.stringify({
        artist: "নকুন্ডা ভক্তবৃন্দ",
        album: "মায়ের আশীর্বাদ ২০২৬",
        description: "মা ভবতারিণীর রাতুল চরণে নিবেদিত আবেগঘন ভক্তিগীতি।",
      }),
      durationSeconds: 240,
    },
    {
      assetKey: "audiobook_ch1",
      title: "অধ্যায় ১: মা কালীর আবির্ভাব",
      type: "AUDIO",
      url: "/media/audio/audiobook_ch1.mp3",
      posterUrl: "/media/images/audiobook_cover.jpg",
      durationSeconds: 420,
    },
    {
      assetKey: "audiobook_ch2",
      title: "অধ্যায় ২: মা কালীর মহিমা ও শক্তির রূপ",
      type: "AUDIO",
      url: "/media/audio/audiobook_ch2.mp3",
      posterUrl: "/media/images/audiobook_cover.jpg",
      durationSeconds: 380,
    },
    {
      assetKey: "audiobook_ch3",
      title: "অধ্যায় ৩: মা কালীর ভক্তের প্রতি অপার্থিব ভালোবাসা",
      type: "AUDIO",
      url: "/media/audio/audiobook_ch3.mp3",
      posterUrl: "/media/images/audiobook_cover.jpg",
      durationSeconds: 450,
    },
    {
      assetKey: "audiobook_ch4",
      title: "অধ্যায় ৪: মা কালীর আশীর্বাদ ও শরণাগতি",
      type: "AUDIO",
      url: "/media/audio/audiobook_ch4.mp3",
      posterUrl: "/media/images/audiobook_cover.jpg",
      durationSeconds: 410,
    },
    {
      assetKey: "audiobook_ch5",
      title: "অধ্যায় ৫: ভক্তি, সাহস ও মানবতার শিক্ষা",
      type: "AUDIO",
      url: "/media/audio/audiobook_ch5.mp3",
      posterUrl: "/media/images/audiobook_cover.jpg",
      durationSeconds: 390,
    },
  ];

  for (const asset of defaultAssets) {
    await prisma.mediaAsset.upsert({
      where: { assetKey: asset.assetKey },
      update: asset,
      create: asset,
    });
  }
  console.log(`✅ Default media asset records seeded.`);

  // 6. Seed Event Configurations (Schedule & Passing Rules)
  await prisma.eventConfiguration.upsert({
    where: { id: "default" },
    update: {
      kaliPujaDate: "2026-11-08",
      bhaiPhontaDate: "2026-11-10",
      quizDurationMinutes: 60,
      openHour: 6,
      closeHour: 23,
      closeMinute: 59,
      timezone: "Asia/Kolkata",
    },
    create: {
      id: "default",
      kaliPujaDate: "2026-11-08",
      bhaiPhontaDate: "2026-11-10",
      quizDurationMinutes: 60,
      openHour: 6,
      closeHour: 23,
      closeMinute: 59,
      timezone: "Asia/Kolkata",
    },
  });
  console.log(`✅ Default EventConfiguration record seeded.`);

  console.log("🌟 Database Seed Completed Successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
