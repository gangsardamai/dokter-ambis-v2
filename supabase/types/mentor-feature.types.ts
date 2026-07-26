export type MentorFeatureFunctions = {
  get_message_participant_summaries: {
    Args: { target_profile_ids: string[] };
    Returns: Array<{
      id: string;
      full_name: string;
      university_origin: string | null;
    }>;
  };
  get_managed_tryout_results: {
    Args: { target_tryout_id: string };
    Returns: Array<{
      attempt_id: string;
      student_name: string;
      university_origin: string | null;
      attempt_number: number;
      status: string;
      score: number | null;
      total_correct: number;
      total_wrong: number;
      total_unanswered: number;
      duration_seconds: number | null;
      submitted_at: string | null;
    }>;
  };
};
