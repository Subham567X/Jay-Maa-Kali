import { prisma } from "./prisma";

export interface SheetRowData {
  code: string;
  name: string;
  registeredAt: string;
  isCommittee: string;
  day1Score: number | string;
  day1Duration: string;
  day2Score: number | string;
  day2Duration: string;
  totalScore: number | string;
  totalDuration: string;
  status: string;
  lastUpdated: string;
}

/**
 * Retrieves the Google Sheet settings from the database or returns default.
 */
export async function getGoogleSheetSettings() {
  let settings = await prisma.googleSheetSetting.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    settings = await prisma.googleSheetSetting.create({
      data: {
        id: "default",
        isEnabled: true,
        syncOnRegister: true,
        syncOnSubmit: true,
      },
    });
  }

  return settings;
}

/**
 * Helper to format seconds into mm:ss
 */
function formatSeconds(secs: number): string {
  if (!secs || secs <= 0) return "-";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m} মিনিট ${s} সেকেন্ড`;
}

/**
 * Builds standard row data for a participant given their attempts
 */
export async function buildParticipantRowData(participantId: string): Promise<SheetRowData | null> {
  const p = await prisma.participant.findUnique({
    where: { id: participantId },
    include: {
      attempts: {
        include: { quizEvent: true },
      },
    },
  });

  if (!p) return null;

  const day1Attempt = p.attempts.find((a) => a.quizEvent?.dayNumber === 1);
  const day2Attempt = p.attempts.find((a) => a.quizEvent?.dayNumber === 2);

  const day1Score = day1Attempt && day1Attempt.isCompleted && !day1Attempt.isInvalidated ? day1Attempt.score : "-";
  const day2Score = day2Attempt && day2Attempt.isCompleted && !day2Attempt.isInvalidated ? day2Attempt.score : "-";

  let totalScore: number | string = "-";
  let totalSeconds = 0;

  if (typeof day1Score === "number" || typeof day2Score === "number") {
    const s1 = typeof day1Score === "number" ? day1Score : 0;
    const s2 = typeof day2Score === "number" ? day2Score : 0;
    totalScore = s1 + s2;
    totalSeconds = (day1Attempt?.durationSeconds || 0) + (day2Attempt?.durationSeconds || 0);
  }

  let status = "নিবন্ধিত (রেজিস্টার্ড)";
  if (day1Attempt?.isCompleted && day2Attempt?.isCompleted) {
    status = "উভয় কুইজ সম্পন্ন (Day 1 & Day 2)";
  } else if (day1Attempt?.isCompleted) {
    status = "Day 1 সম্পন্ন (Day 2 বাকি)";
  } else if (day2Attempt?.isCompleted) {
    status = "Day 2 সম্পন্ন (Day 1 বাকি)";
  } else if (day1Attempt?.status === "IN_PROGRESS" || day2Attempt?.status === "IN_PROGRESS") {
    status = "কুইজ চলছে (In Progress)";
  }

  return {
    code: p.code,
    name: p.name,
    registeredAt: p.createdAt.toLocaleString("bn-BD", { timeZone: "Asia/Kolkata" }),
    isCommittee: p.isCommittee ? `হ্যাঁ (${p.committeeMatchReason || "কমিটি সদস্য"})` : "না",
    day1Score,
    day1Duration: day1Attempt?.isCompleted ? formatSeconds(day1Attempt.durationSeconds) : "-",
    day2Score,
    day2Duration: day2Attempt?.isCompleted ? formatSeconds(day2Attempt.durationSeconds) : "-",
    totalScore,
    totalDuration: totalSeconds > 0 ? formatSeconds(totalSeconds) : "-",
    status,
    lastUpdated: new Date().toLocaleString("bn-BD", { timeZone: "Asia/Kolkata" }),
  };
}

/**
 * Sends a payload to the configured Google Apps Script Webhook.
 * Non-blocking, fails gracefully with error logging.
 */
async function sendToWebhook(action: "REGISTER" | "SCORE_UPDATE" | "BULK_SYNC" | "TEST", payload: any) {
  try {
    const settings = await getGoogleSheetSettings();
    if (!settings.isEnabled || !settings.webhookUrl) {
      return { success: false, reason: "Webhook URL not configured or sync disabled" };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const res = await fetch(settings.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        timestamp: new Date().toISOString(),
        ...payload,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      await prisma.googleSheetSetting.update({
        where: { id: "default" },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: "SUCCESS",
          lastError: null,
        },
      });
      return { success: true };
    } else {
      const errText = await res.text().catch(() => "HTTP Error " + res.status);
      await prisma.googleSheetSetting.update({
        where: { id: "default" },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: "FAILED",
          lastError: `HTTP ${res.status}: ${errText.slice(0, 200)}`,
        },
      });
      return { success: false, error: errText };
    }
  } catch (err: any) {
    console.error("Google Sheet webhook error:", err.message);
    try {
      await prisma.googleSheetSetting.update({
        where: { id: "default" },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: "FAILED",
          lastError: err.message?.slice(0, 250) || "Network error",
        },
      });
    } catch {}
    return { success: false, error: err.message };
  }
}

/**
 * Automatically called when a participant registers
 */
export async function syncParticipantRegistration(participantId: string) {
  try {
    const settings = await getGoogleSheetSettings();
    if (!settings.isEnabled || !settings.syncOnRegister || !settings.webhookUrl) return;

    const row = await buildParticipantRowData(participantId);
    if (!row) return;

    // Fire non-blocking
    sendToWebhook("REGISTER", { row }).catch((e) =>
      console.warn("Background sheet sync failed on register:", e)
    );
  } catch (e) {
    console.warn("syncParticipantRegistration error:", e);
  }
}

/**
 * Automatically called when a participant submits a quiz
 */
export async function syncParticipantScore(participantId: string) {
  try {
    const settings = await getGoogleSheetSettings();
    if (!settings.isEnabled || !settings.syncOnSubmit || !settings.webhookUrl) return;

    const row = await buildParticipantRowData(participantId);
    if (!row) return;

    // Fire non-blocking
    sendToWebhook("SCORE_UPDATE", { row }).catch((e) =>
      console.warn("Background sheet sync failed on score submit:", e)
    );
  } catch (e) {
    console.warn("syncParticipantScore error:", e);
  }
}

/**
 * Bulk sync all registered participants and scores to Google Sheet
 */
export async function bulkSyncAllParticipants() {
  const participants = await prisma.participant.findMany({
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  const rows: SheetRowData[] = [];
  for (const p of participants) {
    const row = await buildParticipantRowData(p.id);
    if (row) rows.push(row);
  }

  const result = await sendToWebhook("BULK_SYNC", { rows });

  if (result.success) {
    await prisma.googleSheetSetting.update({
      where: { id: "default" },
      data: { totalSyncedRows: rows.length },
    });
  }

  return { ...result, totalRows: rows.length };
}

/**
 * Tests connection to Google Apps Script Webhook
 */
export async function testGoogleSheetWebhook() {
  return await sendToWebhook("TEST", { message: "নকুন্ডা কালীপূজা ২০২৬ - গুগল শিট কানেকশন টেস্ট সফল!" });
}
