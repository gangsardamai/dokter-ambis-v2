import type { LandingMentor } from "@/lib/landing-page";

type LandingPageSettings = {
  id: number;
  course_ids: string[] | null;
  mentors: LandingMentor[] | null;
  revision: string;
};

export type LandingPageTables = {
  landing_page_settings: {
    Row: LandingPageSettings;
    Insert: Partial<LandingPageSettings> & Pick<LandingPageSettings, "id">;
    Update: Partial<Omit<LandingPageSettings, "id">>;
    Relationships: [];
  };
};
