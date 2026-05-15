import { NextRequest, NextResponse } from "next/server";
import { analyzeCompliance } from "@/lib/compliance/analyzeCompliance";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { componentIds } = await req.json() as { componentIds: string[] };
    if (!Array.isArray(componentIds) || componentIds.length === 0) {
      return NextResponse.json({ error: "請提供 componentIds" }, { status: 400 });
    }

    const { analyzed, results } = await analyzeCompliance(componentIds);

    return NextResponse.json({ success: true, analyzed, results });
  } catch (error) {
    console.error("[POST /api/ai/analyze-batch]", error);
    return NextResponse.json({ error: "AI 批次分析失敗" }, { status: 500 });
  }
}
