import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { ComplianceChart } from "@/components/dashboard/ComplianceChart";
import { cn, statusLabel, statusColor, formatDate } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const [totalComponents, totalRegulations, statusGroups, expiringSoon, recentRecords, failRecords] =
    await Promise.all([
      prisma.component.count({ where: { isActive: true } }),
      prisma.regulation.count({ where: { isActive: true } }),
      prisma.complianceRecord.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.complianceRecord.findMany({
        where: { status: "PASS", expiryDate: { lte: thirtyDaysFromNow, gte: new Date() } },
        include: {
          component: { select: { partNumber: true, name: true } },
          regulation: { select: { code: true } },
        },
        orderBy: { expiryDate: "asc" },
        take: 5,
      }),
      prisma.complianceRecord.findMany({
        orderBy: { updatedAt: "desc" },
        take: 8,
        include: {
          component: { select: { id: true, partNumber: true, name: true } },
          regulation: { select: { code: true } },
        },
      }),
      prisma.complianceRecord.findMany({
        where: { status: "FAIL" },
        include: {
          component: { select: { id: true, partNumber: true, name: true } },
          regulation: { select: { code: true } },
        },
        take: 5,
      }),
    ]);

  const statusCounts = Object.fromEntries(
    statusGroups.map((g: { status: string; _count: { _all: number } }) => [g.status, g._count._all])
  );
  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const passRate = total > 0 ? Math.round(((statusCounts.PASS ?? 0) / total) * 100) : 0;

  return (
    <PageShell title="儀表板" description="合規狀態總覽">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="料件總數" value={totalComponents} subtitle="筆有效料件" />
          <StatCard title="法規總數" value={totalRegulations} subtitle="條有效法規" />
          <StatCard title="合規紀錄" value={total} subtitle="筆合規狀態" />
          <StatCard
            title="整體合格率"
            value={`${passRate}%`}
            subtitle={`${statusCounts.PASS ?? 0} / ${total} 筆合格`}
            className={passRate >= 80 ? "border-green-200" : passRate >= 50 ? "border-yellow-200" : "border-red-200"}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">合規狀態分布</CardTitle>
            </CardHeader>
            <CardContent>
              <ComplianceChart statusCounts={statusCounts} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                即將到期（30天內）
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expiringSoon.length === 0 ? (
                <p className="text-sm text-muted-foreground">無即將到期的合規紀錄</p>
              ) : (
                <ul className="space-y-2">
                  {expiringSoon.map((r) => (
                    <li key={r.id} className="flex items-center justify-between text-sm">
                      <div>
                        <Link href={`/parts/${r.componentId}`} className="font-mono font-medium hover:underline text-primary">
                          {r.component.partNumber}
                        </Link>
                        <span className="text-muted-foreground"> × {r.regulation.code}</span>
                      </div>
                      <span className="text-orange-600 text-xs font-medium">{formatDate(r.expiryDate)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                不合格料件
              </CardTitle>
            </CardHeader>
            <CardContent>
              {failRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground">目前無不合格紀錄</p>
              ) : (
                <ul className="space-y-2">
                  {failRecords.map((r) => (
                    <li key={r.id} className="flex items-center justify-between text-sm">
                      <div>
                        <Link href={`/parts/${r.component.id}`} className="font-mono font-medium hover:underline text-primary">
                          {r.component.partNumber}
                        </Link>
                        <span className="text-muted-foreground"> × {r.regulation.code}</span>
                      </div>
                      <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", statusColor("FAIL"))}>
                        {statusLabel("FAIL")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">最近更新</CardTitle>
          </CardHeader>
          <CardContent>
            {recentRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground">尚無合規紀錄</p>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">料號</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">料件名稱</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">法規</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">狀態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRecords.map((r) => (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="px-4 py-2 font-mono">
                          <Link href={`/parts/${r.component.id}`} className="text-primary hover:underline">
                            {r.component.partNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">{r.component.name}</td>
                        <td className="px-4 py-2 font-medium">{r.regulation.code}</td>
                        <td className="px-4 py-2">
                          <span className={cn("rounded px-2 py-0.5 text-xs font-medium", statusColor(r.status))}>
                            {statusLabel(r.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
