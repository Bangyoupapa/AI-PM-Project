"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, AlertCircle, Download, Loader2, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { COMPONENT_CATEGORY_LABELS } from "@/config";

interface PreviewRow {
  row: number;
  data?: {
    partNumber: string;
    name: string;
    nameEn?: string;
    category: string;
    supplierName?: string;
    material?: string;
    description?: string;
    leadPpm?: number;
    cadmiumPpm?: number;
    mercuryPpm?: number;
    chromiumPpm?: number;
    hasSvhc?: boolean;
  };
  error?: string;
}

interface PreviewResult {
  total: number;
  valid: PreviewRow[];
  invalid: PreviewRow[];
}

type Step = "upload" | "preview" | "analyzing" | "done";

export function ExcelImportWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<{ successRows: number; failedRows: number; analyzedCount?: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState<string>("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", f);
      const res = await fetch("/api/import", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error ?? "解析失敗");
      }
      const data = await res.json() as PreviewResult;
      setPreview(data);
      setStep("preview");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "解析失敗");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!preview || !file) return;
    setLoading(true);
    try {
      const rows = preview.valid.map((r) => r.data!);
      const res = await fetch("/api/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, rows }),
      });
      if (!res.ok) throw new Error("匯入失敗");
      const data = await res.json() as { successRows: number; failedRows: number; componentIds: string[] };

      toast.success(`成功匯入 ${data.successRows} 筆料件`);

      // 觸發 AI 批次分析
      if (data.componentIds?.length > 0) {
        setStep("analyzing");
        setLoading(false);
        setAnalyzeProgress(`正在分析 ${data.componentIds.length} 筆料件 × 所有法規…`);

        const analyzeRes = await fetch("/api/ai/analyze-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ componentIds: data.componentIds }),
        });
        const analyzeData = await analyzeRes.json() as { analyzed?: number };

        setResult({
          successRows: data.successRows,
          failedRows: data.failedRows,
          analyzedCount: analyzeData.analyzed,
        });
      } else {
        setResult({ successRows: data.successRows, failedRows: data.failedRows });
      }

      setStep("done");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "匯入失敗");
      setLoading(false);
    }
  }

  const categoryLabel = (cat: string) => COMPONENT_CATEGORY_LABELS[cat as import("@/lib/types").ComponentCategory] ?? cat;
  const steps: Step[] = ["upload", "preview", "analyzing", "done"];
  const stepLabels: Record<Step, string> = { upload: "上傳檔案", preview: "確認資料", analyzing: "AI 分析", done: "完成" };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
              step === s ? "bg-primary text-primary-foreground" :
              i < steps.indexOf(step) ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
            )}>
              {i + 1}
            </div>
            <span className={cn("hidden sm:inline", step === s ? "text-foreground font-medium" : "text-muted-foreground")}>
              {stepLabels[s]}
            </span>
            {i < steps.length - 1 && <div className="h-px w-8 bg-border" />}
          </div>
        ))}
      </div>

      {/* Step: Upload */}
      {step === "upload" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <a href="/api/import/template" download>
              <Button variant="outline" size="sm">
                <Download className="mr-1.5 h-4 w-4" />
                下載匯入範本
              </Button>
            </a>
          </div>
          <label className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 cursor-pointer transition-colors",
            "hover:border-primary/50 hover:bg-muted/30"
          )}>
            <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">點擊選擇 Excel 檔案</p>
            <p className="text-xs text-muted-foreground mt-1">支援 .xlsx 格式，請使用官方範本</p>
            <p className="text-xs text-blue-500 mt-2">📋 含物質含量欄位（鉛、鎘、汞、六價鉻）→ 匯入後自動 AI 分析</p>
            {loading && <p className="mt-3 text-sm text-primary">解析中…</p>}
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} disabled={loading} />
          </label>
        </div>
      )}

      {/* Step: Preview */}
      {step === "preview" && preview && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold">{preview.total}</div>
              <div className="text-xs text-muted-foreground mt-1">總筆數</div>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="text-2xl font-bold text-green-700">{preview.valid.length}</div>
              <div className="text-xs text-green-600 mt-1">可匯入</div>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="text-2xl font-bold text-red-700">{preview.invalid.length}</div>
              <div className="text-xs text-red-600 mt-1">有錯誤（不匯入）</div>
            </div>
          </div>

          {preview.invalid.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h3 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                以下列有錯誤，將跳過不匯入
              </h3>
              <ul className="space-y-1">
                {preview.invalid.map((r) => (
                  <li key={r.row} className="text-xs text-red-700">第 {r.row} 列：{r.error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-lg border overflow-auto max-h-80">
            <table className="w-full text-xs">
              <thead className="border-b bg-muted/50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">料號</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">名稱</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">類別</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">供應商</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">鉛(ppm)</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">SVHC</th>
                </tr>
              </thead>
              <tbody>
                {preview.valid.map((r) => (
                  <tr key={r.row} className="border-b last:border-0">
                    <td className="px-3 py-2 font-mono">{r.data!.partNumber}</td>
                    <td className="px-3 py-2">{r.data!.name}</td>
                    <td className="px-3 py-2">{categoryLabel(r.data!.category)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.data!.supplierName ?? "—"}</td>
                    <td className="px-3 py-2 text-center">{r.data!.leadPpm ?? "—"}</td>
                    <td className="px-3 py-2 text-center">
                      {r.data!.hasSvhc === true ? "是" : r.data!.hasSvhc === false ? "否" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700 flex items-center gap-2">
            <Bot className="h-4 w-4 shrink-0" />
            確認匯入後，AI 將自動分析每筆料件對所有法規的合規狀態，結果會顯示在合規矩陣供您確認。
          </div>

          <div className="flex gap-3">
            <Button onClick={handleConfirm} disabled={loading || preview.valid.length === 0}>
              {loading ? "匯入中…" : `確認匯入 ${preview.valid.length} 筆並啟動 AI 分析`}
            </Button>
            <Button variant="outline" onClick={() => { setStep("upload"); setPreview(null); setFile(null); }}>
              重新選擇
            </Button>
          </div>
        </div>
      )}

      {/* Step: Analyzing */}
      {step === "analyzing" && (
        <div className="flex flex-col items-center gap-6 py-16">
          <div className="flex items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <Bot className="h-10 w-10 text-blue-500" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">AI 合規分析中…</h2>
            <p className="text-sm text-muted-foreground mt-1">{analyzeProgress}</p>
            <p className="text-xs text-muted-foreground mt-2">正在對照法規物質限值，請稍候</p>
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === "done" && result && (
        <div className="flex flex-col items-center gap-6 py-12">
          <CheckCircle className="h-16 w-16 text-green-500" />
          <div className="text-center space-y-1">
            <h2 className="text-xl font-semibold">匯入完成</h2>
            <p className="text-muted-foreground">
              成功匯入 <span className="font-bold text-green-700">{result.successRows}</span> 筆料件
              {result.failedRows > 0 && <>，失敗 <span className="font-bold text-red-700">{result.failedRows}</span> 筆</>}
            </p>
            {result.analyzedCount != null && (
              <p className="text-sm text-blue-600 flex items-center justify-center gap-1">
                <Bot className="h-4 w-4" />
                AI 已產生 {result.analyzedCount} 筆合規建議，請至合規矩陣確認
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button onClick={() => router.push("/compliance")}>前往合規矩陣確認</Button>
            <Button variant="outline" onClick={() => router.push("/parts")}>料件清單</Button>
          </div>
        </div>
      )}
    </div>
  );
}
