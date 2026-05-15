import { describe, it, expect } from "vitest";
import { $Enums } from "@prisma/client";
import { COMPLIANCE_STATUS_LABELS, COMPLIANCE_STATUS_COLORS } from "../types";
import { upsertComplianceSchema } from "../validations/compliance.schema";

const ALL_STATUSES = Object.values($Enums.ComplianceStatus);

describe("COMPLIANCE_STATUS_LABELS", () => {
  it("has an entry for every ComplianceStatus value", () => {
    for (const status of ALL_STATUSES) {
      expect(COMPLIANCE_STATUS_LABELS).toHaveProperty(status);
      expect(COMPLIANCE_STATUS_LABELS[status]).toBeTruthy();
    }
  });
});

describe("COMPLIANCE_STATUS_COLORS", () => {
  it("has an entry for every ComplianceStatus value", () => {
    for (const status of ALL_STATUSES) {
      expect(COMPLIANCE_STATUS_COLORS).toHaveProperty(status);
      expect(COMPLIANCE_STATUS_COLORS[status]).toBeTruthy();
    }
  });
});

describe("upsertComplianceSchema — human-facing status validation", () => {
  const validBase = {
    componentId: "cmp1",
    regulationId: "reg1",
  };

  it.each(["PASS", "FAIL", "PENDING", "NOT_APPLICABLE", "EXPIRED"])(
    "accepts %s",
    (status) => {
      const result = upsertComplianceSchema.safeParse({ ...validBase, status });
      expect(result.success).toBe(true);
    }
  );

  it("rejects AI_PENDING — it is system-set only, never human-submitted", () => {
    const result = upsertComplianceSchema.safeParse({ ...validBase, status: "AI_PENDING" });
    expect(result.success).toBe(false);
  });
});
