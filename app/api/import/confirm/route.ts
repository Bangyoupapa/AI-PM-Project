import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { importRowSchema } from "@/lib/validations/component.schema";
import { z } from "zod";

const confirmSchema = z.object({
  fileName: z.string(),
  importedBy: z.string().optional(),
  rows: z.array(importRowSchema),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = confirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { fileName, importedBy, rows } = parsed.data;
    const importedComponentIds: string[] = [];

    const log = await prisma.componentImportLog.create({
      data: {
        fileName,
        importedBy,
        totalRows: rows.length,
        successRows: 0,
        failedRows: 0,
      },
    });

    await prisma.$transaction(async (tx) => {
      for (const { supplierName, ...rest } of rows) {
        let supplierId: string | undefined;
        if (supplierName?.trim()) {
          const supplier = await tx.supplier.upsert({
            where: { name: supplierName.trim() },
            create: { name: supplierName.trim() },
            update: {},
          });
          supplierId = supplier.id;
        }

        const component = await tx.component.upsert({
          where: { partNumber: rest.partNumber },
          create: { ...rest, supplierId, importBatchId: log.id },
          update: { ...rest, supplierId },
        });
        importedComponentIds.push(component.id);
      }
    });

    await prisma.componentImportLog.update({
      where: { id: log.id },
      data: { successRows: rows.length, failedRows: 0 },
    });

    return NextResponse.json({
      success: true,
      successRows: rows.length,
      failedRows: 0,
      errors: [],
      componentIds: importedComponentIds,
    });
  } catch (error) {
    console.error("[POST /api/import/confirm]", error);
    return NextResponse.json({ error: "匯入失敗" }, { status: 500 });
  }
}
