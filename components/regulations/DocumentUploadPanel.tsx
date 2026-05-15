"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Trash2, Download, Cpu } from "lucide-react";
import { formatDate, formatFileSize } from "@/lib/utils";

interface Document {
  id: string;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: string | Date;
  isIndexed: boolean;
}

interface DocumentUploadPanelProps {
  regulationId: string;
  initialDocuments: Document[];
}

export function DocumentUploadPanel({ regulationId, initialDocuments }: DocumentUploadPanelProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [uploading, setUploading] = useState(false);
  const [indexingId, setIndexingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/regulations/${regulationId}/documents`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "上傳失敗");
      }
      const doc = await res.json();
      setDocuments((prev) => [doc, ...prev]);
      toast.success("文件上傳成功，開始向量化…");
      // Auto-trigger indexing; runs in background while user sees "向量化中" state
      handleIndex(doc.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "上傳失敗");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleIndex(docId: string) {
    setIndexingId(docId);
    try {
      const res = await fetch(`/api/regulations/${regulationId}/documents/${docId}/index`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "向量化失敗");
      }
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, isIndexed: true } : d))
      );
      toast.success("向量化完成");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "向量化失敗");
    } finally {
      setIndexingId(null);
    }
  }

  function handleDelete(docId: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/regulations/${regulationId}/documents/${docId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("刪除失敗");
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        toast.success("文件已刪除");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "刪除失敗");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">共 {documents.length} 份文件</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="mr-1.5 h-4 w-4" />
          {uploading ? "上傳中…" : "上傳文件"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {documents.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-10 text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mb-2 h-8 w-8" />
          <p className="text-sm">點擊或拖曳上傳 PDF 文件</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{doc.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(doc.sizeBytes)} · {formatDate(doc.uploadedAt)}
                    {doc.isIndexed && <span className="ml-2 text-green-600">● 已向量化</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-3">
                {!doc.isIndexed && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => handleIndex(doc.id)}
                    disabled={indexingId === doc.id}
                  >
                    <Cpu className="mr-1 h-3 w-3" />
                    {indexingId === doc.id ? "向量化中…" : "向量化"}
                  </Button>
                )}
                <a href={`/api/regulations/${regulationId}/documents/${doc.id}`} download>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(doc.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
