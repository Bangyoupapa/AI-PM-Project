"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRegulationSchema, type CreateRegulationInput } from "@/lib/validations/regulation.schema";
import { REGULATION_REGION_LABELS } from "@/config";

interface RegulationFormProps {
  defaultValues?: Partial<CreateRegulationInput>;
  regulationId?: string;
}

export function RegulationForm({ defaultValues, regulationId }: RegulationFormProps) {
  const router = useRouter();
  const isEdit = Boolean(regulationId);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateRegulationInput>({
    resolver: zodResolver(createRegulationSchema),
    defaultValues: { region: "EU", isActive: true, ...defaultValues },
  });

  async function onSubmit(data: CreateRegulationInput) {
    try {
      const url = isEdit ? `/api/regulations/${regulationId}` : "/api/regulations";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "操作失敗");
      }
      const result = await res.json();
      toast.success(isEdit ? "法規已更新" : "法規已新增");
      router.push(`/regulations/${result.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失敗");
    }
  }

  const regions = Object.entries(REGULATION_REGION_LABELS);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="code">法規代碼 *</Label>
          <Input id="code" placeholder="e.g. RoHS" {...register("code")} />
          {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="version">版本</Label>
          <Input id="version" placeholder="e.g. 2011/65/EU" {...register("version")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">法規名稱（中文）*</Label>
        <Input id="name" placeholder="有害物質限制指令" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nameEn">法規名稱（英文）</Label>
        <Input id="nameEn" placeholder="Restriction of Hazardous Substances Directive" {...register("nameEn")} />
      </div>

      <div className="space-y-1.5">
        <Label>適用地區 *</Label>
        <Select
          defaultValue={defaultValues?.region ?? "EU"}
          onValueChange={(v) => setValue("region", v as CreateRegulationInput["region"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {regions.map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="issuedAt">發布日期</Label>
          <Input id="issuedAt" type="date" {...register("issuedAt")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="effectiveAt">生效日期</Label>
          <Input id="effectiveAt" type="date" {...register("effectiveAt")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expiresAt">到期日期</Label>
          <Input id="expiresAt" type="date" {...register("expiresAt")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">法規說明</Label>
        <Textarea id="description" rows={4} placeholder="描述此法規的主要要求…" {...register("description")} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "儲存中…" : isEdit ? "儲存變更" : "新增法規"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          取消
        </Button>
      </div>
    </form>
  );
}
