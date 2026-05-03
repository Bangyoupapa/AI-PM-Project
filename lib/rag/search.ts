import { prisma } from "@/lib/prisma";

export interface ChunkResult {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  fileName: string;
  regulationCode: string;
}

export async function searchChunks(
  _queryEmbedding: number[],
  topK = 5
): Promise<ChunkResult[]> {
  // When real embeddings are available, use pgvector cosine similarity:
  // SELECT id, document_id, chunk_index, content, 1 - (embedding <=> $1) AS score
  // FROM "RegulationChunk"
  // ORDER BY embedding <=> $1
  // LIMIT $2

  // For now, return the most recently indexed chunks as a fallback
  const chunks = await prisma.regulationChunk.findMany({
    take: topK,
    include: {
      document: {
        include: {
          regulation: { select: { code: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return chunks.map((c) => ({
    id: c.id,
    documentId: c.documentId,
    chunkIndex: c.chunkIndex,
    content: c.content,
    fileName: c.document.fileName,
    regulationCode: c.document.regulation.code,
  }));
}
