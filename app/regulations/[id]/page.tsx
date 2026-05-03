import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentUploadPanel } from "@/components/regulations/DocumentUploadPanel";
import { SubstanceLimitTable } from "@/components/regulations/SubstanceLimitTable";
import { formatDate, regionLabel } from "@/lib/utils";
import { Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RegulationDetailPage({ params }: Props) {
  const { id } = await params;

  const regulation = await prisma.regulation.findUnique({
    where: { id },
    include: {
      documents: { orderBy: { uploadedAt: "desc" } },
      substanceLimits: { orderBy: { substanceName: "asc" } },
      _count: { select: { complianceRecords: true } },
    },
  });

  if (!regulation) notFound();

  return (
    <PageShell
      title={regulation.code}
      description={regulation.name}
      actions={
        <Link href={`/regulations/${id}/edit`}>
          <Button size="sm" variant="outline">
            <Pencil className="mr-1.5 h-4 w-4" />
            編輯
          </Button>
        </Link>
      }
    >
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">基本資料</TabsTrigger>
          <TabsTrigger value="substances">
            物質限值 ({regulation.substanceLimits.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            文件 ({regulation.documents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardContent className="pt-6 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">法規代碼</p>
                <p className="font-medium">{regulation.code}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">版本</p>
                <p>{regulation.version ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">中文名稱</p>
                <p className="font-medium">{regulation.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">英文名稱</p>
                <p>{regulation.nameEn ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">適用地區</p>
                <Badge variant="outline">{regionLabel(regulation.region)}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">合規紀錄數</p>
                <p>{regulation._count.complianceRecords}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">發布日期</p>
                <p>{formatDate(regulation.issuedAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">生效日期</p>
                <p>{formatDate(regulation.effectiveAt)}</p>
              </div>
              {regulation.expiresAt && (
                <div>
                  <p className="text-muted-foreground mb-1">到期日期</p>
                  <p>{formatDate(regulation.expiresAt)}</p>
                </div>
              )}
              {regulation.description && (
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-1">法規說明</p>
                  <p className="whitespace-pre-wrap">{regulation.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="substances">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">物質限值清單</CardTitle>
            </CardHeader>
            <CardContent>
              <SubstanceLimitTable
                regulationId={id}
                initialLimits={regulation.substanceLimits}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">法規文件</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentUploadPanel
                regulationId={id}
                initialDocuments={regulation.documents.map((d) => ({
                  ...d,
                  uploadedAt: d.uploadedAt.toISOString(),
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
