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
  admin_reset_student_devices: {
    Args: {
      target_profile_id: string;
    };
    Returns: number;
  };
  admin_set_student_password: {
    Args: {
      target_profile_id: string;
      new_password: string;
    };
    Returns: boolean;
  };
  admin_promote_student_to_mentor: {
    Args: {
      target_profile_id: string;
    };
    Returns: string;
  };
};
