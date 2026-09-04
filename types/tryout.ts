import type { Database } from "@/supabase/types/database.extended.types";
import type {
  TryoutDifficulty,
  TryoutPublicationStatus,
  TryoutResultReleaseMode,
  TryoutReviewReleaseMode,
} from "@/supabase/types/tryout.types";

export type Tryout = Database["public"]["Tables"]["tryouts"]["Row"];
export type TryoutInsert = Database["public"]["Tables"]["tryouts"]["Insert"];
export type TryoutUpdate = Database["public"]["Tables"]["tryouts"]["Update"];
export type TryoutQuestion = Database["public"]["Tables"]["tryout_questions"]["Row"];
export type TryoutOption = Database["public"]["Tables"]["tryout_options"]["Row"];

export interface TryoutCourseSummary {
  id: string;
  title: string;
  organizationTitle: string;
  programTitle: string;
}

export interface AdminTryoutListItem extends Tryout {
  course: TryoutCourseSummary | null;
  questionCount: number;
  participantCount: number;
}

export interface TryoutQuestionWithOptions extends TryoutQuestion {
  options: TryoutOption[];
}

export interface TryoutEditorPayload {
  tryout: Tryout;
  course: TryoutCourseSummary | null;
  questions: TryoutQuestionWithOptions[];
}

export interface CreateTryoutInput {
  courseId: string;
  title: string;
  description: string;
  durationMinutes: number;
  maxAttempts: number;
  passingScore: number;
  openAt: string | null;
  closeAt: string | null;
  resultReleaseMode: TryoutResultReleaseMode;
  reviewReleaseMode: TryoutReviewReleaseMode;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  publicationStatus: TryoutPublicationStatus;
  createdBy: string;
}

export type UpdateTryoutInput = Omit<CreateTryoutInput, "createdBy">;

export interface CreateTryoutQuestionInput {
  tryoutId: string;
  question: string;
  explanation: string;
  topic: string;
  difficulty: TryoutDifficulty;
  points: number;
  options: string[];
  correctOptionIndex: number;
  imagePath: string;
  explanationImagePath: string;
}

export interface StudentTryoutSummary {
  tryout_id: string;
  attempts_used: number;
  best_score: number | null;
  passed: boolean;
  result_released: boolean;
  review_released: boolean;
  active_attempt_id: string | null;
  completed_attempts: StudentTryoutAttemptSummary[];
}

export interface StudentTryoutAttemptSummary {
  attempt_id: string;
  attempt_number: number;
  score: number | null;
  status: "submitted" | "expired";
  submitted_at: string | null;
}

export interface StudentTryoutCompletedAttempt {
  attemptId: string;
  attemptNumber: number;
  score: number | null;
  status: "submitted" | "expired";
  submittedAt: string | null;
}

export interface StudentTryoutListItem extends Tryout {
  attemptsUsed: number;
  bestScore: number | null;
  passed: boolean;
  resultReleased: boolean;
  reviewReleased: boolean;
  activeAttemptId: string | null;
  completedAttempts: StudentTryoutCompletedAttempt[];
  isAvailable: boolean;
  availabilityLabel: string;
}

export interface StartTryoutResult {
  attempt_id: string;
  resumed: boolean;
}

export interface TryoutAttemptOption {
  id: string;
  option_text: string;
  image_path: string | null;
}

export interface TryoutAttemptQuestion {
  id: string;
  question: string;
  image_path: string | null;
  topic: string;
  options: TryoutAttemptOption[];
  selected_option_id: string | null;
  is_marked_for_review: boolean;
}

export interface TryoutAttemptPayload {
  status: "in_progress" | "submitted" | "expired";
  attempt_id: string;
  tryout_id?: string;
  title?: string;
  attempt_number?: number;
  expires_at?: string;
  remaining_seconds?: number;
  questions?: TryoutAttemptQuestion[];
  result?: TryoutResultPayload;
}

export interface TryoutResultPayload {
  released?: boolean;
  message?: string;
  attempt_id?: string;
  tryout_id?: string;
  title?: string;
  score?: number;
  passing_score?: number;
  passed?: boolean;
  status?: "submitted" | "expired";
  total_questions?: number;
  total_correct?: number;
  total_wrong?: number;
  total_unanswered?: number;
  duration_seconds?: number;
  review_available?: boolean;
}

export interface TryoutReviewOption {
  id: string;
  option_text: string;
  image_path: string | null;
  is_correct: boolean;
}

export interface TryoutReviewQuestion {
  id: string;
  question_order: number;
  question: string;
  image_path: string | null;
  topic: string;
  difficulty: TryoutDifficulty;
  explanation: string | null;
  explanation_image_path: string | null;
  selected_option_id: string | null;
  is_correct: boolean;
  options: TryoutReviewOption[];
}

export interface TryoutReviewPayload {
  released: boolean;
  message?: string;
  attempt_id?: string;
  tryout_id?: string;
  title?: string;
  score?: number;
  questions?: TryoutReviewQuestion[];
}

export interface AdminTryoutResultItem {
  attemptId: string;
  studentName: string;
  universityOrigin: string | null;
  attemptNumber: number;
  status: string;
  score: number | null;
  totalCorrect: number;
  totalWrong: number;
  totalUnanswered: number;
  durationSeconds: number | null;
  submittedAt: string | null;
}
