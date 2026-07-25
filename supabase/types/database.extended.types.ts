import type { Database as ApplicationDatabase } from "./database.app.types";
import type { TryoutFollowupFunctions } from "./tryout.followup.types";
import type { TryoutFunctions, TryoutTables } from "./tryout.types";

export type Database = Omit<ApplicationDatabase, "public"> & {
  public: Omit<ApplicationDatabase["public"], "Tables" | "Functions"> & {
    Tables: ApplicationDatabase["public"]["Tables"] & TryoutTables;
    Functions: ApplicationDatabase["public"]["Functions"] &
      TryoutFunctions &
      TryoutFollowupFunctions;
  };
};
