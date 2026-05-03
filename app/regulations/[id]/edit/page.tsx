import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/layout/PageShell";
import { RegulationForm } from "@/components/regulations/RegulationForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditRegulationPage({ params }: Props) {
  const { id } = await params;

  const regulation = await prisma.regulation.findUnique({ where: { id } });
  if (!regulation) notFound();

  const defaultValues = {
    code: regulation.code,
    name: regulation.name,
    nameEn: regulation.nameEn ?? undefined,
    region: regulation.region,
    version: regulation.version ?? undefined,
    issuedAt: regulation.issuedAt?.toISOString().split("T")[0] ?? undefined,
    effectiveAt: regulation.effectiveAt?.toISOString().split("T")[0] ?? undefined,
    expiresAt: regulation.expiresAt?.toISOString().split("T")[0] ?? undefined,
    description: regulation.description ?? undefined,
    isActive: regulation.isActive,
  };

  return (
    <PageShell title={`編輯 ${regulation.code}`}>
      <RegulationForm regulationId={id} defaultValues={defaultValues} />
    </PageShell>
  );
}
