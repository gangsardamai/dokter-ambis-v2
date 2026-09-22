export type AnnouncementTables = {
  announcements: {
    Row: {
      id: string;
      created_by: string;
      title: string;
      content: string;
      all_students: boolean;
      is_published: boolean;
      starts_at: string;
      ends_at: string | null;
      show_on_dashboard: boolean;
      display_order: number;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      created_by: string;
      title: string;
      content: string;
      all_students?: boolean;
      is_published?: boolean;
      starts_at?: string;
      ends_at?: string | null;
      show_on_dashboard?: boolean;
      display_order?: number;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      created_by?: string;
      title?: string;
      content?: string;
      all_students?: boolean;
      is_published?: boolean;
      starts_at?: string;
      ends_at?: string | null;
      show_on_dashboard?: boolean;
      display_order?: number;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [
      {
        foreignKeyName: "announcements_created_by_fkey";
        columns: ["created_by"];
        isOneToOne: false;
        referencedRelation: "profiles";
        referencedColumns: ["id"];
      },
    ];
  };
  announcement_organizations: {
    Row: {
      announcement_id: string;
      organization_id: string;
      created_at: string;
    };
    Insert: {
      announcement_id: string;
      organization_id: string;
      created_at?: string;
    };
    Update: {
      announcement_id?: string;
      organization_id?: string;
      created_at?: string;
    };
    Relationships: [
      {
        foreignKeyName: "announcement_organizations_announcement_id_fkey";
        columns: ["announcement_id"];
        isOneToOne: false;
        referencedRelation: "announcements";
        referencedColumns: ["id"];
      },
      {
        foreignKeyName: "announcement_organizations_organization_id_fkey";
        columns: ["organization_id"];
        isOneToOne: false;
        referencedRelation: "organizations";
        referencedColumns: ["id"];
      },
    ];
  };
  announcement_courses: {
    Row: {
      announcement_id: string;
      course_id: string;
      created_at: string;
    };
    Insert: {
      announcement_id: string;
      course_id: string;
      created_at?: string;
    };
    Update: {
      announcement_id?: string;
      course_id?: string;
      created_at?: string;
    };
    Relationships: [
      {
        foreignKeyName: "announcement_courses_announcement_id_fkey";
        columns: ["announcement_id"];
        isOneToOne: false;
        referencedRelation: "announcements";
        referencedColumns: ["id"];
      },
      {
        foreignKeyName: "announcement_courses_course_id_fkey";
        columns: ["course_id"];
        isOneToOne: false;
        referencedRelation: "courses";
        referencedColumns: ["id"];
      },
    ];
  };
};
