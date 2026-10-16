/**
 * Quiz grading helpers.
 *
 * A quiz question is only gradeable when the data ships real options for
 * it. The old per-component fallbacks fabricated a correct answer for
 * option-less questions — Aptitude returned a literal "Correct Answer"
 * option, DSA/SQL marked options[question.id % 4] correct — so scores,
 * XP, and achievements built on those questions were meaningless. The
 * question banks carry the real answer as a markdown explanation
 * (`question.answer`), not as a choosable option, so there is nothing
 * honest to grade an option-less question against.
 *
 * Rule: option-less questions never enter a quiz pool, and no helper here
 * ever invents options or a correct answer.
 */

export type GradeableOption = { text: string; isCorrect: boolean };

export type QuestionWithOptions = {
  options?: GradeableOption[];
};

/** True when the question ships at least one real option. */
export function hasGradeableOptions(
  question: QuestionWithOptions,
): boolean {
  return Array.isArray(question.options) && question.options.length > 0;
}

/** Keep only the questions that can actually be graded. */
export function getGradeableQuestions<T extends QuestionWithOptions>(
  questions: T[],
): T[] {
  return questions.filter(hasGradeableOptions);
}

/** The real options for a question, or [] when it has none. Never fabricated. */
export function getOptionsForQuestion(
  question: QuestionWithOptions,
): GradeableOption[] {
  return question.options ?? [];
}

/** Text of the real correct option, or "" when there is none. Never fabricated. */
export function getCorrectOptionText(question: QuestionWithOptions): string {
  return getOptionsForQuestion(question).find((o) => o.isCorrect)?.text ?? "";
}
