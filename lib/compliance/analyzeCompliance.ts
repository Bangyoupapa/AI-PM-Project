import { prisma } from "@/lib/prisma";
import { MOCK_MODE, getModel } from "@/lib/ai";
import { generateObject } from "ai";
import { z } from "zod";

export type ComponentInput = {
  partNumber: string;
  name: string;
  category: string;
  material: string | null;
  leadPpm: number | null;
  cadmiumPpm: number | null;
  mercuryPpm: number | null;
  chromiumPpm: number | null;
  hasSvhc: boolean | null;
};

export type RegulationInput = {
  code: string;
  name: string;
  description: string | null;
  substanceLimits: {
    substanceName: string;
    limitValue: number | null;
    limitUnit: string | null;
    notes: string | null;
  }[];
};

export type AiSuggestedStatus = "PASS" | "FAIL" | "PENDING" | "NOT_APPLICABLE";

export type VerdictResult = {
  suggestedStatus: AiSuggestedStatus;
  reasoning: string;
};

export type AnalysisResult = {
  componentId: string;
  regulationId: string;
  suggestedStatus: AiSuggestedStatus;
  reasoning: string;
};

const STRUCTURAL_CATEGORIES = ["HOUSING", "CONNECTOR", "SEPARATOR"];

// Pure function — testable without DB or AI
export function buildVerdict(
  component: ComponentInput,
  regulation: RegulationInput
): VerdictResult {
  const isStructural = STRUCTURAL_CATEGORIES.includes(component.category);

  if (regulation.code === "UN38.3" && component.category !== "CELL" && component.category !== "BMS") {
    return { suggestedStatus: "NOT_APPLICABLE", reasoning: "非電池或電池模組，不適用 UN38.3 運輸測試規範" };
  }
  if (regulation.code === "IEC-62133" && isStructural) {
    return { suggestedStatus: "NOT_APPLICABLE", reasoning: "結構件不適用 IEC 62133 安全測試" };
  }
  if (regulation.code === "PSE" && isStructural) {
    return { suggestedStatus: "NOT_APPLICABLE", reasoning: "結構件不需要 PSE 認證" };
  }
  if (regulation.code === "RoHS") {
    if (component.leadPpm != null && component.leadPpm > 1000) {
      return { suggestedStatus: "FAIL", reasoning: `鉛含量 ${component.leadPpm} ppm 超出 RoHS 限值 1000 ppm` };
    }
    if (component.cadmiumPpm != null && component.cadmiumPpm > 100) {
      return { suggestedStatus: "FAIL", reasoning: `鎘含量 ${component.cadmiumPpm} ppm 超出 RoHS 限值 100 ppm` };
    }
    if (component.leadPpm != null) {
      return { suggestedStatus: "PASS", reasoning: `鉛含量 ${component.leadPpm} ppm 符合 RoHS 限值 1000 ppm` };
    }
  }
  return { suggestedStatus: "PENDING", reasoning: "物質含量資料不足，建議提供實測報告" };
}

const aiResultSchema = z.object({
  status: z.enum(["PASS", "FAIL", "PENDING", "NOT_APPLICABLE"]),
  reasoning: z.string(),
});

async function buildVerdictWithAI(
  component: ComponentInput,
  regulation: RegulationInput
): Promise<VerdictResult> {
  const model = getModel();

  const substanceSummary = [
    component.leadPpm != null ? `鉛(Pb): ${component.leadPpm} ppm` : null,
    component.cadmiumPpm != null ? `鎘(Cd): ${component.cadmiumPpm} ppm` : null,
    component.mercuryPpm != null ? `汞(Hg): ${component.mercuryPpm} ppm` : null,
    component.chromiumPpm != null ? `六價鉻(Cr VI): ${component.chromiumPpm} ppm` : null,
    component.hasSvhc != null ? `含SVHC: ${component.hasSvhc ? "是" : "否"}` : null,
  ].filter(Boolean).join("、") || "無具體含量數據";

  const limitsText = regulation.substanceLimits.length > 0
    ? regulation.substanceLimits.map(l =>
        `${l.substanceName}: 限值 ${l.limitValue ?? "N/A"} ${l.limitUnit ?? ""}${l.notes ? `（${l.notes}）` : ""}`
      ).join("\n")
    : "無結構化限值資料";

  const prompt = `請分析以下料件是否符合法規要求。

【料件資訊】
料號：${component.partNumber}
名稱：${component.name}
類別：${component.category}
材質：${component.material ?? "未填寫"}
物質含量：${substanceSummary}

【法規】
法規代號：${regulation.code}
法規名稱：${regulation.name}
法規說明：${regulation.description ?? "無"}

【法規物質限值】
${limitsText}

請根據以上資訊判斷合規狀態：
- PASS：根據數據明確符合所有限值
- FAIL：根據數據明確超出限值
- NOT_APPLICABLE：此類別料件不適用此法規（例如結構件不適用UN38.3）
- PENDING：資料不足以判斷，需要更多檢測數據

並用繁體中文說明判斷理由（50字以內）。`;

  const result = await generateObject({ model, schema: aiResultSchema, prompt });
  return { suggestedStatus: result.object.status, reasoning: result.object.reasoning };
}

// Orchestrator: fetch → analyze → persist AI-Suggested Records
export async function analyzeCompliance(
  componentIds: string[]
): Promise<{ analyzed: number; results: AnalysisResult[] }> {
  const [components, regulations] = await Promise.all([
    prisma.component.findMany({
      where: { id: { in: componentIds } },
      select: {
        id: true, partNumber: true, name: true, category: true,
        material: true, leadPpm: true, cadmiumPpm: true, mercuryPpm: true,
        chromiumPpm: true, hasSvhc: true,
      },
    }),
    prisma.regulation.findMany({
      where: { isActive: true },
      select: {
        id: true, code: true, name: true, description: true,
        substanceLimits: {
          select: { substanceName: true, limitValue: true, limitUnit: true, notes: true },
        },
      },
    }),
  ]);

  const results: AnalysisResult[] = [];

  for (const component of components) {
    for (const regulation of regulations) {
      let verdict: VerdictResult;

      if (MOCK_MODE) {
        verdict = buildVerdict(component, regulation);
      } else {
        try {
          verdict = await buildVerdictWithAI(component, regulation);
        } catch (err) {
          console.error(`AI analyze failed: ${component.partNumber} × ${regulation.code}`, err);
          verdict = { suggestedStatus: "PENDING", reasoning: "AI 分析失敗，請人工確認" };
        }
      }

      await prisma.complianceRecord.upsert({
        where: { componentId_regulationId: { componentId: component.id, regulationId: regulation.id } },
        create: {
          componentId: component.id,
          regulationId: regulation.id,
          status: "AI_PENDING",
          isAiSuggested: true,
          aiSuggestedStatus: verdict.suggestedStatus,
          aiReasoning: verdict.reasoning,
        },
        update: {
          status: "AI_PENDING",
          isAiSuggested: true,
          aiSuggestedStatus: verdict.suggestedStatus,
          aiReasoning: verdict.reasoning,
        },
      });

      results.push({
        componentId: component.id,
        regulationId: regulation.id,
        suggestedStatus: verdict.suggestedStatus,
        reasoning: verdict.reasoning,
      });
    }
  }

  return { analyzed: results.length, results };
}
