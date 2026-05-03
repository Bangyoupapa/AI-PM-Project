import { PageShell } from "@/components/layout/PageShell";
import { ExcelImportWizard } from "@/components/parts/ExcelImport/ExcelImportWizard";

export default function ImportPartsPage() {
  return (
    <PageShell title="Excel 批次匯入料件">
      <ExcelImportWizard />
    </PageShell>
  );
}
