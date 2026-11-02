import { prisma } from "./prisma";

export interface EventConfigData {
  kaliPujaDate: string; // "2026-11-08"
  bhaiPhontaDate: string; // "2026-11-10"
  quizDurationMinutes: number; // 60
  timeLimitSeconds: number; // 3600
  openHour: number; // 6
  closeHour: number; // 23
  closeMinute: number; // 59
  timezone: string; // "Asia/Kolkata"
}

export const DEFAULT_EVENT_CONFIG: EventConfigData = {
  kaliPujaDate: "2026-11-08",
  bhaiPhontaDate: "2026-11-10",
  quizDurationMinutes: 60,
  timeLimitSeconds: 3600,
  openHour: 6,
  closeHour: 23,
  closeMinute: 59,
  timezone: "Asia/Kolkata",
};

/**
 * Retrieves the central event configuration from the database, or initializes default.
 */
export async function getEventConfiguration(): Promise<EventConfigData> {
  try {
    const config = await prisma.eventConfiguration.findUnique({
      where: { id: "default" },
    });

    if (config) {
      return {
        kaliPujaDate: config.kaliPujaDate,
        bhaiPhontaDate: config.bhaiPhontaDate,
        quizDurationMinutes: config.quizDurationMinutes,
        timeLimitSeconds: config.quizDurationMinutes * 60,
        openHour: config.openHour,
        closeHour: config.closeHour,
        closeMinute: config.closeMinute,
        timezone: config.timezone,
      };
    }

    // Initialize if not present
    await prisma.eventConfiguration.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        kaliPujaDate: DEFAULT_EVENT_CONFIG.kaliPujaDate,
        bhaiPhontaDate: DEFAULT_EVENT_CONFIG.bhaiPhontaDate,
        quizDurationMinutes: DEFAULT_EVENT_CONFIG.quizDurationMinutes,
        openHour: DEFAULT_EVENT_CONFIG.openHour,
        closeHour: DEFAULT_EVENT_CONFIG.closeHour,
        closeMinute: DEFAULT_EVENT_CONFIG.closeMinute,
        timezone: DEFAULT_EVENT_CONFIG.timezone,
      },
    });
  } catch (err) {
    console.warn("Could not query EventConfiguration table, falling back to defaults:", err);
  }

  return DEFAULT_EVENT_CONFIG;
}

/**
 * Checks whether a quiz is currently open according to scheduled window in Asia/Kolkata.
 * Allows override in development or when testing.
 */
export async function isQuizScheduleOpen(slug: string): Promise<{
  isOpen: boolean;
  message?: string;
  opensAt?: string;
  closesAt?: string;
}> {
  const config = await getEventConfiguration();
  const eventDate = slug === "kali-puja" ? config.kaliPujaDate : config.bhaiPhontaDate;

  // If in dev or test mode, allow access for testing
  if (process.env.NODE_ENV !== "production" || process.env.ENABLE_ALL_HOURS === "true") {
    return { isOpen: true };
  }

  // Parse current date & time in Asia/Kolkata
  const now = new Date();
  const kolkataFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: config.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = kolkataFormatter.formatToParts(now);
  const partMap: Record<string, string> = {};
  for (const p of parts) partMap[p.type] = p.value;

  const currentDate = `${partMap.year}-${partMap.month}-${partMap.day}`;
  const currentHour = parseInt(partMap.hour, 10);
  const currentMinute = parseInt(partMap.minute, 10);

  const opensAt = `${eventDate} সকাল ০৬:০০`;
  const closesAt = `${eventDate} রাত ১১:৫৯`;

  if (currentDate < eventDate) {
    return {
      isOpen: false,
      message: `এই কুইজটি নির্ধারিত দিনে (${opensAt}) উন্মুক্ত করা হবে। অনুগ্রহ করে অপেক্ষা করুন।`,
      opensAt,
      closesAt,
    };
  }

  if (currentDate > eventDate) {
    return {
      isOpen: false,
      message: `এই কুইজটির সময়সীমা (${closesAt}) অতিক্রান্ত হয়েছে। কুইজটি সমাপ্ত ঘোষণা করা হয়েছে।`,
      opensAt,
      closesAt,
    };
  }

  // Same date - check hours
  if (currentHour < config.openHour) {
    return {
      isOpen: false,
      message: `আজকের কুইজ সকাল ০৬:০০ ঘটিকায় শুরু হবে।`,
      opensAt,
      closesAt,
    };
  }

  if (currentHour > config.closeHour || (currentHour === config.closeHour && currentMinute > config.closeMinute)) {
    return {
      isOpen: false,
      message: `আজকের কুইজের সময় রাত ১১:৫৯ মিনিটে শেষ হয়ে গিয়েছে।`,
      opensAt,
      closesAt,
    };
  }

  return { isOpen: true, opensAt, closesAt };
}
