import { prisma } from "./prisma";

/**
 * Normalizes a name by lowercasing, stripping punctuation,
 * collapsing whitespace, and standardizing phonetic variations in English & Bengali.
 */
export function normalizeName(input: string): string {
  if (!input) return "";

  let str = input.trim().toLowerCase();

  // Normalize Bengali diacritics & common variants
  str = str
    .replace(/[।.,;:'"!@#$%^&*()_+=~`[\]{}|\\/<>?-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Map known Bengali character variants
  str = str
    .replace(/ড়/g, "র")
    .replace(/ঢ়/g, "র")
    .replace(/য়/g, "য")
    .replace(/ৎ/g, "ত")
    .replace(/ং/g, "ঙ")
    .replace(/ঃ/g, "")
    .replace(/ঁ/g, "")
    .replace(/শ/g, "স")
    .replace(/ষ/g, "স");

  return str;
}

/**
 * Strips vowels and collapses English phonetic doubles
 */
function phoneticSimplify(str: string): string {
  return str
    .toLowerCase()
    .replace(/v/g, "b")
    .replace(/w/g, "b")
    .replace(/sh/g, "s")
    .replace(/ee/g, "i")
    .replace(/oo/g, "u")
    .replace(/gh/g, "g")
    .replace(/dh/g, "d")
    .replace(/th/g, "t")
    .replace(/ph/g, "f")
    .replace(/ai/g, "oi")
    .replace(/ui/g, "oi")
    .replace(/paul/g, "pal")
    .replace(/([a-z])\1+/g, "$1") // remove consecutive duplicates
    .replace(/\s+/g, "")
    .trim();
}

/**
 * Computes Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Checks if a participant name matches any Nakunda Kali Puja committee member
 * or their registered spelling aliases.
 */
export async function checkCommitteeExclusion(name: string): Promise<{
  isCommittee: boolean;
  matchReason?: string;
  matchedMemberName?: string;
}> {
  if (!name || name.trim().length === 0) {
    return { isCommittee: false };
  }

  const normalizedInput = normalizeName(name);
  const phoneticInput = phoneticSimplify(normalizedInput);

  // Fetch all active committee members from database
  const committeeMembers = await prisma.committeeMember.findMany({
    where: { isActive: true },
  });

  for (const member of committeeMembers) {
    const memberNorm = normalizeName(member.name);
    const memberPhonetic = phoneticSimplify(memberNorm);

    // 1. Exact or normalized match
    if (normalizedInput === memberNorm || phoneticInput === memberPhonetic) {
      return {
        isCommittee: true,
        matchReason: `Direct match with committee member: ${member.name}`,
        matchedMemberName: member.name,
      };
    }

    // 2. Parse aliases list
    let aliases: string[] = [];
    try {
      aliases = JSON.parse(member.aliases || "[]");
    } catch {
      aliases = member.aliases ? [member.aliases] : [];
    }

    for (const alias of aliases) {
      const aliasNorm = normalizeName(alias);
      const aliasPhonetic = phoneticSimplify(aliasNorm);

      if (normalizedInput === aliasNorm || phoneticInput === aliasPhonetic) {
        return {
          isCommittee: true,
          matchReason: `Matched registered committee alias "${alias}" for ${member.name}`,
          matchedMemberName: member.name,
        };
      }

      // Check Levenshtein distance for close typos
      const dist = levenshteinDistance(phoneticInput, aliasPhonetic);
      if (dist <= 1 && phoneticInput.length > 5) {
        return {
          isCommittee: true,
          matchReason: `High-confidence phonetic typo match (${dist} edit) with alias "${alias}" for ${member.name}`,
          matchedMemberName: member.name,
        };
      }
    }
  }

  // 3. Fallback hardcoded security check for the mandated Nakunda Kali Puja Committee members
  const coreCommitteeHardcoded = [
    {
      id: "subham-ghorui-ghorai",
      canonical: "Subham Ghorui / Subham Ghorai",
      tokens: ["subham", "shubham", "suvum", "ghorui", "ghorai", "gorai", "শুভম", "ঘোড়ুই", "ঘোড়াই"],
    },
    {
      id: "dev-gopal-ghosh",
      canonical: "Dev Gopal Ghosh",
      tokens: ["dev", "deb", "gopal", "ghosh", "গোস", "ঘোষ", "গোপাল", "দেভ", "দেব"],
    },
    {
      id: "bidyut-pal",
      canonical: "Bidyut Pal",
      tokens: ["bidyut", "biddut", "vidyut", "pal", "paul", "বিদ্যুৎ", "পাল", "বিদুত"],
    },
  ];

  for (const core of coreCommitteeHardcoded) {
    if (core.id === "subham-ghorui-ghorai") {
      const hasFirst = normalizedInput.includes("subham") || normalizedInput.includes("shubham") || normalizedInput.includes("শুভম") || normalizedInput.includes("সুভম");
      const hasLast = normalizedInput.includes("ghorui") || normalizedInput.includes("ghorai") || normalizedInput.includes("ঘোড়ুই") || normalizedInput.includes("ঘোড়াই") || normalizedInput.includes("gorai");
      if (hasFirst && hasLast) {
        return {
          isCommittee: true,
          matchReason: `Recognized core committee member: ${core.canonical} (Exclusion rule applied)`,
          matchedMemberName: core.canonical,
        };
      }
    } else if (core.id === "dev-gopal-ghosh") {
      const hasFirst = normalizedInput.includes("dev") || normalizedInput.includes("deb") || normalizedInput.includes("দেভ") || normalizedInput.includes("দেব");
      const hasMid = normalizedInput.includes("gopal") || normalizedInput.includes("গোপাল");
      if (hasFirst && hasMid) {
        return {
          isCommittee: true,
          matchReason: `Recognized core committee member: ${core.canonical} (Exclusion rule applied)`,
          matchedMemberName: core.canonical,
        };
      }
    } else if (core.id === "bidyut-pal") {
      const hasFirst = normalizedInput.includes("bidyut") || normalizedInput.includes("biddut") || normalizedInput.includes("vidyut") || normalizedInput.includes("বিদ্যুৎ") || normalizedInput.includes("বিদুত");
      const hasLast = normalizedInput.includes("pal") || normalizedInput.includes("paul") || normalizedInput.includes("পাল");
      if (hasFirst && hasLast) {
        return {
          isCommittee: true,
          matchReason: `Recognized core committee member: ${core.canonical} (Exclusion rule applied)`,
          matchedMemberName: core.canonical,
        };
      }
    }
  }

  return { isCommittee: false };
}
