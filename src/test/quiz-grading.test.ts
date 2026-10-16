import { describe, expect, it } from "vitest";
import {
  getCorrectOptionText,
  getGradeableQuestions,
  getOptionsForQuestion,
  hasGradeableOptions,
} from "../lib/quizGrading";
import { aptitudeQuestions } from "../data/aptitudeQuestionsData";
import { dsaQuestions } from "../data/dsaQuestionsData";
import { sqlQuestions } from "../data/sqlQuestionsData";

type Option = { text: string; isCorrect: boolean };
type Question = { id: number; options?: Option[] };

const graded: Question = {
  id: 1,
  options: [
    { text: "Alpha", isCorrect: false },
    { text: "Beta", isCorrect: true },
    { text: "Gamma", isCorrect: false },
  ],
};

const ungraded: Question = { id: 2 };

describe("quiz grading helpers", () => {
  it("treats only questions with real options as gradeable", () => {
    expect(hasGradeableOptions(graded)).toBe(true);
    expect(hasGradeableOptions(ungraded)).toBe(false);
    expect(hasGradeableOptions({ id: 3, options: [] })).toBe(false);
  });

  it("filters option-less questions out of the quiz pool", () => {
    expect(getGradeableQuestions([graded, ungraded])).toEqual([graded]);
    expect(getGradeableQuestions([ungraded])).toEqual([]);
  });

  it("returns the real options for a gradeable question", () => {
    expect(getOptionsForQuestion(graded)).toEqual(graded.options);
  });

  it("never fabricates options for an option-less question", () => {
    expect(getOptionsForQuestion(ungraded)).toEqual([]);
    // The old fallback returned a literal "Correct Answer" option here,
    // handing every user a free correct answer.
    expect(
      getOptionsForQuestion(ungraded).some(
        (o) => o.text.toLowerCase() === "correct answer",
      ),
    ).toBe(false);
  });

  it("never reports a fabricated correct answer for an option-less question", () => {
    expect(getCorrectOptionText(ungraded)).toBe("");
    expect(getCorrectOptionText(graded)).toBe("Beta");
  });

  it("never marks an arbitrary option correct for an option-less question", () => {
    // The old DSA/SQL fallback marked options[question.id % 4] correct.
    const optionLess = { id: 7, options: undefined };
    expect(getCorrectOptionText(optionLess)).toBe("");
  });
});

describe("quiz question banks (data invariants)", () => {
  const banks: [string, Question[]][] = [
    ["aptitude", aptitudeQuestions as Question[]],
    ["dsa", dsaQuestions as Question[]],
    ["sql", sqlQuestions as Question[]],
  ];

  it.each(banks)(
    "%s: every question with options has exactly one correct option",
    (_name, questions) => {
      for (const q of questions) {
        if (q.options && q.options.length > 0) {
          expect(
            q.options.filter((o) => o.isCorrect),
            `question id ${q.id} must have exactly one correct option`,
          ).toHaveLength(1);
        }
      }
    },
  );

  it.each(banks)(
    "%s: no option in the data is labeled 'Correct Answer'",
    (_name, questions) => {
      for (const q of questions) {
        for (const o of q.options ?? []) {
          expect(o.text.toLowerCase()).not.toBe("correct answer");
        }
      }
    },
  );

  it.each(banks)(
    "%s: gradeable + option-less partitions the whole bank",
    (_name, questions) => {
      const gradeable = getGradeableQuestions(questions);
      expect(gradeable.length).toBeGreaterThan(0);
      expect(gradeable.length).toBeLessThanOrEqual(questions.length);
      expect(
        questions.filter((q) => !hasGradeableOptions(q)).length +
          gradeable.length,
      ).toBe(questions.length);
    },
  );
});
