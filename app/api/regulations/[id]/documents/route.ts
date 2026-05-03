import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { config } from "@/config";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const regulation = await prisma.regulation.findUnique({ where: { id } });
    if (!regulation) {
      return NextResponse.json({ error: "找不到此法規" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "未收到檔案" }, { status: 400 });
    }

    if (file.size > config.upload.maxSizeBytes) {
      return NextResponse.json({ error: "檔案超過 50MB 限制" }, { status: 400 });
    }

    const mimeType = file.type || "application/octet-stream";
    if (!(config.upload.allowedMimeTypes as readonly string[]).includes(mimeType)) {
      return NextResponse.json({ error: "僅支援 PDF 或 Word 文件" }, { status: 400 });
    }

    const blob = await put(`regulations/${id}/${file.name}`, file, {
      access: "public",
      contentType: mimeType,
    });

    const doc = await prisma.regulationDocument.create({
      data: {
        regulationId: id,
        fileName: file.name,
        storagePath: blob.url,
        mimeType,
        sizeBytes: file.size,
      },
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error("[POST /api/regulations/:id/documents]", error);
    return NextResponse.json({ error: "上傳文件失敗" }, { status: 500 });
  }
}
