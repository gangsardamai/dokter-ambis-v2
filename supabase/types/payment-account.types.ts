import type { Database as GeneratedDatabase } from "./database.types";

type GeneratedPublic = GeneratedDatabase["public"];
type GeneratedCourses = GeneratedPublic["Tables"]["courses"];
type GeneratedEnrollments = GeneratedPublic["Tables"]["enrollments"];
type GeneratedPayments = GeneratedPublic["Tables"]["payments"];

export type PaymentPolicy = "upfront_only" | "upfront_or_deferred";
export type PaymentTiming = "upfront" | "deferred";

export type PaymentAccountRow = {
  id: string;
  label: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type PaymentAccountTables = {
  payment_accounts: {
    Row: PaymentAccountRow;
    Insert: {
      id?: string;
      label: string;
      bank_name: string;
      account_number: string;
      account_holder_name: string;
      is_active?: boolean;
      is_default?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<PaymentAccountTables["payment_accounts"]["Insert"]>;
    Relationships: [];
  };
  courses: {
    Row: GeneratedCourses["Row"] & {
      payment_account_id: string;
      payment_policy: PaymentPolicy;
    };
    Insert: GeneratedCourses["Insert"] & {
      payment_account_id?: string;
      payment_policy?: PaymentPolicy;
    };
    Update: GeneratedCourses["Update"] & {
      payment_account_id?: string;
      payment_policy?: PaymentPolicy;
    };
    Relationships: GeneratedCourses["Relationships"];
  };
  enrollments: {
    Row: GeneratedEnrollments["Row"] & {
      payment_timing: PaymentTiming;
    };
    Insert: GeneratedEnrollments["Insert"] & {
      payment_timing?: PaymentTiming;
    };
    Update: GeneratedEnrollments["Update"] & {
      payment_timing?: PaymentTiming;
    };
    Relationships: GeneratedEnrollments["Relationships"];
  };
  payments: {
    Row: GeneratedPayments["Row"] & {
      payment_account_id: string;
      bank_name_snapshot: string;
      account_number_snapshot: string;
      account_holder_name_snapshot: string;
      payment_account_label_snapshot: string;
    };
    Insert: GeneratedPayments["Insert"] & {
      payment_account_id?: string | null;
      bank_name_snapshot?: string | null;
      account_number_snapshot?: string | null;
      account_holder_name_snapshot?: string | null;
      payment_account_label_snapshot?: string | null;
    };
    Update: GeneratedPayments["Update"] & {
      payment_account_id?: string | null;
      bank_name_snapshot?: string | null;
      account_number_snapshot?: string | null;
      account_holder_name_snapshot?: string | null;
      payment_account_label_snapshot?: string | null;
    };
    Relationships: GeneratedPayments["Relationships"];
  };
};

export type PaymentAccountFunctions = {
  admin_set_default_payment_account: {
    Args: { target_account_id: string };
    Returns: string;
  };
  admin_update_enrollment_payment_timing: {
    Args: {
      target_enrollment_id: string;
      target_payment_timing: PaymentTiming;
    };
    Returns: undefined;
  };
};
