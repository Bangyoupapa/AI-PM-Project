import { describe, it, expect } from "vitest";
import { buildVerdict } from "../compliance/analyzeCompliance";

const baseComponent = {
  partNumber: "TEST-001",
  name: "Test Part",
  category: "HOUSING" as const,
  material: null,
  leadPpm: null,
  cadmiumPpm: null,
  mercuryPpm: null,
  chromiumPpm: null,
  hasSvhc: null,
};

const un383 = {
  code: "UN38.3",
  name: "UN38.3 Transport",
  description: null,
  substanceLimits: [],
};

const rohs = {
  code: "RoHS",
  name: "RoHS 2011/65/EU",
  description: null,
  substanceLimits: [],
};

describe("buildVerdict — business rules", () => {
  it("HOUSING component vs UN38.3 → NOT_APPLICABLE", () => {
    const result = buildVerdict(baseComponent, un383);
    expect(result.suggestedStatus).toBe("NOT_APPLICABLE");
    expect(result.reasoning).toBeTruthy();
  });

  it("CELL component vs UN38.3 → not NOT_APPLICABLE", () => {
    const cell = { ...baseComponent, category: "CELL" as const };
    const result = buildVerdict(cell, un383);
    expect(result.suggestedStatus).not.toBe("NOT_APPLICABLE");
  });

  it("component with leadPpm > 1000 vs RoHS → FAIL", () => {
    const comp = { ...baseComponent, category: "CONNECTOR" as const, leadPpm: 1500 };
    const result = buildVerdict(comp, rohs);
    expect(result.suggestedStatus).toBe("FAIL");
  });

  it("component with leadPpm ≤ 1000 vs RoHS → PASS", () => {
    const comp = { ...baseComponent, category: "CONNECTOR" as const, leadPpm: 800 };
    const result = buildVerdict(comp, rohs);
    expect(result.suggestedStatus).toBe("PASS");
  });

  it("component with cadmiumPpm > 100 vs RoHS → FAIL", () => {
    const comp = { ...baseComponent, category: "CONNECTOR" as const, cadmiumPpm: 150 };
    const result = buildVerdict(comp, rohs);
    expect(result.suggestedStatus).toBe("FAIL");
  });

  it("component with no substance data → PENDING", () => {
    const result = buildVerdict({ ...baseComponent, category: "CONNECTOR" as const }, rohs);
    expect(result.suggestedStatus).toBe("PENDING");
  });
});
