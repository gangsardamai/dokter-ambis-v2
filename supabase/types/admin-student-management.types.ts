export type AdminStudentManagementFunctions = {
  admin_get_student_emails: {
    Args: {
      target_profile_ids: string[];
    };
    Returns: Array<{
      profile_id: string;
      email: string;
    }>;
  };
  admin_delete_student_account: {
    Args: {
      target_profile_id: string;
      confirmation_email: string;
    };
    Returns: boolean;
  };
};
