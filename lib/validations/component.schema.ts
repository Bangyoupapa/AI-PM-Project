import { z } from "zod";

const CATEGORIES = ["CELL", "BMS", "HOUSING", "CONNECTOR", "ELECTROLYTE", "SEPARATOR", "ANODE", "CATHODE", "OTHER"] as const;

export const createComponentSchema = z.object({
  partNumber: z.string().min(1, "料號為必填"),
  name: z.string().min(1, "料件名稱為必填"),
  nameEn: z.string().optional(),
  category: z.enum(CATEGORIES, { error: "請選擇料件類別" }),
  supplierName: z.string().optional(),
  material: z.string().optional(),
  description: z.string().optional(),
  unitOfMeasure: z.string().optional(),
});

export const updateComponentSchema = createComponentSchema.partial();

export const importRowSchema = z.object({
  partNumber: z.string().min(1, "料號為必填"),
  name: z.string().min(1, "料件名稱為必填"),
  nameEn: z.string().optional(),
  category: z.enum(CATEGORIES, { error: "類別無效，請使用：電芯/BMS/外殼/接頭/電解液/隔離膜/負極/正極/其他" }),
  supplierName: z.string().optional(),
  material: z.string().optional(),
  description: z.string().optional(),
});

export type CreateComponentInput = z.infer<typeof createComponentSchema>;
export type UpdateComponentInput = z.infer<typeof updateComponentSchema>;
export type ImportRowInput = z.infer<typeof importRowSchema>;
