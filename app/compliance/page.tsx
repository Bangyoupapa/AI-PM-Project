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
      },
    }),
  ]);

  const serialized = records.map((r) => ({
    ...r,
    testDate: r.testDate?.toISOString().split("T")[0] ?? null,
    expiryDate: r.expiryDate?.toISOString().split("T")[0] ?? null,
  }));

  const passCount = records.filter((r) => r.status === "PASS").length;
  const failCount = records.filter((r) => r.status === "FAIL").length;
  const pendingCount = records.filter((r) => r.status === "PENDING").length;

  return (
    <PageShell
      title="合規狀態矩陣"
      description={`${components.length} 料件 × ${regulations.length} 法規｜合格 ${passCount}  不合格 ${failCount}  待審 ${pendingCount}`}
    >
      <ComplianceMatrix
        components={components}
        regulations={regulations}
        initialRecords={serialized}
      />
    </PageShell>
  );
}
