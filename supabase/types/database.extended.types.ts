import type { Database as ApplicationDatabase } from "./database.app.types";
import type { MentorFeatureFunctions } from "./mentor-feature.types";
import type { TryoutFollowupFunctions } from "./tryout.followup.types";
import type { PaymentAccountFunctions, PaymentAccountTables } from "./payment-account.types";
import type { TryoutFunctions, TryoutTables } from "./tryout.types";

export type Database = Omit<ApplicationDatabase, "public"> & {
  public: Omit<ApplicationDatabase["public"], "Tables" | "Functions"> & {
    Tables: Omit<ApplicationDatabase["public"]["Tables"], "courses" | "payments"> &
      TryoutTables &
      PaymentAccountTables;
    Functions: ApplicationDatabase["public"]["Functions"] &
      TryoutFunctions &
      TryoutFollowupFunctions &
      PaymentAccountFunctions &
      MentorFeatureFunctions;
  };
};
