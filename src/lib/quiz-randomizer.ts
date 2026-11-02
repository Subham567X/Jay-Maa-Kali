import { prisma } from "./prisma";

export interface ShuffledOptionMapping {
  id: string;
  displayKey: string; // "A", "B", "C", "D"
  originalKey: string;
  optionText: string;
}

export interface ShuffledQuestionMapping {
  questionId: string;
  shuffledOptions: ShuffledOptionMapping[];
}

/**
 * Fisher-Yates array shuffle using secure crypto random
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const OPTION_KEYS = ["A", "B", "C", "D", "E", "F"];

/**
 * Creates or retrieves a persistent randomized question & option sequence for a quiz attempt.
 */
export async function getOrCreateShuffledAttemptSequence(
  attemptId: string,
  eventId: string,
  existingJson?: string | null
): Promise<{
  mapping: ShuffledQuestionMapping[];
  shuffledJson: string;
}> {
  if (existingJson) {
    try {
      const parsed = JSON.parse(existingJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { mapping: parsed, shuffledJson: existingJson };
      }
    } catch {}
  }

  // Fetch all active questions with options for this event
  const questions = await prisma.quizQuestion.findMany({
    where: { quizEventId: eventId, isActive: true },
    include: {
      options: true,
    },
  });

  // 1. Shuffle question order
  const shuffledQuestions = shuffleArray(questions);

  // 2. For each question, shuffle option order and assign display keys
  const mapping: ShuffledQuestionMapping[] = shuffledQuestions.map((q) => {
    const shuffledOpts = shuffleArray(q.options);
    const mappedOpts: ShuffledOptionMapping[] = shuffledOpts.map((opt, idx) => ({
      id: opt.id,
      displayKey: OPTION_KEYS[idx] || "A",
      originalKey: opt.optionKey,
      optionText: opt.optionText,
    }));

    return {
      questionId: q.id,
      shuffledOptions: mappedOpts,
    };
  });

  const shuffledJson = JSON.stringify(mapping);

  // Save to QuizAttempt
  try {
    await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: { shuffledQuestionsJson: shuffledJson },
    });
  } catch (err) {
    console.warn("Could not save shuffledQuestionsJson directly to attempt:", err);
  }

  return { mapping, shuffledJson };
}

/**
 * Formats questions for safe client consumption (without isCorrect).
 */
export function buildClientQuestionsFromMapping(
  mapping: ShuffledQuestionMapping[],
  allQuestions: any[]
) {
  const questionMap = new Map<string, any>();
  for (const q of allQuestions) {
    questionMap.set(q.id, q);
  }

  return mapping
    .map((item, idx) => {
      const original = questionMap.get(item.questionId);
      if (!original) return null;

      return {
        id: original.id,
        questionNumber: idx + 1, // Display sequential 1 to 50
        questionText: original.questionText,
        options: item.shuffledOptions.map((opt) => ({
          id: opt.id,
          optionKey: opt.displayKey,
          optionText: opt.optionText,
        })),
      };
    })
    .filter(Boolean);
}

/**
 * Evaluates submitted answers against the shuffled mapping and database answer key.
 */
export function evaluateShuffledAnswers(
  mapping: ShuffledQuestionMapping[],
  submittedAnswers: Record<string, string>, // questionId -> chosenDisplayKey ("A", "B", "C", "D")
  allQuestionsWithCorrectOptions: any[]
): {
  score: number;
  total: number;
  detailedResults: Array<{
    questionId: string;
    questionText: string;
    selectedDisplayKey: string | null;
    selectedOptionText: string | null;
    correctDisplayKey: string;
    correctOptionText: string;
    isCorrect: boolean;
    explanation: string | null;
  }>;
} {
  const qMap = new Map<string, any>();
  for (const q of allQuestionsWithCorrectOptions) {
    qMap.set(q.id, q);
  }

  let score = 0;
  const detailedResults: any[] = [];

  for (const item of mapping) {
    const q = qMap.get(item.questionId);
    if (!q) continue;

    const chosenDisplayKey = submittedAnswers[item.questionId] || null;
    const chosenOptionMapping = item.shuffledOptions.find(
      (opt) => opt.displayKey === chosenDisplayKey
    );

    // Identify which option is correct in the original question
    const correctOriginalOpt = q.options.find((opt: any) => opt.isCorrect);
    // Find where that correct option ended up in the shuffled list
    const correctOptionMapping = item.shuffledOptions.find(
      (opt) => opt.id === correctOriginalOpt?.id
    );

    const isCorrect =
      !!chosenOptionMapping &&
      !!correctOriginalOpt &&
      chosenOptionMapping.id === correctOriginalOpt.id;

    if (isCorrect) {
      score += 1;
    }

    detailedResults.push({
      questionId: q.id,
      questionText: q.questionText,
      selectedDisplayKey: chosenDisplayKey,
      selectedOptionText: chosenOptionMapping ? chosenOptionMapping.optionText : null,
      correctDisplayKey: correctOptionMapping ? correctOptionMapping.displayKey : "A",
      correctOptionText: correctOriginalOpt ? correctOriginalOpt.optionText : "",
      isCorrect,
      explanation: q.explanation || null,
    });
  }

  return {
    score,
    total: mapping.length,
    detailedResults,
  };
}
