-- CreateTable
CREATE TABLE "RegulationAlert" (
    "id" TEXT NOT NULL,
    "regulationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegulationAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegulationAlert_regulationId_idx" ON "RegulationAlert"("regulationId");

-- CreateIndex
CREATE INDEX "RegulationAlert_fetchedAt_idx" ON "RegulationAlert"("fetchedAt");

-- AddForeignKey
ALTER TABLE "RegulationAlert" ADD CONSTRAINT "RegulationAlert_regulationId_fkey" FOREIGN KEY ("regulationId") REFERENCES "Regulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
