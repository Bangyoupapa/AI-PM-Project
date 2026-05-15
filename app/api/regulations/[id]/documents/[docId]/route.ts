import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";

interface Params {
  params: Promise<{ id: string; docId: string }>;
}

function isRemoteUrl(storagePath: string) {
  return storagePath.startsWith("https://") || storagePath.startsWith("http://");
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { docId } = await params;
    const doc = await prisma.regulationDocument.findUnique({ where: { id: docId } });
    if (!doc) return NextResponse.json({ error: "找不到文件" }, { status: 404 });

    if (isRemoteUrl(doc.storagePath)) {
      // Private Vercel Blob — fetch server-side with token and stream to client
      const blobRes = await fetch(doc.storagePath, {
        headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
      });
      if (!blobRes.ok) throw new Error(`Blob fetch failed: ${blobRes.status}`);
      const buffer = Buffer.from(await blobRes.arrayBuffer());
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": blobRes.headers.get("content-type") ?? doc.mimeType,
          "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`,
        },
      });
    } else {
      // Local file
      const filePath = path.join(process.cwd(), doc.storagePath);
      const buffer = await fs.readFile(filePath);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": doc.mimeType,
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`,
        },
      });
    }
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

    if (isRemoteUrl(doc.storagePath)) {
      const { del } = await import("@vercel/blob");
      await del(doc.storagePath);
    } else {
      const filePath = path.join(process.cwd(), doc.storagePath);
      await fs.unlink(filePath).catch(() => { /* ignore if already gone */ });
    }

    await prisma.regulationDocument.delete({ where: { id: docId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/regulations/:id/documents/:docId]", error);
    return NextResponse.json({ error: "刪除文件失敗" }, { status: 500 });
  }
}
