export type CoursePinTables = {
  course_pins: {
    Row: {
      profile_id: string;
      course_id: string;
      pinned_at: string;
    };
    Insert: {
      profile_id: string;
      course_id: string;
      pinned_at?: string;
    };
    Update: {
      profile_id?: string;
      course_id?: string;
      pinned_at?: string;
    };
    Relationships: [
      {
        foreignKeyName: "course_pins_profile_id_fkey";
        columns: ["profile_id"];
        isOneToOne: false;
        referencedRelation: "profiles";
        referencedColumns: ["id"];
      },
      {
        foreignKeyName: "course_pins_course_id_fkey";
        columns: ["course_id"];
        isOneToOne: false;
        referencedRelation: "courses";
        referencedColumns: ["id"];
      },
    ];
  };
};
