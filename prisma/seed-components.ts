import { PrismaClient, ComponentCategory } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const components = [
  // 電芯
  { partNumber: "CELL-LG-M50T-001", name: "LG M50T 圓柱電芯 21700", nameEn: "LG M50T Cylindrical Cell 21700", category: ComponentCategory.CELL, material: "三元鋰 NMC", supplier: "LG Energy Solution" },
  { partNumber: "CELL-CATL-NMC-002", name: "寧德時代 NMC 方形電芯", nameEn: "CATL NMC Prismatic Cell", category: ComponentCategory.CELL, material: "三元鋰 NMC 811", supplier: "CATL" },
  { partNumber: "CELL-SDI-INR-003", name: "三星 INR21700-50E 電芯", nameEn: "Samsung INR21700-50E Cell", category: ComponentCategory.CELL, material: "三元鋰 NMC", supplier: "Samsung SDI" },
  { partNumber: "CELL-MUR-LFP-004", name: "磷酸鐵鋰方形電芯 60Ah", nameEn: "LFP Prismatic Cell 60Ah", category: ComponentCategory.CELL, material: "磷酸鐵鋰 LFP", supplier: "MURATA" },

  // 電池管理系統
  { partNumber: "BMS-TI-BQ76952-001", name: "TI BQ76952 BMS 主控 IC", nameEn: "TI BQ76952 BMS Controller IC", category: ComponentCategory.BMS, material: "CMOS", supplier: "Texas Instruments" },
  { partNumber: "BMS-STM-L9963-002", name: "ST L9963 電池監控 IC", nameEn: "STM L9963 Battery Monitor IC", category: ComponentCategory.BMS, material: "CMOS", supplier: "STMicroelectronics" },
  { partNumber: "BMS-ASM-PACK-003", name: "12S BMS 保護板組件", nameEn: "12S BMS Protection Board Assembly", category: ComponentCategory.BMS, material: "FR4 PCB + 元件", supplier: "台灣BMS廠" },

  // 外殼
  { partNumber: "HSG-AL-6061-001", name: "鋁合金電池外殼 6061-T6", nameEn: "Aluminum Alloy Battery Housing 6061-T6", category: ComponentCategory.HOUSING, material: "鋁合金 6061-T6", supplier: "台灣鋁業" },
  { partNumber: "HSG-SS-304-002", name: "不鏽鋼圓柱外殼 304", nameEn: "Stainless Steel Cylindrical Housing 304", category: ComponentCategory.HOUSING, material: "不鏽鋼 SUS304", supplier: "台灣金屬" },

  // 連接器
  { partNumber: "CON-MHF-XT60-001", name: "XT60 大電流連接器", nameEn: "XT60 High Current Connector", category: ComponentCategory.CONNECTOR, material: "尼龍 PA66 + 鍍錫銅", supplier: "AMASS" },
  { partNumber: "CON-JST-PH2-002", name: "JST PH 2.0mm 平衡線連接器", nameEn: "JST PH 2.0mm Balance Connector", category: ComponentCategory.CONNECTOR, material: "PA66 + 銅合金", supplier: "JST" },
  { partNumber: "CON-ATP-HV-003", name: "高壓 HV 互鎖連接器", nameEn: "HV Interlock Connector", category: ComponentCategory.CONNECTOR, material: "PBT + 鍍金銅", supplier: "Aptiv" },

  // 電解液
  { partNumber: "ELY-ENCHEM-001", name: "NMC 用碳酸鹽電解液", nameEn: "Carbonate Electrolyte for NMC", category: ComponentCategory.ELECTROLYTE, material: "LiPF6 / EC-DMC", supplier: "ENCHEM" },
  { partNumber: "ELY-CAPCHEM-002", name: "LFP 用電解液", nameEn: "Electrolyte for LFP", category: ComponentCategory.ELECTROLYTE, material: "LiPF6 / EC-EMC-DMC", supplier: "Capchem" },

  // 隔離膜
  { partNumber: "SEP-SKI-WET-001", name: "SK Innovation 濕式隔離膜 16μm", nameEn: "SK Innovation Wet Process Separator 16μm", category: ComponentCategory.SEPARATOR, material: "聚乙烯 PE", supplier: "SK Innovation" },
  { partNumber: "SEP-TORAY-DRY-002", name: "Toray 乾式陶瓷塗布隔離膜", nameEn: "Toray Dry Process Ceramic Coated Separator", category: ComponentCategory.SEPARATOR, material: "PP + 陶瓷塗層", supplier: "Toray" },

  // 負極
  { partNumber: "AND-BTR-GR-001", name: "BTR 人造石墨負極材料", nameEn: "BTR Artificial Graphite Anode Material", category: ComponentCategory.ANODE, material: "人造石墨", supplier: "BTR New Material" },

  // 正極
  { partNumber: "CAT-UMICORE-NMC-001", name: "Umicore NMC 811 正極材料", nameEn: "Umicore NMC 811 Cathode Material", category: ComponentCategory.CATHODE, material: "NMC 811", supplier: "Umicore" },
  { partNumber: "CAT-SUMITOMO-LFP-002", name: "住友 LFP 正極材料", nameEn: "Sumitomo LFP Cathode Material", category: ComponentCategory.CATHODE, material: "LiFePO4", supplier: "Sumitomo Metal Mining" },
];

async function main() {
  console.log("Seeding components...");

  for (const comp of components) {
    const { supplier, ...data } = comp;
    await prisma.component.upsert({
      where: { partNumber: data.partNumber },
      update: { ...data },
      create: { ...data },
    });
    console.log(`  ✓ ${data.partNumber} — ${data.name}`);
  }

  console.log(`\n✅ 完成！共 ${components.length} 筆料件測資。`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
