import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { categoryLabel, statusLabel, statusColor, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PartDetailPage({ params }: Props) {
  const { id } = await params;

  const component = await prisma.component.findUnique({
    where: { id },
    include: {
      supplier: true,
      complianceRecords: {
        include: { regulation: { select: { id: true, code: true, name: true } } },
        orderBy: { regulation: { code: "asc" } },
      },
    },
  });

  if (!component) notFound();

  return (
    <PageShell
      title={component.partNumber}
      description={component.name}
      actions={
        <Link href={`/parts/${id}/edit`}>
          <Button size="sm" variant="outline">
            <Pencil className="mr-1.5 h-4 w-4" />
            編輯
          </Button>
        </Link>
      }
    >
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">料件資訊</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">料號</p>
              <p className="font-mono font-medium">{component.partNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">類別</p>
              <Badge variant="outline">{categoryLabel(component.category)}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">中文名稱</p>
              <p className="font-medium">{component.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">英文名稱</p>
              <p>{component.nameEn ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">供應商</p>
              <p>{component.supplier?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">材質</p>
              <p>{component.material ?? "—"}</p>
            </div>
            {component.description && (
              <div className="col-span-2">
                <p className="text-muted-foreground mb-1">備註</p>
                <p>{component.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">合規狀態</CardTitle>
            <Link href={`/compliance?componentId=${id}`}>
              <Button size="sm" variant="outline">新增/編輯合規紀錄</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {component.complianceRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground">尚無合規紀錄</p>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">法規</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">狀態</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">測試日期</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">到期日</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">報告編號</th>
                    </tr>
                  </thead>
                  <tbody>
                    {component.complianceRecords.map((record: (typeof component.complianceRecords)[number]) => (
                      <tr key={record.id} className="border-b last:border-0">
                        <td className="px-4 py-2">
                          <Link href={`/regulations/${record.regulation.id}`} className="font-medium text-primary hover:underline">
                            {record.regulation.code}
                          </Link>
                        </td>
                        <td className="px-4 py-2">
                          <span className={cn("rounded px-2 py-0.5 text-xs font-medium", statusColor(record.status))}>
                            {statusLabel(record.status)}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">{formatDate(record.testDate)}</td>
                        <td className="px-4 py-2 text-muted-foreground">{formatDate(record.expiryDate)}</td>
                        <td className="px-4 py-2 text-muted-foreground font-mono text-xs">{record.reportNumber ?? "—"}</td>
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
