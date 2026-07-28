export type CourseCommunityLinkRow = {
  course_id: string;
  whatsapp_group_url: string;
  created_at: string;
  updated_at: string;
};

export type CourseCommunityLinkTables = {
  course_community_links: {
    Row: CourseCommunityLinkRow;
    Insert: {
      course_id: string;
      whatsapp_group_url: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      course_id?: string;
      whatsapp_group_url?: string;
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [
      {
        foreignKeyName: "course_community_links_course_id_fkey";
        columns: ["course_id"];
        isOneToOne: true;
        referencedRelation: "courses";
        referencedColumns: ["id"];
      },
    ];
  };
};
