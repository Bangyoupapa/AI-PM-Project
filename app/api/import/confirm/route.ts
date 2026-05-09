import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const confirmSchema = z.object({
  fileName: z.string(),
  importedBy: z.string().optional(),
  rows: z.array(
    z.object({
      partNumber:   z.string(),
      name:         z.string(),
      nameEn:       z.string().optional(),
      category:     z.enum(["CELL", "BMS", "HOUSING", "CONNECTOR", "ELECTROLYTE", "SEPARATOR", "ANODE", "CATHODE", "OTHER"]),
      supplierName: z.string().optional(),
      material:     z.string().optional(),
      description:  z.string().optional(),
      leadPpm:      z.number().optional(),
      cadmiumPpm:   z.number().optional(),
      mercuryPpm:   z.number().optional(),
      chromiumPpm:  z.number().optional(),
      hasSvhc:      z.boolean().optional(),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = confirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { fileName, importedBy, rows } = parsed.data;
    let successRows = 0;
    const errors: { row: number; message: string }[] = [];
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

    for (let i = 0; i < rows.length; i++) {
      const { supplierName, ...rest } = rows[i];
      try {
        let supplierId: string | undefined;
        if (supplierName?.trim()) {
          const supplier = await prisma.supplier.upsert({
            where: { name: supplierName.trim() },
            create: { name: supplierName.trim() },
            update: {},
          });
          supplierId = supplier.id;
        }

        const component = await prisma.component.upsert({
          where: { partNumber: rest.partNumber },
          create: { ...rest, supplierId, importBatchId: log.id },
          update: { ...rest, supplierId },
        });
        importedComponentIds.push(component.id);
        successRows++;
      } catch (err) {
        errors.push({ row: i + 1, message: err instanceof Error ? err.message : "未知錯誤" });
      }
    }

    await prisma.componentImportLog.update({
      where: { id: log.id },
      data: { successRows, failedRows: errors.length, errors },
    });

    return NextResponse.json({
      success: true,
      successRows,
      failedRows: errors.length,
      errors,
      componentIds: importedComponentIds,  // 回傳給前端觸發 AI 分析
    });
  } catch (error) {
    console.error("[POST /api/import/confirm]", error);
    return NextResponse.json({ error: "匯入失敗" }, { status: 500 });
  }
}
