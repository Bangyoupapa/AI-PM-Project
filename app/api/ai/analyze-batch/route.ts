import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_MODE, getModel } from "@/lib/ai";
import { generateObject } from "ai";
import { z } from "zod";

export const runtime = "nodejs";

const analysisResultSchema = z.object({
  status: z.enum(["PASS", "FAIL", "PENDING", "NOT_APPLICABLE"]),
  reasoning: z.string(),
});

async function analyzeOneWithAI(
  component: {
    partNumber: string;
    name: string;
    category: string;
    material: string | null;
    leadPpm: number | null;
    cadmiumPpm: number | null;
    mercuryPpm: number | null;
    chromiumPpm: number | null;
    hasSvhc: boolean | null;
  },
  regulation: {
    code: string;
    name: string;
    description: string | null;
    substanceLimits: { substanceName: string; limitValue: number | null; limitUnit: string | null; notes: string | null }[];
  }
): Promise<{ status: "PASS" | "FAIL" | "PENDING" | "NOT_APPLICABLE"; reasoning: string }> {
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

  const result = await generateObject({
    model,
    schema: analysisResultSchema,
    prompt,
  });

  return result.object;
}

function mockAnalyze(
  component: { category: string; leadPpm: number | null; cadmiumPpm: number | null },
  regulation: { code: string }
): { status: "PASS" | "FAIL" | "PENDING" | "NOT_APPLICABLE"; reasoning: string } {
  // Mock 模式：簡單規則判斷
  const structuralCategories = ["HOUSING", "CONNECTOR", "SEPARATOR"];
  const isStructural = structuralCategories.includes(component.category);

  if (regulation.code === "UN38.3" && component.category !== "CELL" && component.category !== "BMS") {
    return { status: "NOT_APPLICABLE", reasoning: "非電池或電池模組，不適用 UN38.3 運輸測試規範" };
  }
  if (regulation.code === "IEC-62133" && isStructural) {
    return { status: "NOT_APPLICABLE", reasoning: "結構件不適用 IEC 62133 安全測試" };
  }
  if (regulation.code === "PSE" && isStructural) {
    return { status: "NOT_APPLICABLE", reasoning: "結構件不需要 PSE 認證" };
  }
  if (regulation.code === "RoHS") {
    if (component.leadPpm != null && component.leadPpm > 1000) {
      return { status: "FAIL", reasoning: `鉛含量 ${component.leadPpm} ppm 超出 RoHS 限值 1000 ppm` };
    }
    if (component.cadmiumPpm != null && component.cadmiumPpm > 100) {
      return { status: "FAIL", reasoning: `鎘含量 ${component.cadmiumPpm} ppm 超出 RoHS 限值 100 ppm` };
    }
    if (component.leadPpm != null) {
      return { status: "PASS", reasoning: `鉛含量 ${component.leadPpm} ppm 符合 RoHS 限值 1000 ppm` };
    }
  }
  return { status: "PENDING", reasoning: "物質含量資料不足，建議提供實測報告" };
}

export async function POST(req: NextRequest) {
  try {
    const { componentIds } = await req.json() as { componentIds: string[] };
    if (!Array.isArray(componentIds) || componentIds.length === 0) {
      return NextResponse.json({ error: "請提供 componentIds" }, { status: 400 });
    }

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

    const results: { componentId: string; regulationId: string; status: string; reasoning: string }[] = [];

    for (const component of components) {
      for (const regulation of regulations) {
        let status: "PASS" | "FAIL" | "PENDING" | "NOT_APPLICABLE";
        let reasoning: string;

        if (MOCK_MODE) {
          ({ status, reasoning } = mockAnalyze(component, regulation));
        } else {
          try {
            ({ status, reasoning } = await analyzeOneWithAI(component, regulation));
          } catch (err) {
            console.error(`AI analyze failed: ${component.partNumber} × ${regulation.code}`, err);
            status = "PENDING";
            reasoning = "AI 分析失敗，請人工確認";
          }
        }

        await prisma.complianceRecord.upsert({
          where: { componentId_regulationId: { componentId: component.id, regulationId: regulation.id } },
          create: {
            componentId: component.id,
            regulationId: regulation.id,
            status,
            isAiSuggested: true,
            aiReasoning: reasoning,
          },
          update: {
            status,
            isAiSuggested: true,
            aiReasoning: reasoning,
          },
        });

        results.push({ componentId: component.id, regulationId: regulation.id, status, reasoning });
      }
    }

    return NextResponse.json({ success: true, analyzed: results.length, results });
  } catch (error) {
    console.error("[POST /api/ai/analyze-batch]", error);
    return NextResponse.json({ error: "AI 批次分析失敗" }, { status: 500 });
  }
}
