import { NextRequest, NextResponse } from "next/server";
import { indexDocument } from "@/lib/rag/indexDocument";

export const runtime = "nodejs";

interface Params {
  params: Promise<{ id: string; docId: string }>;
}

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { docId } = await params;
    await indexDocument(docId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST index document]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "向量化失敗" },
      { status: 500 }
    );
  }
}
