import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

interface Params {
  params: Promise<{ id: string; docId: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { docId } = await params;
    const doc = await prisma.regulationDocument.findUnique({ where: { id: docId } });
    if (!doc) return NextResponse.json({ error: "找不到文件" }, { status: 404 });

    const filePath = path.join(process.cwd(), doc.storagePath);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "文件檔案不存在" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`,
        "Content-Length": String(fileBuffer.length),
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

    const filePath = path.join(process.cwd(), doc.storagePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.regulationDocument.delete({ where: { id: docId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/regulations/:id/documents/:docId]", error);
    return NextResponse.json({ error: "刪除文件失敗" }, { status: 500 });
  }
}
