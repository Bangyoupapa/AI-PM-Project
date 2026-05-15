import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload } from "lucide-react";
import { categoryLabel, statusLabel, statusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PartsPage() {
  const components = await prisma.component.findMany({
    where: { isActive: true },
    include: {
      supplier: { select: { name: true } },
      complianceRecords: { select: { status: true } },
    },
    orderBy: { partNumber: "asc" },
  });

  return (
    <PageShell
      title="料件管理"
      description={`共 ${components.length} 筆料件`}
      actions={
        <div className="flex gap-2">
          <Link href="/parts/import">
            <Button size="sm" variant="outline">
              <Upload className="mr-1 h-4 w-4" />
              Excel 匯入
            </Button>
          </Link>
          <Link href="/parts/new">
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              新增料件
            </Button>
          </Link>
        </div>
      }
    >
      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">料號</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">料件名稱</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">類別</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">供應商</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">合規狀態</th>
            </tr>
          </thead>
          <tbody>
            {components.map((comp: (typeof components)[number]) => {
              type CR = (typeof comp.complianceRecords)[number];
              const failCount = comp.complianceRecords.filter((r: CR) => r.status === "FAIL").length;
              const passCount = comp.complianceRecords.filter((r: CR) => r.status === "PASS").length;
              const pendingCount = comp.complianceRecords.filter((r: CR) => r.status === "PENDING").length;
              const aiPendingCount = comp.complianceRecords.filter((r: CR) => r.status === "AI_PENDING").length;
              return (
                <tr key={comp.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/parts/${comp.id}`} className="font-medium text-primary hover:underline font-mono">
                      {comp.partNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{comp.name}</div>
                    {comp.nameEn && <div className="text-xs text-muted-foreground">{comp.nameEn}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{categoryLabel(comp.category)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{comp.supplier?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {comp.complianceRecords.length === 0 ? (
                        <span className="text-muted-foreground text-xs">尚無紀錄</span>
                      ) : (
                        <>
                          {failCount > 0 && <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", statusColor("FAIL"))}>{failCount} 不合格</span>}
                          {passCount > 0 && <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", statusColor("PASS"))}>{passCount} 合格</span>}
                          {pendingCount > 0 && <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", statusColor("PENDING"))}>{pendingCount} 待審</span>}
                          {aiPendingCount > 0 && <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", statusColor("AI_PENDING"))}>{aiPendingCount} AI待確認</span>}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {components.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            尚無料件資料，請點擊「新增料件」或「Excel 匯入」
          </div>
        )}
      </div>
    </PageShell>
  );
}
