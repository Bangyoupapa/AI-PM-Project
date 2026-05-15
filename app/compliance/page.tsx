import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/layout/PageShell";
import { ComplianceMatrix } from "@/components/compliance/ComplianceMatrix";

export const dynamic = "force-dynamic";

export default async function CompliancePage() {
  const [components, regulations, records] = await Promise.all([
    prisma.component.findMany({
      where: { isActive: true },
      select: { id: true, partNumber: true, name: true, category: true },
      orderBy: { partNumber: "asc" },
    }),
    prisma.regulation.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    }),
    prisma.complianceRecord.findMany({
      select: {
        id: true,
        componentId: true,
        regulationId: true,
        status: true,
        testDate: true,
        expiryDate: true,
        testLab: true,
        reportNumber: true,
        notes: true,
        testedBy: true,
        isAiSuggested: true,
        aiSuggestedStatus: true,
        aiReasoning: true,
      },
    }),
  ]);

  type RawRecord = (typeof records)[number];
  const serialized = records.map((r: RawRecord) => ({
    ...r,
    testDate: r.testDate?.toISOString().split("T")[0] ?? null,
    expiryDate: r.expiryDate?.toISOString().split("T")[0] ?? null,
  }));

  const passCount = records.filter((r: RawRecord) => r.status === "PASS").length;
  const failCount = records.filter((r: RawRecord) => r.status === "FAIL").length;
  const pendingCount = records.filter((r: RawRecord) => r.status === "PENDING").length;
  const aiPendingCount = records.filter((r: RawRecord) => r.status === "AI_PENDING").length;

  const descriptionParts = [
    `${components.length} 料件 × ${regulations.length} 法規`,
    `合格 ${passCount}`,
    `不合格 ${failCount}`,
    `待審 ${pendingCount}`,
    ...(aiPendingCount > 0 ? [`AI 待確認 ${aiPendingCount}`] : []),
  ];

  return (
    <PageShell
      title="合規狀態矩陣"
      description={descriptionParts.join("  ")}
    >
      <ComplianceMatrix
        components={components}
        regulations={regulations}
        initialRecords={serialized}
      />
    </PageShell>
  );
}
