import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { formatDate, regionLabel } from "@/lib/utils";
import { COMPLIANCE_STATUS_COLORS } from "@/config";

export const dynamic = "force-dynamic";

export default async function RegulationsPage() {
  const regulations = await prisma.regulation.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { documents: true, substanceLimits: true, complianceRecords: true } },
    },
    orderBy: { code: "asc" },
  });

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
