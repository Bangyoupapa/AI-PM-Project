import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { embed } from "ai";
import { getEmbeddingModel, MOCK_MODE } from "@/lib/ai";

export interface ChunkResult {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  fileName: string;
  regulationCode: string;
}

interface RawChunkRow {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  fileName: string;
  regulationCode: string;
}

export async function searchByQuery(
  query: string,
  topK = 5
): Promise<ChunkResult[]> {
  if (MOCK_MODE) {
    const chunks = await prisma.regulationChunk.findMany({
      take: topK,
      include: {
        document: { include: { regulation: { select: { code: true } } } },
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

  const { embedding } = await embed({ model: getEmbeddingModel(), value: query });
  const vectorLiteral = Prisma.raw(`'[${embedding.join(",")}]'::vector`);

  const rows = await prisma.$queryRaw<RawChunkRow[]>`
    SELECT
      rc.id,
      rc."documentId",
      rc."chunkIndex",
      rc.content,
      rd."fileName",
      r.code AS "regulationCode"
    FROM "RegulationChunk" rc
    JOIN "RegulationDocument" rd ON rc."documentId" = rd.id
    JOIN "Regulation" r ON rd."regulationId" = r.id
    WHERE rc.embedding IS NOT NULL
    ORDER BY rc.embedding <=> ${vectorLiteral}
    LIMIT ${Prisma.raw(String(topK))}
  `;

  return rows;
}
