import { StatusBadge } from "@/components/admin";

import type { Database } from "@/supabase/types/database.types";

type PromotionStatus =
  Database["public"]["Enums"]["promotion_status"];

interface PromotionStatusBadgeProps {
  status: PromotionStatus;
}

export default function PromotionStatusBadge({
  status,
}: PromotionStatusBadgeProps) {
  return (
    <StatusBadge
      label={status === "active" ? "Aktif" : "Tidak Aktif"}
      color={status === "active" ? "green" : "red"}
    />
  );
}
