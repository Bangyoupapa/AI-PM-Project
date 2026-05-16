import { describe, it, expect } from "vitest";
import { buildAiSuggestionUpdate, buildConfirmUpdate } from "@/lib/compliance/verdictWriter";

describe("buildAiSuggestionUpdate", () => {
  it("sets status to AI_PENDING and records the AI verdict", () => {
    const update = buildAiSuggestionUpdate({ suggestedStatus: "PASS", reasoning: "鉛含量符合" });
    expect(update.status).toBe("AI_PENDING");
    expect(update.isAiSuggested).toBe(true);
    expect(update.aiSuggestedStatus).toBe("PASS");
    expect(update.aiReasoning).toBe("鉛含量符合");
  });
});

describe("buildConfirmUpdate", () => {
  it("applies the AI suggested status and clears AI fields when confirming AI verdict", () => {
    const update = buildConfirmUpdate({ isAiSuggested: true, aiSuggestedStatus: "PASS" }, "PASS");
    expect(update.status).toBe("PASS");
    expect(update.isAiSuggested).toBe(false);
    expect(update.aiSuggestedStatus).toBeNull();
  });

  it("applies a manual status override and clears AI fields", () => {
    const update = buildConfirmUpdate({ isAiSuggested: true, aiSuggestedStatus: "PASS" }, "FAIL");
    expect(update.status).toBe("FAIL");
    expect(update.isAiSuggested).toBe(false);
    expect(update.aiSuggestedStatus).toBeNull();
  });

  it("passes through a manual status when record was never AI-suggested", () => {
    const update = buildConfirmUpdate({ isAiSuggested: false, aiSuggestedStatus: null }, "PENDING");
    expect(update.status).toBe("PENDING");
    expect(update.isAiSuggested).toBe(false);
    expect(update.aiSuggestedStatus).toBeNull();
  });
});
