import fs from "fs";
import path from "path";

const videoDir = path.join(process.cwd(), "public", "media", "video");
const audioDir = path.join(process.cwd(), "public", "media", "audio");
const subtitlesDir = path.join(process.cwd(), "public", "media", "subtitles");

fs.mkdirSync(videoDir, { recursive: true });
fs.mkdirSync(audioDir, { recursive: true });
fs.mkdirSync(subtitlesDir, { recursive: true });

// 1. Create WebVTT Subtitle File
const vttContent = `WEBVTT - মায়ের আশীর্বাদ ২০২৬

00:00.000 --> 00:04.500
নকুন্ডা কালীপূজা ২০২৬-এ উপস্থিত সকল ভক্ত ও সন্তানদের প্রতি মা কালীর অনন্ত আশীর্বাদ।

00:04.800 --> 00:09.500
তোমাদের জীবন আলো, ভক্তি, আনন্দ ও স্নেহে পরিপূর্ণ হয়ে উঠুক।

00:09.800 --> 00:15.000
সকল ভয় ও সংকট দূর করে তোমরা সত্য ও মানবতার পথে এগিয়ে চলো। জয় মা কালী!
`;

fs.writeFileSync(path.join(subtitlesDir, "blessing_subtitles.vtt"), vttContent, "utf8");
console.log("✅ Created blessing_subtitles.vtt");

// 2. Generate a valid lightweight MP3 byte sequence (MPEG Audio Layer 3 silent/chime frame)
// A standard valid silence MPEG frame header: FFFB9064 ...
function generateSilentMp3(seconds = 5) {
  // A valid 128kbps 44.1kHz MP3 frame is 417/418 bytes.
  const frameHeader = Buffer.from([0xff, 0xfb, 0x90, 0x64]);
  const frameBody = Buffer.alloc(414, 0x00);
  const oneFrame = Buffer.concat([frameHeader, frameBody]);
  // 38 frames per second approx
  const framesCount = Math.max(1, Math.floor(seconds * 38.28));
  const frames = [];
  for (let i = 0; i < framesCount; i++) {
    frames.push(oneFrame);
  }
  return Buffer.concat(frames);
}

const audioFiles = [
  { name: "mayer_charane_gaan.mp3", duration: 15 },
  { name: "audiobook_ch1.mp3", duration: 15 },
  { name: "audiobook_ch2.mp3", duration: 15 },
  { name: "audiobook_ch3.mp3", duration: 15 },
  { name: "audiobook_ch4.mp3", duration: 15 },
  { name: "audiobook_ch5.mp3", duration: 15 },
  { name: "temple_bell.mp3", duration: 4 },
];

for (const a of audioFiles) {
  const filePath = path.join(audioDir, a.name);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, generateSilentMp3(a.duration));
    console.log(`✅ Generated audio placeholder: ${a.name}`);
  }
}

// 3. For Video Placeholder: generate or download a clean minimal mp4 or create README guide
const videoReadme = `# Nakunda Kali Puja 2026 - Media Asset Instructions

### 📹 Video Asset (Maa Kali's Blessing Video)
- **Target Location:** \`public/media/video/maa_kali_blessing.mp4\`
- **Format:** MP4 (H.264 / AAC)
- **Subtitles:** \`public/media/subtitles/blessing_subtitles.vtt\`
- **Poster:** \`public/media/images/kali_video_poster.jpg\`

### 🎵 Song Asset (মায়ের চরণে আমার গান)
- **Target Location:** \`public/media/audio/mayer_charane_gaan.mp3\`
- **Format:** MP3 (128kbps or 320kbps recommended)
- **Cover:** \`public/media/images/song_cover.jpg\`

### 📚 Audiobook Chapters (মায়ের মহিমা)
- **Chapter 1:** \`public/media/audio/audiobook_ch1.mp3\`
- **Chapter 2:** \`public/media/audio/audiobook_ch2.mp3\`
- **Chapter 3:** \`public/media/audio/audiobook_ch3.mp3\`
- **Chapter 4:** \`public/media/audio/audiobook_ch4.mp3\`
- **Chapter 5:** \`public/media/audio/audiobook_ch5.mp3\`

> Note: You can also upload/replace any of these files directly via the **Admin Dashboard** (\`/admin\`)!
`;

fs.writeFileSync(path.join(process.cwd(), "public", "media", "README.md"), videoReadme, "utf8");
console.log("✅ Created public/media/README.md");
