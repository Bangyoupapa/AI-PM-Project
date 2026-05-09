import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { COMPONENT_CATEGORY_LABELS } from "@/config";

export const runtime = "nodejs";

export async function GET() {
  const categoryOptions = Object.values(COMPONENT_CATEGORY_LABELS).join(" / ");

  const headers = [
    "料號", "料件名稱", "英文名稱", "類別", "供應商名稱",
    "材質描述", "鉛含量(ppm)", "鎘含量(ppm)", "汞含量(ppm)", "六價鉻含量(ppm)", "含SVHC(是/否)", "備註",
  ];
  const note = [
    "（必填）", "（必填）", "（選填）",
    `（必填）${categoryOptions}`,
    "（選填）",
    "（選填）材質說明",
    "（選填）數字", "（選填）數字", "（選填）數字", "（選填）數字",
    "（選填）是 或 否",
    "（選填）",
  ];
  const example = [
    "CELL-001", "鋰離子電芯", "Lithium Ion Cell", "電芯", "Samsung SDI",
    "三元鋰 NMC", "50", "5", "2", "10", "否", "18650 規格",
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, note, example]);
  ws["!cols"] = [
    { wch: 18 }, { wch: 20 }, { wch: 25 }, { wch: 30 }, { wch: 18 },
    { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 20 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "料件匯入範本");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename*=UTF-8''%E6%96%99%E4%BB%B6%E5%8C%AF%E5%85%A5%E7%AF%84%E6%9C%AC.xlsx",
    },
  });
}
