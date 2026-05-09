-- AlterTable
ALTER TABLE "ComplianceRecord" ADD COLUMN     "aiReasoning" TEXT,
ADD COLUMN     "isAiSuggested" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Component" ADD COLUMN     "cadmiumPpm" DOUBLE PRECISION,
ADD COLUMN     "chromiumPpm" DOUBLE PRECISION,
ADD COLUMN     "hasSvhc" BOOLEAN,
ADD COLUMN     "leadPpm" DOUBLE PRECISION,
ADD COLUMN     "mercuryPpm" DOUBLE PRECISION;
