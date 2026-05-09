"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ComplianceForm } from "./ComplianceForm";
import { cn, statusLabel, statusColor, categoryLabel } from "@/lib/utils";
import { toast } from "sonner";

type ComplianceStatus = "PASS" | "FAIL" | "PENDING" | "NOT_APPLICABLE" | "EXPIRED";
type ComponentCategory = "CELL" | "BMS" | "HOUSING" | "CONNECTOR" | "ELECTROLYTE" | "SEPARATOR" | "ANODE" | "CATHODE" | "OTHER";

interface Regulation {
  id: string;
  code: string;
  name: string;
}

interface ComplianceRecord {
  id: string;
  componentId: string;
  regulationId: string;
  status: ComplianceStatus;
  testDate: string | null;
  expiryDate: string | null;
  testLab: string | null;
  reportNumber: string | null;
  notes: string | null;
  testedBy: string | null;
  isAiSuggested: boolean;
  aiReasoning: string | null;
}

interface Component {
  id: string;
  partNumber: string;
  name: string;
  category: ComponentCategory;
}

interface ComplianceMatrixProps {
  components: Component[];
  regulations: Regulation[];
  initialRecords: ComplianceRecord[];
}

interface CellSelection {
  componentId: string;
  regulationId: string;
  componentName: string;
  regulationCode: string;
  existing?: ComplianceRecord;
}

export function ComplianceMatrix({ components, regulations, initialRecords }: ComplianceMatrixProps) {
  const [records, setRecords] = useState<ComplianceRecord[]>(initialRecords);
  const [selected, setSelected] = useState<CellSelection | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const lookup = new Map(records.map((r) => [`${r.componentId}:${r.regulationId}`, r]));

  function handleCellClick(comp: Component, reg: Regulation) {
    const existing = lookup.get(`${comp.id}:${reg.id}`);
    setSelected({
      componentId: comp.id,
      regulationId: reg.id,
      componentName: `${comp.partNumber} ${comp.name}`,
      regulationCode: reg.code,
      existing,
    });
  }

  async function handleConfirmAi(record: ComplianceRecord) {
    setConfirmingId(record.id);
    try {
      const res = await fetch(`/api/compliance/${record.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAiSuggested: false }),
      });
      if (!res.ok) throw new Error("確認失敗");
      const updated = await res.json() as ComplianceRecord;
      setRecords((prev) => prev.map((r) => r.id === updated.id ? updated : r));
      toast.success("已確認 AI 建議");
      setSelected(null);
    } catch {
      toast.error("確認失敗，請稍後再試");
    } finally {
      setConfirmingId(null);
    }
  }

  function handleSuccess(record: unknown) {
    const r = record as ComplianceRecord;
    setRecords((prev) => {
      const idx = prev.findIndex((x) => x.componentId === r.componentId && x.regulationId === r.regulationId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = r;
        return next;
      }
      return [...prev, r];
    });
    setSelected(null);
  }

  return (
    <>
      <div className="overflow-auto rounded-lg border">
        <table className="w-full text-xs">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="sticky left-0 z-10 min-w-[180px] bg-muted/50 px-3 py-2.5 text-left font-medium text-muted-foreground">
                料件
              </th>
              {regulations.map((reg) => (
                <th key={reg.id} className="min-w-[90px] px-2 py-2.5 text-center font-medium text-muted-foreground">
                  <div title={reg.name}>{reg.code}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {components.map((comp) => (
              <tr key={comp.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="sticky left-0 z-10 bg-background px-3 py-2 border-r">
                  <div className="font-medium font-mono leading-tight">{comp.partNumber}</div>
                  <div className="text-muted-foreground truncate max-w-[160px]">{comp.name}</div>
                  <div className="text-muted-foreground/70 mt-0.5">{categoryLabel(comp.category)}</div>
                </td>
                {regulations.map((reg) => {
                  const record = lookup.get(`${comp.id}:${reg.id}`);
                  return (
                    <td
                      key={reg.id}
                      className="px-2 py-2 text-center cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => handleCellClick(comp, reg)}
                      title={record
                        ? `${statusLabel(record.status)}${record.isAiSuggested ? "（AI 建議）" : ""}${record.testDate ? ` — 測試日期：${record.testDate}` : ""}`
                        : "點擊新增"}
                    >
                      {record ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={cn("rounded px-1.5 py-0.5 font-medium", statusColor(record.status))}>
                            {statusLabel(record.status)}
                          </span>
                          {record.isAiSuggested && (
                            <span className="text-[10px] text-blue-500 font-medium">AI</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">＋</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {components.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            尚無料件資料，請先至「料件管理」新增
          </div>
        )}
      </div>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>合規紀錄</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="mt-4 space-y-4">
              {/* AI 建議區塊 */}
              {selected.existing?.isAiSuggested && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
                  <p className="text-xs font-semibold text-blue-700">🤖 AI 建議（待確認）</p>
                  <p className="text-xs text-blue-600">{selected.existing.aiReasoning}</p>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => selected.existing && handleConfirmAi(selected.existing)}
                      disabled={confirmingId === selected.existing?.id}
                    >
                      {confirmingId === selected.existing?.id ? "確認中…" : "✓ 採用此建議"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {/* keep sheet open for manual edit */}}
                    >
                      修改
                    </Button>
                  </div>
                </div>
              )}

              <ComplianceForm
                componentId={selected.componentId}
                regulationId={selected.regulationId}
                componentName={selected.componentName}
                regulationCode={selected.regulationCode}
                defaultValues={selected.existing ? {
                  status: selected.existing.status,
                  testDate: selected.existing.testDate ?? undefined,
                  expiryDate: selected.existing.expiryDate ?? undefined,
                  testLab: selected.existing.testLab ?? undefined,
                  reportNumber: selected.existing.reportNumber ?? undefined,
                  notes: selected.existing.notes ?? undefined,
                  testedBy: selected.existing.testedBy ?? undefined,
                } : undefined}
                onSuccess={handleSuccess}
                onCancel={() => setSelected(null)}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
