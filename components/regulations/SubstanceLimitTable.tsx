"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

interface SubstanceLimit {
  id: string;
  substanceName: string;
  substanceCas: string | null;
  limitValue: number | null;
  limitUnit: string | null;
  notes: string | null;
}

interface SubstanceLimitTableProps {
  regulationId: string;
  initialLimits: SubstanceLimit[];
}

const EMPTY_LIMIT = { substanceName: "", substanceCas: "", limitValue: "", limitUnit: "ppm", notes: "" };

export function SubstanceLimitTable({ regulationId, initialLimits }: SubstanceLimitTableProps) {
  const [limits, setLimits] = useState<SubstanceLimit[]>(initialLimits);
  const [newRow, setNewRow] = useState(EMPTY_LIMIT);
  const [adding, setAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleAdd() {
    if (!newRow.substanceName.trim()) {
      toast.error("物質名稱為必填");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch(`/api/regulations/${regulationId}/substance-limits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newRow,
          limitValue: newRow.limitValue ? parseFloat(newRow.limitValue) : null,
        }),
      });
      if (!res.ok) throw new Error("新增失敗");
      const created = await res.json();
      setLimits((prev) => [...prev, created]);
      setNewRow(EMPTY_LIMIT);
      toast.success("物質限值已新增");
    } catch {
      toast.error("新增物質限值失敗");
    } finally {
      setAdding(false);
    }
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/regulations/${regulationId}/substance-limits/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("刪除失敗");
        setLimits((prev) => prev.filter((l) => l.id !== id));
        toast.success("已刪除");
      } catch {
        toast.error("刪除失敗");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">物質名稱</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">CAS No.</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">限值</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">單位</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">備註</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {limits.map((limit) => (
              <tr key={limit.id} className="border-b last:border-0">
                <td className="px-3 py-2 font-medium">{limit.substanceName}</td>
                <td className="px-3 py-2 text-muted-foreground font-mono text-xs">{limit.substanceCas ?? "—"}</td>
                <td className="px-3 py-2 text-right">{limit.limitValue ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{limit.limitUnit ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground text-xs">{limit.notes ?? "—"}</td>
                <td className="px-2 py-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(limit.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
            {limits.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-muted-foreground">尚無物質限值資料</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-5 gap-2 items-end">
        <Input placeholder="物質名稱 *" value={newRow.substanceName} onChange={(e) => setNewRow((p) => ({ ...p, substanceName: e.target.value }))} />
        <Input placeholder="CAS No." value={newRow.substanceCas} onChange={(e) => setNewRow((p) => ({ ...p, substanceCas: e.target.value }))} />
        <Input placeholder="限值" type="number" value={newRow.limitValue} onChange={(e) => setNewRow((p) => ({ ...p, limitValue: e.target.value }))} />
        <Input placeholder="單位 (ppm)" value={newRow.limitUnit} onChange={(e) => setNewRow((p) => ({ ...p, limitUnit: e.target.value }))} />
        <Button onClick={handleAdd} disabled={adding} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          新增
        </Button>
      </div>
    </div>
  );
}
