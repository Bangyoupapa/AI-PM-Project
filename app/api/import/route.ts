import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { importRowSchema } from "@/lib/validations/component.schema";
import { COMPONENT_CATEGORY_LABELS } from "@/config";

export const runtime = "nodejs";

const CATEGORY_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(COMPONENT_CATEGORY_LABELS).map(([k, v]) => [v, k])
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "未收到檔案" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { header: 1, defval: "" });

    if (rows.length < 3) {
      return NextResponse.json({ error: "檔案格式錯誤，請使用官方範本" }, { status: 400 });
    }

    const header = rows[0] as unknown as string[];
    const colIndex = {
      partNumber: header.indexOf("料號"),
      name: header.indexOf("料件名稱"),
      nameEn: header.indexOf("英文名稱"),
      category: header.indexOf("類別"),
      supplierName: header.indexOf("供應商名稱"),
      material: header.indexOf("材質描述"),
      description: header.indexOf("備註"),
    };

    if (colIndex.partNumber === -1 || colIndex.name === -1 || colIndex.category === -1) {
      return NextResponse.json({ error: "找不到必要欄位（料號、料件名稱、類別），請使用官方範本" }, { status: 400 });
    }

    const dataRows = rows.slice(2);
    const results: { row: number; data?: unknown; error?: string }[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i] as unknown as string[];
      if (row.every((cell) => !cell)) continue;

      const rawCategory = row[colIndex.category] ?? "";
      const category = CATEGORY_REVERSE[rawCategory] ?? rawCategory;

      const parsed = importRowSchema.safeParse({
        partNumber: row[colIndex.partNumber],
        name: row[colIndex.name],
        nameEn: row[colIndex.nameEn] || undefined,
        category,
        supplierName: row[colIndex.supplierName] || undefined,
        material: row[colIndex.material] || undefined,
        description: row[colIndex.description] || undefined,
      });

      if (parsed.success) {
        results.push({ row: i + 3, data: parsed.data });
      } else {
        const msgs = Object.values(parsed.error.flatten().fieldErrors).flat().join("; ");
        results.push({ row: i + 3, error: msgs });
      }
    }

    return NextResponse.json({
      total: results.length,
      valid: results.filter((r) => !r.error),
      invalid: results.filter((r) => r.error),
    });
  } catch (error) {
    console.error("[POST /api/import]", error);
    return NextResponse.json({ error: "解析 Excel 失敗" }, { status: 500 });
  }
}
