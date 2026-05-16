import { describe, it, expect } from "vitest";
import { classifyExpiryUrgency } from "@/lib/alerts/classifyExpiry";

const TODAY = new Date("2026-05-16");

describe("classifyExpiryUrgency", () => {
  it("returns null when expiresAt is null", () => {
    expect(classifyExpiryUrgency(null, TODAY)).toBeNull();
  });

  it("returns null when more than 90 days away", () => {
    const future = new Date("2026-08-15"); // 91 days from today
    expect(classifyExpiryUrgency(future, TODAY)).toBeNull();
  });

  it("returns warning when exactly 90 days away", () => {
    const future = new Date("2026-08-14"); // 90 days from today
    expect(classifyExpiryUrgency(future, TODAY)).toBe("warning");
  });

  it("returns danger when exactly 30 days away", () => {
    const future = new Date("2026-06-15"); // 30 days from today
    expect(classifyExpiryUrgency(future, TODAY)).toBe("danger");
  });

  it("returns danger when already expired", () => {
    const past = new Date("2026-01-01");
    expect(classifyExpiryUrgency(past, TODAY)).toBe("danger");
  });
});
