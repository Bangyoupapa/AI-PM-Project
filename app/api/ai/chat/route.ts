import { NextRequest, NextResponse } from "next/server";
import { MOCK_MODE, getMockResponse } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages?.[messages.length - 1]?.content ?? "";

    if (MOCK_MODE) {
      const text = await getMockResponse(lastMessage);
      return NextResponse.json({ role: "assistant", content: text });
    }

    // Real LLM implementation (when AI_API_KEY is set):
    // const { searchChunks } = await import("@/lib/rag/search");
    // const chunks = await searchChunks([], config.rag.topK);
    // const context = chunks.map(c => `[${c.regulationCode} / ${c.fileName}]\n${c.content}`).join("\n\n---\n\n");
    // const { streamText } = await import("ai");
    // const { model } = await import("@/lib/ai");
    // const result = streamText({ model, system: SYSTEM_PROMPT + context, messages });
    // return result.toDataStreamResponse();

    return NextResponse.json({ error: "AI_API_KEY 未設定" }, { status: 503 });
  } catch (error) {
    console.error("[POST /api/ai/chat]", error);
    return NextResponse.json({ error: "AI 查詢失敗" }, { status: 500 });
  }
}
