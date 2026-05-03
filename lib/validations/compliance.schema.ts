import { z } from "zod";

export const upsertComplianceSchema = z.object({
  componentId: z.string().min(1),
  regulationId: z.string().min(1),
  status: z.enum(["PASS", "FAIL", "PENDING", "NOT_APPLICABLE", "EXPIRED"]),
  testDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  testLab: z.string().optional().nullable(),
  reportNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  testedBy: z.string().optional().nullable(),
});

export type UpsertComplianceInput = z.infer<typeof upsertComplianceSchema>;
