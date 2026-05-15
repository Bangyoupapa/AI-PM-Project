import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { indexDocument } from "@/lib/rag/indexDocument";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Params {
  params: Promise<{ id: string; docId: string }>;
}

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { id, docId } = await params;

    const doc = await prisma.regulationDocument.findUnique({
      where: { id: docId, regulationId: id },
    });
    if (!doc) return NextResponse.json({ error: "找不到文件" }, { status: 404 });

    await indexDocument(docId);

    return NextResponse.json({ success: true, documentId: docId });
  } catch (error) {
    console.error("[POST /api/regulations/:id/documents/:docId/index]", error);
    return NextResponse.json({ error: "向量化失敗" }, { status: 500 });
  }
}
