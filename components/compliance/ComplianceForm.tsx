"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { upsertComplianceSchema, type UpsertComplianceInput } from "@/lib/validations/compliance.schema";
import { COMPLIANCE_STATUS_LABELS } from "@/config";

interface ComplianceFormProps {
  componentId: string;
  regulationId: string;
  componentName: string;
  regulationCode: string;
  defaultValues?: Partial<UpsertComplianceInput>;
  onSuccess: (record: unknown) => void;
  onCancel: () => void;
}

export function ComplianceForm({
  componentId,
  regulationId,
  componentName,
  regulationCode,
  defaultValues,
  onSuccess,
  onCancel,
}: ComplianceFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpsertComplianceInput>({
    resolver: zodResolver(upsertComplianceSchema),
    defaultValues: {
      componentId,
      regulationId,
      status: "PENDING",
      ...defaultValues,
    },
  });

  async function onSubmit(data: UpsertComplianceInput) {
    try {
      const res = await fetch("/api/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "操作失敗");
      }
      const record = await res.json();
      toast.success("合規紀錄已儲存");
      onSuccess(record);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失敗");
    }
  }

  const statusOptions = Object.entries(COMPLIANCE_STATUS_LABELS);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm">
        <span className="font-medium font-mono">{componentName}</span>
        <span className="text-muted-foreground mx-2">×</span>
        <span className="font-medium">{regulationCode}</span>
      </div>

      <input type="hidden" {...register("componentId")} />
      <input type="hidden" {...register("regulationId")} />

      <div className="space-y-1.5">
        <Label>合規狀態 *</Label>
        <Select
          defaultValue={defaultValues?.status ?? "PENDING"}
          onValueChange={(v) => setValue("status", v as UpsertComplianceInput["status"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="testDate">測試日期</Label>
          <Input id="testDate" type="date" {...register("testDate")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expiryDate">合規到期日</Label>
          <Input id="expiryDate" type="date" {...register("expiryDate")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="testLab">測試機構</Label>
          <Input id="testLab" placeholder="e.g. SGS, Bureau Veritas" {...register("testLab")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reportNumber">測試報告編號</Label>
          <Input id="reportNumber" placeholder="e.g. SGS-2024-001" className="font-mono" {...register("reportNumber")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="testedBy">負責人</Label>
        <Input id="testedBy" placeholder="姓名" {...register("testedBy")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">備註</Label>
        <Textarea id="notes" rows={2} {...register("notes")} />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "儲存中…" : "儲存"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>取消</Button>
      </div>
    </form>
  );
}
