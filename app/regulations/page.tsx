import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertTriangle, Newspaper, ExternalLink } from "lucide-react";
import { formatDate, regionLabel } from "@/lib/utils";
import { classifyExpiryUrgency } from "@/lib/alerts/classifyExpiry";

export const dynamic = "force-dynamic";

export default async function RegulationsPage() {
  const today = new Date();

  const [regulations, newsAlerts] = await Promise.all([
    prisma.regulation.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { documents: true, substanceLimits: true, complianceRecords: true } },
      },
      orderBy: { code: "asc" },
    }),
    prisma.regulationAlert.findMany({
      orderBy: { fetchedAt: "desc" },
      include: { regulation: { select: { code: true } } },
    }),
  ]);

  const expiryAlerts = regulations
    .map((reg) => ({ reg, urgency: classifyExpiryUrgency(reg.expiresAt ?? null, today) }))
    .filter((a) => a.urgency !== null);

  const hasAlerts = expiryAlerts.length > 0 || newsAlerts.length > 0;

  return (
    <PageShell
      title="法規管理"
      description={`共 ${regulations.length} 條法規`}
      actions={
        <Link href="/regulations/new">
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            新增法規
          </Button>
        </Link>
      }
    >
      {hasAlerts && (
        <div className="mb-6 space-y-3">
          {expiryAlerts.map(({ reg, urgency }) => (
            <div
              key={reg.id}
              className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
                urgency === "danger"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-yellow-200 bg-yellow-50 text-yellow-800"
              }`}
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <span className="font-semibold">{reg.code}</span> 將於{" "}
                {formatDate(reg.expiresAt)}{" "}
                到期，請確認是否有更新版本。
              </span>
            </div>
          ))}

          {newsAlerts.length > 0 && (
            <div className="rounded-lg border bg-muted/30 px-4 py-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Newspaper className="h-3.5 w-3.5" />
                法規動態（每日更新）· {newsAlerts.length} 則
              </div>
              <ul className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                {newsAlerts.map((alert) => (
                  <li key={alert.id} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      {alert.regulation.code}
                    </span>
                    <a
                      href={alert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:underline"
                    >
                      {alert.title}
                      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">法規代碼</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">名稱</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">地區</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">生效日期</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">文件數</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">物質限值</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">合規紀錄</th>
            </tr>
          </thead>
          <tbody>
            {regulations.map((reg: (typeof regulations)[number]) => (
              <tr key={reg.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/regulations/${reg.id}`} className="font-medium text-primary hover:underline">
                    {reg.code}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{reg.name}</div>
                  {reg.nameEn && <div className="text-xs text-muted-foreground">{reg.nameEn}</div>}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{regionLabel(reg.region)}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(reg.effectiveAt)}</td>
                <td className="px-4 py-3 text-center">{reg._count.documents}</td>
                <td className="px-4 py-3 text-center">{reg._count.substanceLimits}</td>
                <td className="px-4 py-3 text-center">{reg._count.complianceRecords}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {regulations.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            尚無法規資料，請點擊「新增法規」新增
          </div>
        )}
      </div>
    </PageShell>
  );
}
