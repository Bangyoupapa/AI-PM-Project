import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { config } from "@/config";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { IncomingMessage } from "http";
import { Readable } from "stream";

export const runtime = "nodejs";

interface Params {
  params: Promise<{ id: string }>;
}

async function parseForm(req: NextRequest): Promise<{ file: formidable.File }> {
  const uploadDir = path.join(process.cwd(), config.upload.dir, "regulations");
  fs.mkdirSync(uploadDir, { recursive: true });

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: config.upload.maxSizeBytes,
  });

  const buffer = Buffer.from(await req.arrayBuffer());
  const readable = Readable.from(buffer) as unknown as IncomingMessage;
  readable.headers = Object.fromEntries(req.headers.entries());
  readable.method = req.method;

  return new Promise((resolve, reject) => {
    form.parse(readable, (err, _fields, files) => {
      if (err) return reject(err);
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) return reject(new Error("未收到檔案"));
      resolve({ file });
    });
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const regulation = await prisma.regulation.findUnique({ where: { id } });
    if (!regulation) {
      return NextResponse.json({ error: "找不到此法規" }, { status: 404 });
    }

    const { file } = await parseForm(req);
    const mimeType = file.mimetype ?? "application/octet-stream";

    if (!(config.upload.allowedMimeTypes as readonly string[]).includes(mimeType)) {
      fs.unlinkSync(file.filepath);
      return NextResponse.json({ error: "僅支援 PDF 或 Word 文件" }, { status: 400 });
    }

    const fileName = file.originalFilename ?? path.basename(file.filepath);
    const destDir = path.join(process.cwd(), config.upload.dir, "regulations", id);
    fs.mkdirSync(destDir, { recursive: true });

    const destPath = path.join(destDir, fileName);
    fs.renameSync(file.filepath, destPath);

    const storagePath = path.join(config.upload.dir, "regulations", id, fileName);

    const doc = await prisma.regulationDocument.create({
      data: {
        regulationId: id,
        fileName,
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
