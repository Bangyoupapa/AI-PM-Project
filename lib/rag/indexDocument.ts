import { prisma } from "@/lib/prisma";
import { MOCK_MODE } from "@/lib/ai";
import { config } from "@/config";

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

export async function indexDocument(documentId: string): Promise<void> {
  const doc = await prisma.regulationDocument.findUnique({
    where: { id: documentId },
    include: { regulation: { select: { code: true } } },
  });
  if (!doc) throw new Error("Document not found");

  // storagePath is a Vercel Blob URL — fetch it directly
  const response = await fetch(doc.storagePath);
  if (!response.ok) throw new Error("無法取得文件檔案");
  const buffer = Buffer.from(await response.arrayBuffer());

  // Dynamic import to avoid client-side bundling issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfParse: (buf: Buffer) => Promise<{ text: string }> = (await import("pdf-parse") as any).default ?? (await import("pdf-parse") as any);
  const { text } = await pdfParse(buffer);

  const rawChunks = chunkText(text, config.rag.chunkSize, config.rag.chunkOverlap);

  await prisma.regulationChunk.deleteMany({ where: { documentId } });

  if (MOCK_MODE) {
    await prisma.regulationChunk.createMany({
      data: rawChunks.slice(0, 50).map((content, i) => ({
        documentId,
        chunkIndex: i,
        content,
      })),
    });
  } else {
    // TODO: generate embeddings with Vercel AI SDK embed()
    // const { embed } = await import("ai");
    // const { embedding } = await embed({ model: embeddingModel, value: chunk });
    await prisma.regulationChunk.createMany({
      data: rawChunks.slice(0, 50).map((content, i) => ({
        documentId,
        chunkIndex: i,
        content,
      })),
    });
  }

  await prisma.regulationDocument.update({
    where: { id: documentId },
    data: { isIndexed: true, indexedAt: new Date() },
  });
}
