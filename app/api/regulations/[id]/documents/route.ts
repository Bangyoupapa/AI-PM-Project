import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { config } from "@/config";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";

const USE_BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

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
      return NextResponse.json({ error: "僅支援 PDF 文件" }, { status: 400 });
    }

    let storagePath: string;

    if (USE_BLOB) {
      const { put } = await import("@vercel/blob");
      const blob = await put(`regulations/${id}/${file.name}`, file, {
        access: "public",
        contentType: mimeType,
      });
      storagePath = blob.url;
    } else {
      // Local fallback: save to uploads/ directory
      const uploadDir = path.join(process.cwd(), "uploads", "regulations", id);
      await fs.mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, file.name);
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);
      storagePath = `uploads/regulations/${id}/${file.name}`;
    }

    const doc = await prisma.regulationDocument.create({
      data: {
        regulationId: id,
        fileName: file.name,
        storagePath,
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
