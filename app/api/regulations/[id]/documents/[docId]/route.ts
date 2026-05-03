import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";

export const runtime = "nodejs";

interface Params {
  params: Promise<{ id: string; docId: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { docId } = await params;
    const doc = await prisma.regulationDocument.findUnique({ where: { id: docId } });
    if (!doc) return NextResponse.json({ error: "找不到文件" }, { status: 404 });

    // storagePath is now a Vercel Blob URL — redirect to it for download
    return NextResponse.redirect(doc.storagePath, {
      headers: {
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`,
      },
    });
  } catch (error) {
    console.error("[GET /api/regulations/:id/documents/:docId]", error);
    return NextResponse.json({ error: "下載文件失敗" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { docId } = await params;
    const doc = await prisma.regulationDocument.findUnique({ where: { id: docId } });
    if (!doc) return NextResponse.json({ error: "找不到文件" }, { status: 404 });

    // Delete from Vercel Blob storage
    await del(doc.storagePath);

    await prisma.regulationDocument.delete({ where: { id: docId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/regulations/:id/documents/:docId]", error);
    return NextResponse.json({ error: "刪除文件失敗" }, { status: 500 });
  }
}
