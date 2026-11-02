import { prisma } from "./prisma";

export interface SecurityConfig {
  requireFullscreen: boolean;
  tabSwitchWarning: boolean;
  maxWarnings: number;
  invalidateOnExit: boolean;
  allowRefresh: boolean;
  canAdminReview: boolean;
  warningMessageBn: string;
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  requireFullscreen: true,
  tabSwitchWarning: true,
  maxWarnings: 2, // 2 warnings, 3rd violation invalidates
  invalidateOnExit: true,
  allowRefresh: true,
  canAdminReview: true,
  warningMessageBn:
    "কুইজ চলাকালীন অন্য কোনো ওয়েবসাইট, Google, AI টুল অথবা অন্য অ্যাপ ব্যবহার করা সম্পূর্ণ নিষিদ্ধ। কুইজ চলাকালীন পৃষ্ঠা থেকে বেরিয়ে গেলে আপনার পরীক্ষা বাতিল হতে পারে।",
};

export const STRICT_EXIT_MESSAGE_BN =
  "দুঃখিত! আপনি একাধিকবার কুইজের পেজ থেকে বেরিয়ে যাওয়ায় নিয়ম অনুযায়ী আপনার এই কুইজটি বাতিল করা হয়েছে। আজ আর দ্বিতীয়বার কুইজে অংশগ্রহণ করতে পারবেন না। অসুবিধার জন্য আমরা আন্তরিকভাবে দুঃখিত।";

/**
 * Retrieves the current quiz security settings, initializing default if absent.
 */
export async function getQuizSecuritySettings(): Promise<SecurityConfig> {
  try {
    let setting = await prisma.quizSecuritySetting.findUnique({
      where: { id: "default" },
    });

    if (!setting) {
      setting = await prisma.quizSecuritySetting.create({
        data: {
          id: "default",
          ...DEFAULT_SECURITY_CONFIG,
        },
      });
    }

    return {
      requireFullscreen: setting.requireFullscreen,
      tabSwitchWarning: setting.tabSwitchWarning,
      maxWarnings: setting.maxWarnings,
      invalidateOnExit: setting.invalidateOnExit,
      allowRefresh: setting.allowRefresh,
      canAdminReview: setting.canAdminReview,
      warningMessageBn: setting.warningMessageBn || DEFAULT_SECURITY_CONFIG.warningMessageBn,
    };
  } catch (err) {
    console.error("Error reading quiz security settings, falling back to default:", err);
    return DEFAULT_SECURITY_CONFIG;
  }
}

/**
 * Updates security configuration.
 */
export async function updateQuizSecuritySettings(
  config: Partial<SecurityConfig>
): Promise<SecurityConfig> {
  const current = await getQuizSecuritySettings();
  const updated = await prisma.quizSecuritySetting.upsert({
    where: { id: "default" },
    update: {
      requireFullscreen: config.requireFullscreen ?? current.requireFullscreen,
      tabSwitchWarning: config.tabSwitchWarning ?? current.tabSwitchWarning,
      maxWarnings: config.maxWarnings ?? current.maxWarnings,
      invalidateOnExit: config.invalidateOnExit ?? current.invalidateOnExit,
      allowRefresh: config.allowRefresh ?? current.allowRefresh,
      canAdminReview: config.canAdminReview ?? current.canAdminReview,
      warningMessageBn: config.warningMessageBn ?? current.warningMessageBn,
    },
    create: {
      id: "default",
      requireFullscreen: config.requireFullscreen ?? current.requireFullscreen,
      tabSwitchWarning: config.tabSwitchWarning ?? current.tabSwitchWarning,
      maxWarnings: config.maxWarnings ?? current.maxWarnings,
      invalidateOnExit: config.invalidateOnExit ?? current.invalidateOnExit,
      allowRefresh: config.allowRefresh ?? current.allowRefresh,
      canAdminReview: config.canAdminReview ?? current.canAdminReview,
      warningMessageBn: config.warningMessageBn ?? current.warningMessageBn,
    },
  });

  return {
    requireFullscreen: updated.requireFullscreen,
    tabSwitchWarning: updated.tabSwitchWarning,
    maxWarnings: updated.maxWarnings,
    invalidateOnExit: updated.invalidateOnExit,
    allowRefresh: updated.allowRefresh,
    canAdminReview: updated.canAdminReview,
    warningMessageBn: updated.warningMessageBn || DEFAULT_SECURITY_CONFIG.warningMessageBn,
  };
}

/**
 * Records a violation during an active quiz and determines if the attempt should be invalidated.
 */
export async function processQuizViolation(
  attemptId: string,
  eventType: "TAB_SWITCH" | "WINDOW_BLUR" | "FULLSCREEN_EXIT" | "PAGE_LEAVE" | "BACK_NAVIGATION" | "REFRESH",
  details?: string
): Promise<{
  attempt: any;
  warningCount: number;
  maxWarnings: number;
  isInvalidated: boolean;
  message: string;
}> {
  const settings = await getQuizSecuritySettings();

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: { violations: true, participant: true, quizEvent: true },
  });

  if (!attempt) {
    throw new Error("কুইজ প্রচেষ্টা পাওয়া যায়নি");
  }

  // If already completed or invalidated, return current status
  if (attempt.isCompleted || attempt.isInvalidated) {
    return {
      attempt,
      warningCount: attempt.warningCount,
      maxWarnings: settings.maxWarnings,
      isInvalidated: attempt.isInvalidated,
      message: attempt.invalidationReason || STRICT_EXIT_MESSAGE_BN,
    };
  }

  const newWarningCount = attempt.warningCount + 1;

  // Determine if this violation causes immediate invalidation
  let shouldInvalidate = false;
  let invalidationReason = "";

  if (eventType === "PAGE_LEAVE" || eventType === "BACK_NAVIGATION") {
    if (settings.invalidateOnExit) {
      shouldInvalidate = true;
      invalidationReason = STRICT_EXIT_MESSAGE_BN;
    }
  } else if (eventType === "REFRESH") {
    if (!settings.allowRefresh) {
      shouldInvalidate = true;
      invalidationReason =
        "কুইজ চলাকালীন ব্রাউজার রিফ্রেশ করা নিষিদ্ধ। নির্ধারিত নিয়ম অনুযায়ী আপনার কুইজ প্রচেষ্টা বাতিল করা হয়েছে।";
    }
  } else {
    // Tab switch, blur, or fullscreen exit
    if (newWarningCount > settings.maxWarnings) {
      shouldInvalidate = true;
      invalidationReason =
        `কুইজ চলাকালীন অনুমতিহীন ক্রিয়াকলাপের সর্বোচ্চ সতর্কতা সীমা (${settings.maxWarnings} বার) অতিক্রম করার কারণে আপনার কুইজের প্রচেষ্টা বাতিল করা হয়েছে।`;
    }
  }

  // Create violation record
  await prisma.quizViolation.create({
    data: {
      attemptId: attempt.id,
      eventType,
      warningNumber: newWarningCount,
      details: details || `Detected ${eventType} event`,
      clientTimestamp: new Date(),
    },
  });

  // Update attempt
  const updatedAttempt = await prisma.quizAttempt.update({
    where: { id: attempt.id },
    data: {
      warningCount: newWarningCount,
      isInvalidated: shouldInvalidate ? true : attempt.isInvalidated,
      status: shouldInvalidate ? "INVALIDATED" : attempt.status,
      invalidationReason: shouldInvalidate ? invalidationReason : attempt.invalidationReason,
      invalidationDetails: shouldInvalidate
        ? JSON.stringify({
            triggerEvent: eventType,
            warningCount: newWarningCount,
            maxWarnings: settings.maxWarnings,
            timestamp: new Date().toISOString(),
          })
        : attempt.invalidationDetails,
    },
    include: { violations: true },
  });

  let message = "";
  if (shouldInvalidate) {
    message = invalidationReason;
  } else {
    const remaining = Math.max(0, settings.maxWarnings - newWarningCount);
    message = `সতর্কতা #${newWarningCount}: কুইজ চলাকালীন অন্য উইন্ডো, ট্যাব বা বাহ্যিক অ্যাপে যাওয়া নিষিদ্ধ! অবশিষ্ট সতর্কতা: ${remaining} বার।`;
  }

  return {
    attempt: updatedAttempt,
    warningCount: newWarningCount,
    maxWarnings: settings.maxWarnings,
    isInvalidated: shouldInvalidate,
    message,
  };
}
