import { describe, it, expect } from "vitest";
import { $Enums } from "@prisma/client";
import { COMPONENT_CATEGORY_LABELS, type ComponentCategory } from "@/lib/types";

const ALL_CATEGORIES = Object.values($Enums.ComponentCategory) as ComponentCategory[];

describe("COMPONENT_CATEGORY_LABELS", () => {
  it("has a label for every ComponentCategory value", () => {
    for (const cat of ALL_CATEGORIES) {
      expect(COMPONENT_CATEGORY_LABELS).toHaveProperty(cat);
      expect(typeof COMPONENT_CATEGORY_LABELS[cat]).toBe("string");
    }
  });

  it("has no extra keys beyond ComponentCategory values", () => {
    const labelKeys = Object.keys(COMPONENT_CATEGORY_LABELS);
    expect(labelKeys.sort()).toEqual(ALL_CATEGORIES.sort());
  });
});
