import { NextRequest, NextResponse } from "next/server";
import { MOCK_MODE, getMockResponse, getModel, SYSTEM_PROMPT } from "@/lib/ai";
import { generateText } from "ai";
import { config } from "@/config";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages?.[messages.length - 1]?.content ?? "";

    if (MOCK_MODE) {
      const text = await getMockResponse(lastMessage);
      return NextResponse.json({ role: "assistant", content: text });
    }

    // RAG: 抓最相關的法規 chunks 當作 context
    const { searchChunks } = await import("@/lib/rag/search");
    const chunks = await searchChunks([], config.rag.topK);
    const context = chunks.length > 0
      ? chunks.map((c) => `[${c.regulationCode} / ${c.fileName}]\n${c.content}`).join("\n\n---\n\n")
      : "（目前尚無向量化的法規文件，請先上傳並向量化法規 PDF）";

    const model = getModel();
    const { text } = await generateText({
      model,
      system: SYSTEM_PROMPT + "\n\n以下是相關法規文件內容：\n\n" + context,
      messages,
    });

    return NextResponse.json({ role: "assistant", content: text });
  } catch (error) {
    console.error("[POST /api/ai/chat]", error);
    return NextResponse.json({ error: "AI 查詢失敗" }, { status: 500 });
  }
}
