"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createComponentSchema, type CreateComponentInput } from "@/lib/validations/component.schema";
import { COMPONENT_CATEGORY_LABELS } from "@/config";

interface ComponentFormProps {
  defaultValues?: Partial<CreateComponentInput>;
  componentId?: string;
}

export function ComponentForm({ defaultValues, componentId }: ComponentFormProps) {
  const router = useRouter();
  const isEdit = Boolean(componentId);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateComponentInput>({
    resolver: zodResolver(createComponentSchema),
    defaultValues: { unitOfMeasure: "pcs", ...defaultValues },
  });

  async function onSubmit(data: CreateComponentInput) {
    try {
      const url = isEdit ? `/api/parts/${componentId}` : "/api/parts";
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
      toast.success(isEdit ? "料件已更新" : "料件已新增");
      router.push(`/parts/${result.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失敗");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="partNumber">料號 *</Label>
          <Input id="partNumber" placeholder="e.g. BAT-001" className="font-mono" {...register("partNumber")} />
          {errors.partNumber && <p className="text-xs text-destructive">{errors.partNumber.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>料件類別 *</Label>
          <Select
            defaultValue={defaultValues?.category}
            onValueChange={(v) => setValue("category", v as CreateComponentInput["category"])}
          >
            <SelectTrigger>
              <SelectValue placeholder="選擇類別" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(COMPONENT_CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">料件名稱（中文）*</Label>
        <Input id="name" placeholder="鋰離子電芯" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nameEn">料件名稱（英文）</Label>
        <Input id="nameEn" placeholder="Lithium Ion Cell" {...register("nameEn")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="supplierName">供應商名稱</Label>
          <Input id="supplierName" placeholder="Samsung SDI" {...register("supplierName")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="unitOfMeasure">計量單位</Label>
          <Input id="unitOfMeasure" placeholder="pcs" {...register("unitOfMeasure")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="material">材質描述</Label>
        <Input id="material" placeholder="LiCoO2 / NCM 811" {...register("material")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">備註</Label>
        <Textarea id="description" rows={3} {...register("description")} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "儲存中…" : isEdit ? "儲存變更" : "新增料件"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>取消</Button>
      </div>
    </form>
  );
}
