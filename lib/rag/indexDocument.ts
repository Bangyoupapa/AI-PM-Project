import { prisma } from "@/lib/prisma";
import { MOCK_MODE, getEmbeddingModel } from "@/lib/ai";
import { config } from "@/config";
import { embedMany } from "ai";
import { Prisma } from "@prisma/client";
import path from "path";
import fs from "fs/promises";

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
    i += chunkSize - overlap;
  }
  return chunks;
}

function isRemoteUrl(storagePath: string) {
  return storagePath.startsWith("https://") || storagePath.startsWith("http://");
}

export async function indexDocument(documentId: string): Promise<void> {
  const doc = await prisma.regulationDocument.findUnique({
    where: { id: documentId },
    include: { regulation: { select: { code: true } } },
  });
  if (!doc) throw new Error("Document not found");

  let buffer: Buffer;
  if (isRemoteUrl(doc.storagePath)) {
    const response = await fetch(doc.storagePath);
    if (!response.ok) throw new Error("無法取得文件檔案");
    buffer = Buffer.from(await response.arrayBuffer());
  } else {
    const filePath = path.join(process.cwd(), doc.storagePath);
    buffer = await fs.readFile(filePath);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfParse: (buf: Buffer) => Promise<{ text: string }> = (await import("pdf-parse") as any).default ?? (await import("pdf-parse") as any);
  const { text } = await pdfParse(buffer);

  const chunks = chunkText(text, config.rag.chunkSize, config.rag.chunkOverlap).slice(0, 50);

  await prisma.regulationChunk.deleteMany({ where: { documentId } });

  if (MOCK_MODE) {
    await prisma.regulationChunk.createMany({
      data: chunks.map((content, i) => ({ documentId, chunkIndex: i, content })),
    });
  } else {
    // Create chunks first to get their IDs
    const created = await prisma.$transaction(
      chunks.map((content, i) =>
        prisma.regulationChunk.create({
          data: { documentId, chunkIndex: i, content },
          select: { id: true },
        })
      )
    );

    // Generate all embeddings in one API call (embedMany handles batching internally)
    const { embeddings } = await embedMany({
      model: getEmbeddingModel(),
      values: chunks,
    });

    // Write embeddings back via raw SQL — Prisma ORM can't write vector columns directly
    await Promise.all(
      created.map((chunk, i) =>
        prisma.$executeRaw`
          UPDATE "RegulationChunk"
          SET embedding = ${Prisma.raw(`'[${embeddings[i].join(",")}]'::vector`)}
          WHERE id = ${chunk.id}
        `
      )
    );
  }

  await prisma.regulationDocument.update({
    where: { id: documentId },
    data: { isIndexed: true, indexedAt: new Date() },
  });
}
