import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { COMPONENT_CATEGORY_LABELS } from "@/config";

export const runtime = "nodejs";

export async function GET() {
  const categoryOptions = Object.values(COMPONENT_CATEGORY_LABELS).join(" / ");

  const headers = ["料號", "料件名稱", "英文名稱", "類別", "供應商名稱", "材質描述", "備註"];
  const example = ["BAT-001", "鋰離子電芯", "Lithium Ion Cell", "電芯", "Samsung SDI", "LiCoO2", "18650 規格"];
  const note = [`（必填）`, `（必填）`, `（選填）`, `（必填）${categoryOptions}`, `（選填）`, `（選填）`, `（選填）`];

  const ws = XLSX.utils.aoa_to_sheet([headers, note, example]);

  ws["!cols"] = [
    { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 30 },
    { wch: 20 }, { wch: 20 }, { wch: 20 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "料件匯入範本");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename*=UTF-8\'\'%E6%96%99%E4%BB%B6%E5%8C%AF%E5%85%A5%E7%AF%84%E6%9C%AC.xlsx',
    },
  });
}
