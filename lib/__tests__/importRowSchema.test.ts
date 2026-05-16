import { describe, it, expect } from "vitest";
import { importRowSchema } from "@/lib/validations/component.schema";

describe("importRowSchema", () => {
  const valid = { partNumber: "PN-001", name: "電芯 A", category: "CELL" };

  it("accepts a valid row", () => {
    expect(importRowSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects missing partNumber", () => {
    const { partNumber: _, ...rest } = valid;
    expect(importRowSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects invalid category", () => {
    expect(importRowSchema.safeParse({ ...valid, category: "BATTERY" }).success).toBe(false);
  });
});
