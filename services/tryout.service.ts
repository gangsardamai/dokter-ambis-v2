import { tryoutRepository } from "@/repositories/tryout.repository";

import type {
  AdminTryoutListItem,
  CreateTryoutInput,
  CreateTryoutQuestionInput,
  StudentTryoutListItem,
  TryoutCourseSummary,
  TryoutEditorPayload,
  UpdateTryoutInput,
} from "@/types/tryout";

function mapCourse(
  course: {
    id: string;
    title: string;
    organizations: { title: string } | null;
    programs: { title: string } | null;
  } | null,
): TryoutCourseSummary | null {
  if (!course) return null;

  return {
    id: course.id,
    title: course.title,
    organizationTitle:
      course.organizations?.title ?? "Universitas belum tersedia",
    programTitle: course.programs?.title ?? "Program belum tersedia",
  };
}

function getAvailabilityLabel(
  publicationStatus: string,
  openAt: string | null,
  closeAt: string | null,
): { available: boolean; label: string } {
  const now = Date.now();
  const opens = openAt ? new Date(openAt).getTime() : null;
  const closes = closeAt ? new Date(closeAt).getTime() : null;

  if (
    publicationStatus === "closed" ||
    (closes !== null && now >= closes)
  ) {
    return { available: false, label: "Periode telah berakhir" };
  }

  if (opens !== null && now < opens) {
    return { available: false, label: "Belum dibuka" };
  }

  if (!["scheduled", "published"].includes(publicationStatus)) {
    return { available: false, label: "Belum tersedia" };
  }

  return { available: true, label: "Tersedia" };
}

export class TryoutService {
  async getAdminTryouts(): Promise<AdminTryoutListItem[]> {
    const [tryouts, questionCounts, participantCounts] = await Promise.all([
      tryoutRepository.getAllWithCourses(),
      tryoutRepository.countQuestionsByTryout(),
      tryoutRepository.countParticipantsByTryout(),
    ]);

    return tryouts.map(({ courses, ...tryout }) => ({
      ...tryout,
      course: mapCourse(courses),
      questionCount: questionCounts[tryout.id] ?? 0,
      participantCount: participantCounts[tryout.id] ?? 0,
    }));
  }

  async getEditorPayload(
    tryoutId: string,
  ): Promise<TryoutEditorPayload | null> {
    const tryout = await tryoutRepository.getById(tryoutId);
    if (!tryout) return null;

    const questions = await tryoutRepository.getQuestions(tryoutId);
    const options = await tryoutRepository.getOptions(
      questions.map((question) => question.id),
    );

    const optionsByQuestion = new Map<string, typeof options>();
    for (const option of options) {
      const current = optionsByQuestion.get(option.question_id) ?? [];
      current.push(option);
      optionsByQuestion.set(option.question_id, current);
    }

    const { courses, ...tryoutRow } = tryout;

    return {
      tryout: tryoutRow,
      course: mapCourse(courses),
      questions: questions.map((question) => ({
        ...question,
        options: optionsByQuestion.get(question.id) ?? [],
      })),
    };
  }

  async createTryout(input: CreateTryoutInput) {
    return tryoutRepository.create(input);
  }

  async updateTryout(id: string, input: UpdateTryoutInput) {
    return tryoutRepository.update(id, input);
  }

  async deleteTryout(id: string) {
    return tryoutRepository.delete(id);
  }

  async createQuestion(input: CreateTryoutQuestionInput) {
    return tryoutRepository.createQuestion(input);
  }

  async deleteQuestion(questionId: string) {
    return tryoutRepository.deleteQuestion(questionId);
  }

  async getStudentTryouts(
    profileId: string,
    courseId: string,
  ): Promise<StudentTryoutListItem[]> {
    const tryouts = await tryoutRepository.getByCourse(courseId);
    const tryoutIds = tryouts.map((tryout) => tryout.id);
    const [results, activeAttempts] = await Promise.all([
      tryoutRepository.getStudentResults(profileId, tryoutIds),
      tryoutRepository.getActiveAttempts(profileId, tryoutIds),
    ]);

    const resultsByTryout = new Map(
      results.map((result) => [result.tryout_id, result]),
    );
    const activeByTryout = new Map(
      activeAttempts.map((attempt) => [attempt.tryout_id, attempt]),
    );

    return tryouts.map((tryout) => {
      const availability = getAvailabilityLabel(
        tryout.publication_status,
        tryout.open_at,
        tryout.close_at,
      );
      const result = resultsByTryout.get(tryout.id);
      const activeAttempt = activeByTryout.get(tryout.id);

      return {
        ...tryout,
        attemptsUsed: result?.attempts_used ?? 0,
        bestScore: result?.best_score ?? null,
        passed: result?.passed ?? false,
        activeAttemptId: activeAttempt?.id ?? null,
        isAvailable: availability.available || Boolean(activeAttempt),
        availabilityLabel: activeAttempt
          ? "Sedang dikerjakan"
          : availability.label,
      };
    });
  }

  async getStudentTryoutDetail(profileId: string, tryoutId: string) {
    const row = await tryoutRepository.getById(tryoutId);
    if (!row) return null;

    const items = await this.getStudentTryouts(profileId, row.course_id);
    const tryout = items.find((item) => item.id === tryoutId);
    if (!tryout) return null;

    return {
      tryout,
      course: mapCourse(row.courses),
    };
  }

  async startAttempt(tryoutId: string) {
    return tryoutRepository.startAttempt(tryoutId);
  }

  async getAttempt(attemptId: string) {
    return tryoutRepository.getAttempt(attemptId);
  }

  async saveAnswer(
    attemptId: string,
    questionId: string,
    optionId: string | null,
    markedForReview: boolean,
  ) {
    return tryoutRepository.saveAnswer(
      attemptId,
      questionId,
      optionId,
      markedForReview,
    );
  }

  async submitAttempt(attemptId: string) {
    return tryoutRepository.submitAttempt(attemptId);
  }

  async getResult(attemptId: string) {
    return tryoutRepository.getResult(attemptId);
  }

  async getAdminResults(tryoutId: string) {
    return tryoutRepository.getAdminResults(tryoutId);
  }
}

export const tryoutService = new TryoutService();
