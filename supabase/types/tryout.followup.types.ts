import type { Json } from "./database.types";
import type { TryoutDifficulty } from "./tryout.types";

export type TryoutFollowupFunctions = {
  get_student_tryout_summaries: {
    Args: { target_course_id: string };
    Returns: Json;
  };
  get_tryout_review: {
    Args: { target_attempt_id: string };
    Returns: Json;
  };
  admin_update_tryout_question: {
    Args: {
      target_question_id: string;
      question_text: string;
      explanation_text: string;
      question_image_path: string;
      explanation_image_path: string;
      topic_text: string;
      difficulty_text: TryoutDifficulty;
      question_points: number;
      option_texts: string[];
      correct_option_index: number;
    };
    Returns: string;
  };
};
