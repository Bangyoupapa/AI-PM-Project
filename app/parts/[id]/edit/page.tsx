import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/layout/PageShell";
import { ComponentForm } from "@/components/parts/ComponentForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPartPage({ params }: Props) {
  const { id } = await params;
  const component = await prisma.component.findUnique({
    where: { id },
    include: { supplier: { select: { name: true } } },
  });
  if (!component) notFound();

  return (
    <PageShell title={`編輯 ${component.partNumber}`}>
      <ComponentForm
        componentId={id}
        defaultValues={{
          partNumber: component.partNumber,
          name: component.name,
          nameEn: component.nameEn ?? undefined,
          category: component.category,
          supplierName: component.supplier?.name ?? undefined,
          material: component.material ?? undefined,
          description: component.description ?? undefined,
          unitOfMeasure: component.unitOfMeasure ?? undefined,
        }}
      />
    </PageShell>
  );
}
