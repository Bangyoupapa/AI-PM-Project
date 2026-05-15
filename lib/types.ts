import { $Enums } from "@prisma/client";

export type ComplianceStatus = $Enums.ComplianceStatus;

// Compile-time exhaustiveness: Record<ComplianceStatus, T> forces every
// status to have an entry — adding a new enum value breaks the build here
// rather than silently missing it in a UI somewhere.
export const COMPLIANCE_STATUS_LABELS: Record<ComplianceStatus, string> = {
  PASS: "合格",
  FAIL: "不合格",
  PENDING: "待審查",
  AI_PENDING: "待確認（AI建議）",
  NOT_APPLICABLE: "不適用",
  EXPIRED: "已過期",
};

export const COMPLIANCE_STATUS_COLORS: Record<ComplianceStatus, string> = {
  PASS: "bg-green-100 text-green-800",
  FAIL: "bg-red-100 text-red-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  AI_PENDING: "bg-blue-100 text-blue-800",
  NOT_APPLICABLE: "bg-gray-100 text-gray-600",
  EXPIRED: "bg-orange-100 text-orange-800",
};
