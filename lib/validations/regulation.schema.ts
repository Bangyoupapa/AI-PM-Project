import { z } from "zod";

export const createRegulationSchema = z.object({
  code: z.string().min(1, "法規代碼為必填"),
  name: z.string().min(1, "法規名稱為必填"),
  nameEn: z.string().optional(),
  region: z.enum(["EU", "US", "JP", "CN", "TW", "GLOBAL", "OTHER"]),
  version: z.string().optional(),
  issuedAt: z.string().optional().nullable(),
  effectiveAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateRegulationSchema = createRegulationSchema.partial();

export type CreateRegulationInput = z.infer<typeof createRegulationSchema>;
export type UpdateRegulationInput = z.infer<typeof updateRegulationSchema>;
