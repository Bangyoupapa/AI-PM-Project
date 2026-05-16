import type { ComplianceStatus } from "@/lib/types";

export type VerdictUpdateInput = {
  status: ComplianceStatus;
  isAiSuggested: boolean;
  aiSuggestedStatus: ComplianceStatus | null;
  aiReasoning: string | null;
};

export function buildAiSuggestionUpdate(verdict: {
  suggestedStatus: ComplianceStatus;
  reasoning: string;
}): VerdictUpdateInput {
  return {
    status: "AI_PENDING",
    isAiSuggested: true,
    aiSuggestedStatus: verdict.suggestedStatus,
    aiReasoning: verdict.reasoning,
  };
}

export function buildConfirmUpdate(
  record: { isAiSuggested: boolean; aiSuggestedStatus: ComplianceStatus | null },
  confirmedStatus: ComplianceStatus
): VerdictUpdateInput {
  return {
    status: confirmedStatus,
    isAiSuggested: false,
    aiSuggestedStatus: null,
    aiReasoning: null,
  };
}
