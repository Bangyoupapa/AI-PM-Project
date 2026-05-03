import { PageShell } from "@/components/layout/PageShell";
import { RegulationForm } from "@/components/regulations/RegulationForm";

export default function NewRegulationPage() {
  return (
    <PageShell title="新增法規">
      <RegulationForm />
    </PageShell>
  );
}
