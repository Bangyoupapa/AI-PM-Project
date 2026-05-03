-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "ComponentCategory" AS ENUM ('CELL', 'BMS', 'HOUSING', 'CONNECTOR', 'ELECTROLYTE', 'SEPARATOR', 'ANODE', 'CATHODE', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('PASS', 'FAIL', 'PENDING', 'NOT_APPLICABLE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RegulationRegion" AS ENUM ('EU', 'US', 'JP', 'CN', 'TW', 'GLOBAL', 'OTHER');

-- CreateTable
CREATE TABLE "Regulation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "region" "RegulationRegion" NOT NULL,
    "version" TEXT,
    "issuedAt" TIMESTAMP(3),
    "effectiveAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Regulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulationDocument" (
    "id" TEXT NOT NULL,
    "regulationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "description" TEXT,
    "isIndexed" BOOLEAN NOT NULL DEFAULT false,
    "indexedAt" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegulationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulationChunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegulationChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubstanceLimit" (
    "id" TEXT NOT NULL,
    "regulationId" TEXT NOT NULL,
    "substanceName" TEXT NOT NULL,
    "substanceCas" TEXT,
    "limitValue" DOUBLE PRECISION,
    "limitUnit" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubstanceLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "country" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Component" (
    "id" TEXT NOT NULL,
    "partNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "category" "ComponentCategory" NOT NULL,
    "supplierId" TEXT,
    "material" TEXT,
    "description" TEXT,
    "unitOfMeasure" TEXT DEFAULT 'pcs',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "importBatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Component_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComponentImportLog" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "successRows" INTEGER NOT NULL,
    "failedRows" INTEGER NOT NULL,
    "errors" JSONB,
    "importedBy" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComponentImportLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceRecord" (
    "id" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "regulationId" TEXT NOT NULL,
    "status" "ComplianceStatus" NOT NULL DEFAULT 'PENDING',
    "testDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "testLab" TEXT,
    "reportNumber" TEXT,
    "notes" TEXT,
    "testedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Regulation_code_key" ON "Regulation"("code");

-- CreateIndex
CREATE INDEX "RegulationDocument_regulationId_idx" ON "RegulationDocument"("regulationId");

-- CreateIndex
CREATE INDEX "RegulationChunk_documentId_idx" ON "RegulationChunk"("documentId");

-- CreateIndex
CREATE INDEX "SubstanceLimit_regulationId_idx" ON "SubstanceLimit"("regulationId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_name_key" ON "Supplier"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_code_key" ON "Supplier"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Component_partNumber_key" ON "Component"("partNumber");

-- CreateIndex
CREATE INDEX "Component_partNumber_idx" ON "Component"("partNumber");

-- CreateIndex
CREATE INDEX "Component_category_idx" ON "Component"("category");

-- CreateIndex
CREATE INDEX "Component_supplierId_idx" ON "Component"("supplierId");

-- CreateIndex
CREATE INDEX "ComplianceRecord_status_idx" ON "ComplianceRecord"("status");

-- CreateIndex
CREATE INDEX "ComplianceRecord_componentId_idx" ON "ComplianceRecord"("componentId");

-- CreateIndex
CREATE INDEX "ComplianceRecord_regulationId_idx" ON "ComplianceRecord"("regulationId");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceRecord_componentId_regulationId_key" ON "ComplianceRecord"("componentId", "regulationId");

-- AddForeignKey
ALTER TABLE "RegulationDocument" ADD CONSTRAINT "RegulationDocument_regulationId_fkey" FOREIGN KEY ("regulationId") REFERENCES "Regulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulationChunk" ADD CONSTRAINT "RegulationChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "RegulationDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstanceLimit" ADD CONSTRAINT "SubstanceLimit_regulationId_fkey" FOREIGN KEY ("regulationId") REFERENCES "Regulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Component" ADD CONSTRAINT "Component_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Component" ADD CONSTRAINT "Component_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ComponentImportLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceRecord" ADD CONSTRAINT "ComplianceRecord_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceRecord" ADD CONSTRAINT "ComplianceRecord_regulationId_fkey" FOREIGN KEY ("regulationId") REFERENCES "Regulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
