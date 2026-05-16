import { PrismaClient, ComponentCategory, ComplianceStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const components = [
  { partNumber: "CELL-LG-M50T-001", name: "LG M50T 圓柱電芯 21700", nameEn: "LG M50T Cylindrical Cell 21700", category: ComponentCategory.CELL, material: "三元鋰 NMC（Ni:Mn:Co = 5:2:3）", supplier: "LG Energy Solution" },
  { partNumber: "CELL-CATL-NMC-002", name: "寧德時代 NMC 方形電芯", nameEn: "CATL NMC Prismatic Cell", category: ComponentCategory.CELL, material: "三元鋰 NMC 811（Ni 80% Mn 10% Co 10%）", supplier: "CATL" },
  { partNumber: "CELL-SDI-INR-003", name: "三星 INR21700-50E 電芯", nameEn: "Samsung INR21700-50E Cell", category: ComponentCategory.CELL, material: "三元鋰 NMC，鉛含量 < 50 ppm", supplier: "Samsung SDI" },
  { partNumber: "CELL-MUR-LFP-004", name: "磷酸鐵鋰方形電芯 60Ah", nameEn: "LFP Prismatic Cell 60Ah", category: ComponentCategory.CELL, material: "磷酸鐵鋰 LFP，無鈷無鎳", supplier: "MURATA" },
  { partNumber: "BMS-TI-BQ76952-001", name: "TI BQ76952 BMS 主控 IC", nameEn: "TI BQ76952 BMS Controller IC", category: ComponentCategory.BMS, material: "CMOS，鉛含量 820 ppm，鎘 < 10 ppm", supplier: "Texas Instruments" },
  { partNumber: "BMS-STM-L9963-002", name: "ST L9963 電池監控 IC", nameEn: "STM L9963 Battery Monitor IC", category: ComponentCategory.BMS, material: "CMOS，無鉛製程，Pb < 100 ppm", supplier: "STMicroelectronics" },
  { partNumber: "BMS-ASM-PACK-003", name: "12S BMS 保護板組件", nameEn: "12S BMS Protection Board Assembly", category: ComponentCategory.BMS, material: "FR4 PCB，焊錫含鉛 Pb 3500 ppm（超標）", supplier: "台灣BMS廠" },
  { partNumber: "HSG-AL-6061-001", name: "鋁合金電池外殼 6061-T6", nameEn: "Aluminum Alloy Battery Housing 6061-T6", category: ComponentCategory.HOUSING, material: "鋁合金 6061-T6，Pb < 200 ppm，Cd < 5 ppm", supplier: "台灣鋁業" },
  { partNumber: "HSG-SS-304-002", name: "不鏽鋼圓柱外殼 304", nameEn: "Stainless Steel Cylindrical Housing 304", category: ComponentCategory.HOUSING, material: "不鏽鋼 SUS304，無有害物質", supplier: "台灣金屬" },
  { partNumber: "CON-MHF-XT60-001", name: "XT60 大電流連接器", nameEn: "XT60 High Current Connector", category: ComponentCategory.CONNECTOR, material: "尼龍 PA66 + 鍍錫銅，Pb 950 ppm", supplier: "AMASS" },
  { partNumber: "CON-JST-PH2-002", name: "JST PH 2.0mm 平衡線連接器", nameEn: "JST PH 2.0mm Balance Connector", category: ComponentCategory.CONNECTOR, material: "PA66 + 銅合金，無鉛無鎘", supplier: "JST" },
  { partNumber: "CON-ATP-HV-003", name: "高壓 HV 互鎖連接器", nameEn: "HV Interlock Connector", category: ComponentCategory.CONNECTOR, material: "PBT + 鍍金銅，Pb < 300 ppm", supplier: "Aptiv" },
  { partNumber: "ELY-ENCHEM-001", name: "NMC 用碳酸鹽電解液", nameEn: "Carbonate Electrolyte for NMC", category: ComponentCategory.ELECTROLYTE, material: "LiPF6 / EC-DMC，SVHC 未檢出", supplier: "ENCHEM" },
  { partNumber: "ELY-CAPCHEM-002", name: "LFP 用電解液", nameEn: "Electrolyte for LFP", category: ComponentCategory.ELECTROLYTE, material: "LiPF6 / EC-EMC-DMC，SVHC 未檢出", supplier: "Capchem" },
  { partNumber: "SEP-SKI-WET-001", name: "SK Innovation 濕式隔離膜 16μm", nameEn: "SK Innovation Wet Process Separator 16μm", category: ComponentCategory.SEPARATOR, material: "聚乙烯 PE，不含 SVHC", supplier: "SK Innovation" },
  { partNumber: "SEP-TORAY-DRY-002", name: "Toray 乾式陶瓷塗布隔離膜", nameEn: "Toray Dry Process Ceramic Coated Separator", category: ComponentCategory.SEPARATOR, material: "PP + 氧化鋁陶瓷塗層", supplier: "Toray" },
  { partNumber: "AND-BTR-GR-001", name: "BTR 人造石墨負極材料", nameEn: "BTR Artificial Graphite Anode Material", category: ComponentCategory.ANODE, material: "人造石墨，Pb < 20 ppm，Cd < 5 ppm", supplier: "BTR New Material" },
  { partNumber: "CAT-UMICORE-NMC-001", name: "Umicore NMC 811 正極材料", nameEn: "Umicore NMC 811 Cathode Material", category: ComponentCategory.CATHODE, material: "LiNi0.8Mn0.1Co0.1O2，鈷含量 10%", supplier: "Umicore" },
  { partNumber: "CAT-SUMITOMO-LFP-002", name: "住友 LFP 正極材料", nameEn: "Sumitomo LFP Cathode Material", category: ComponentCategory.CATHODE, material: "LiFePO4，無鈷無鎳，Pb < 10 ppm", supplier: "Sumitomo Metal Mining" },
];

// 合規紀錄設計：PASS/FAIL/PENDING/NOT_APPLICABLE/EXPIRED
// 讓矩陣看起來豐富、有各種狀態
const complianceMatrix: Record<string, Record<string, {
  status: ComplianceStatus;
  testDate?: string;
  expiryDate?: string;
  testLab?: string;
  reportNumber?: string;
  notes?: string;
  testedBy?: string;
}>> = {
  "CELL-LG-M50T-001": {
    "RoHS":       { status: "PASS", testDate: "2024-03-15", expiryDate: "2026-03-14", testLab: "SGS Taiwan", reportNumber: "SGS-2024-RH-00123", testedBy: "王小明" },
    "UN38.3":     { status: "PASS", testDate: "2024-01-10", expiryDate: "2026-01-09", testLab: "UL Japan", reportNumber: "UL-2024-UN-05521", testedBy: "陳大偉" },
    "REACH":      { status: "PASS", testDate: "2024-03-15", expiryDate: "2026-03-14", testLab: "SGS Taiwan", reportNumber: "SGS-2024-RC-00123", testedBy: "王小明" },
    "EU-Battery": { status: "PASS", testDate: "2024-06-01", expiryDate: "2026-05-31", testLab: "TÜV Rheinland", reportNumber: "TUV-2024-EU-0891", testedBy: "李文華" },
    "IEC-62133":  { status: "PASS", testDate: "2024-02-20", expiryDate: "2026-02-19", testLab: "UL Japan", reportNumber: "UL-2024-IC-03312", testedBy: "陳大偉" },
    "CE":         { status: "PASS", testDate: "2024-06-01", expiryDate: "2026-05-31", testLab: "TÜV Rheinland", reportNumber: "TUV-2024-CE-0891", testedBy: "李文華" },
    "PSE":        { status: "PENDING", notes: "日本 PSE 認證申請中，預計 2025Q2 完成", testedBy: "張志豪" },
  },
  "CELL-CATL-NMC-002": {
    "RoHS":       { status: "PASS", testDate: "2024-05-10", expiryDate: "2026-05-09", testLab: "Intertek", reportNumber: "ITK-2024-RH-7712", testedBy: "王小明" },
    "UN38.3":     { status: "PASS", testDate: "2024-04-22", expiryDate: "2026-04-21", testLab: "CNAS 認證實驗室", reportNumber: "CNAS-2024-0445", testedBy: "陳大偉" },
    "REACH":      { status: "PASS", testDate: "2024-05-10", expiryDate: "2026-05-09", testLab: "Intertek", reportNumber: "ITK-2024-RC-7712", testedBy: "王小明" },
    "EU-Battery": { status: "PENDING", notes: "碳足跡計算文件準備中", testedBy: "李文華" },
    "IEC-62133":  { status: "PASS", testDate: "2024-03-05", expiryDate: "2026-03-04", testLab: "CNAS 認證實驗室", reportNumber: "CNAS-2024-0198", testedBy: "陳大偉" },
    "CE":         { status: "PASS", testDate: "2024-05-10", expiryDate: "2026-05-09", testLab: "Intertek", reportNumber: "ITK-2024-CE-7712", testedBy: "王小明" },
    "PSE":        { status: "NOT_APPLICABLE", notes: "此料件目前僅供歐洲市場，不需要 PSE 認證" },
  },
  "CELL-SDI-INR-003": {
    "RoHS":       { status: "PASS", testDate: "2023-11-20", expiryDate: "2025-11-19", testLab: "SGS Korea", reportNumber: "SGS-2023-RH-KR-881", testedBy: "王小明" },
    "UN38.3":     { status: "PASS", testDate: "2023-10-15", expiryDate: "2025-10-14", testLab: "UL Korea", reportNumber: "UL-2023-UN-KR-334", testedBy: "陳大偉" },
    "REACH":      { status: "PASS", testDate: "2023-11-20", expiryDate: "2025-11-19", testLab: "SGS Korea", reportNumber: "SGS-2023-RC-KR-881", testedBy: "王小明" },
    "EU-Battery": { status: "EXPIRED", testDate: "2022-12-01", expiryDate: "2024-11-30", notes: "認證已過期，需重新送測", testedBy: "李文華" },
    "IEC-62133":  { status: "PASS", testDate: "2023-09-08", expiryDate: "2025-09-07", testLab: "KTL Korea", reportNumber: "KTL-2023-IC-2210", testedBy: "陳大偉" },
    "CE":         { status: "PASS", testDate: "2023-11-20", expiryDate: "2025-11-19", testLab: "SGS Korea", reportNumber: "SGS-2023-CE-KR-881", testedBy: "王小明" },
    "PSE":        { status: "PASS", testDate: "2023-08-30", expiryDate: "2025-08-29", testLab: "JET Japan", reportNumber: "JET-2023-PSE-1102", testedBy: "張志豪" },
  },
  "CELL-MUR-LFP-004": {
    "RoHS":       { status: "PASS", testDate: "2024-08-01", expiryDate: "2026-07-31", testLab: "Bureau Veritas", reportNumber: "BV-2024-RH-5501", testedBy: "王小明" },
    "UN38.3":     { status: "PASS", testDate: "2024-07-15", expiryDate: "2026-07-14", testLab: "TÜV SÜD", reportNumber: "TUV-SUD-2024-3312", testedBy: "陳大偉" },
    "REACH":      { status: "PASS", testDate: "2024-08-01", expiryDate: "2026-07-31", testLab: "Bureau Veritas", reportNumber: "BV-2024-RC-5501", testedBy: "王小明" },
    "EU-Battery": { status: "PASS", testDate: "2024-08-01", expiryDate: "2026-07-31", testLab: "TÜV Rheinland", reportNumber: "TUV-2024-EU-5501", testedBy: "李文華" },
    "IEC-62133":  { status: "PASS", testDate: "2024-06-20", expiryDate: "2026-06-19", testLab: "TÜV SÜD", reportNumber: "TUV-SUD-2024-2890", testedBy: "陳大偉" },
    "CE":         { status: "PASS", testDate: "2024-08-01", expiryDate: "2026-07-31", testLab: "Bureau Veritas", reportNumber: "BV-2024-CE-5501", testedBy: "王小明" },
    "PSE":        { status: "PENDING", notes: "PSE 申請文件審查中", testedBy: "張志豪" },
  },
  "BMS-TI-BQ76952-001": {
    "RoHS":       { status: "PASS", testDate: "2024-01-08", expiryDate: "2026-01-07", testLab: "SGS Taiwan", reportNumber: "SGS-2024-RH-00045", testedBy: "王小明", notes: "鉛含量 820 ppm，符合 RoHS 豁免條款 6(c)" },
    "UN38.3":     { status: "NOT_APPLICABLE", notes: "IC 元件非電池，不適用 UN38.3" },
    "REACH":      { status: "PASS", testDate: "2024-01-08", expiryDate: "2026-01-07", testLab: "SGS Taiwan", reportNumber: "SGS-2024-RC-00045", testedBy: "王小明" },
    "EU-Battery": { status: "NOT_APPLICABLE", notes: "BMS IC 屬零件，不直接受 EU Battery Regulation 規範" },
    "IEC-62133":  { status: "NOT_APPLICABLE", notes: "IC 元件層級，系統層級認證適用" },
    "CE":         { status: "PASS", testDate: "2024-01-08", expiryDate: "2026-01-07", testLab: "SGS Taiwan", reportNumber: "SGS-2024-CE-00045", testedBy: "王小明" },
    "PSE":        { status: "NOT_APPLICABLE", notes: "IC 元件，不需 PSE 認證" },
  },
  "BMS-STM-L9963-002": {
    "RoHS":       { status: "PASS", testDate: "2024-04-12", expiryDate: "2026-04-11", testLab: "Intertek", reportNumber: "ITK-2024-RH-3301", testedBy: "王小明" },
    "UN38.3":     { status: "NOT_APPLICABLE", notes: "IC 元件，不適用" },
    "REACH":      { status: "PASS", testDate: "2024-04-12", expiryDate: "2026-04-11", testLab: "Intertek", reportNumber: "ITK-2024-RC-3301", testedBy: "王小明" },
    "EU-Battery": { status: "NOT_APPLICABLE", notes: "零件層級，不直接適用" },
    "IEC-62133":  { status: "NOT_APPLICABLE", notes: "IC 元件層級" },
    "CE":         { status: "PASS", testDate: "2024-04-12", expiryDate: "2026-04-11", testLab: "Intertek", reportNumber: "ITK-2024-CE-3301", testedBy: "王小明" },
    "PSE":        { status: "NOT_APPLICABLE", notes: "IC 元件，不需 PSE 認證" },
  },
  "BMS-ASM-PACK-003": {
    "RoHS":       { status: "FAIL", testDate: "2024-02-28", testLab: "SGS Taiwan", reportNumber: "SGS-2024-RH-00178", testedBy: "王小明", notes: "PCB 焊錫含鉛 Pb 3500 ppm，超出 RoHS 限值 1000 ppm，需改用無鉛製程" },
    "UN38.3":     { status: "NOT_APPLICABLE", notes: "BMS 保護板，不適用 UN38.3" },
    "REACH":      { status: "PENDING", notes: "SVHC 物質確認中，等候供應商提供 SDS", testedBy: "王小明" },
    "EU-Battery": { status: "NOT_APPLICABLE", notes: "零件層級" },
    "IEC-62133":  { status: "NOT_APPLICABLE", notes: "系統層級認證，零件層級不適用" },
    "CE":         { status: "FAIL", testDate: "2024-02-28", testLab: "SGS Taiwan", reportNumber: "SGS-2024-CE-00178", testedBy: "王小明", notes: "因 RoHS 不合格，CE 認證暫緩" },
    "PSE":        { status: "NOT_APPLICABLE", notes: "不需 PSE 認證" },
  },
  "HSG-AL-6061-001": {
    "RoHS":       { status: "PASS", testDate: "2024-03-20", expiryDate: "2026-03-19", testLab: "SGS Taiwan", reportNumber: "SGS-2024-RH-00201", testedBy: "王小明" },
    "UN38.3":     { status: "NOT_APPLICABLE", notes: "結構件，不適用" },
    "REACH":      { status: "PASS", testDate: "2024-03-20", expiryDate: "2026-03-19", testLab: "SGS Taiwan", reportNumber: "SGS-2024-RC-00201", testedBy: "王小明" },
    "EU-Battery": { status: "NOT_APPLICABLE", notes: "外殼結構件，不直接適用" },
    "IEC-62133":  { status: "NOT_APPLICABLE", notes: "結構件，不適用" },
    "CE":         { status: "PASS", testDate: "2024-03-20", expiryDate: "2026-03-19", testLab: "SGS Taiwan", reportNumber: "SGS-2024-CE-00201", testedBy: "王小明" },
    "PSE":        { status: "NOT_APPLICABLE", notes: "結構件，不需 PSE" },
  },
  "HSG-SS-304-002": {
    "RoHS":       { status: "PASS", testDate: "2024-05-05", expiryDate: "2026-05-04", testLab: "Bureau Veritas", reportNumber: "BV-2024-RH-3320", testedBy: "王小明" },
    "UN38.3":     { status: "NOT_APPLICABLE", notes: "結構件，不適用" },
    "REACH":      { status: "PASS", testDate: "2024-05-05", expiryDate: "2026-05-04", testLab: "Bureau Veritas", reportNumber: "BV-2024-RC-3320", testedBy: "王小明" },
    "EU-Battery": { status: "NOT_APPLICABLE", notes: "結構件，不適用" },
    "IEC-62133":  { status: "NOT_APPLICABLE", notes: "結構件，不適用" },
    "CE":         { status: "PASS", testDate: "2024-05-05", expiryDate: "2026-05-04", testLab: "Bureau Veritas", reportNumber: "BV-2024-CE-3320", testedBy: "王小明" },
    "PSE":        { status: "NOT_APPLICABLE", notes: "結構件，不需 PSE" },
  },
  "CON-MHF-XT60-001": {
    "RoHS":       { status: "PASS", testDate: "2024-02-10", expiryDate: "2026-02-09", testLab: "SGS Taiwan", reportNumber: "SGS-2024-RH-00089", testedBy: "王小明", notes: "Pb 950 ppm，低於 1000 ppm 限值" },
    "UN38.3":     { status: "NOT_APPLICABLE", notes: "連接器，不適用" },
    "REACH":      { status: "PASS", testDate: "2024-02-10", expiryDate: "2026-02-09", testLab: "SGS Taiwan", reportNumber: "SGS-2024-RC-00089", testedBy: "王小明" },
    "EU-Battery": { status: "NOT_APPLICABLE", notes: "連接器零件，不適用" },
    "IEC-62133":  { status: "NOT_APPLICABLE", notes: "連接器，不適用" },
    "CE":         { status: "PASS", testDate: "2024-02-10", expiryDate: "2026-02-09", testLab: "SGS Taiwan", reportNumber: "SGS-2024-CE-00089", testedBy: "王小明" },
    "PSE":        { status: "NOT_APPLICABLE", notes: "連接器，不需 PSE" },
  },
  "CON-JST-PH2-002": {
    "RoHS":       { status: "PASS", testDate: "2024-06-15", expiryDate: "2026-06-14", testLab: "Intertek", reportNumber: "ITK-2024-RH-5512", testedBy: "王小明" },
    "UN38.3":     { status: "NOT_APPLICABLE", notes: "連接器，不適用" },
    "REACH":      { status: "PASS", testDate: "2024-06-15", expiryDate: "2026-06-14", testLab: "Intertek", reportNumber: "ITK-2024-RC-5512", testedBy: "王小明" },
    "EU-Battery": { status: "NOT_APPLICABLE", notes: "連接器零件，不適用" },
    "IEC-62133":  { status: "NOT_APPLICABLE", notes: "連接器，不適用" },
    "CE":         { status: "PASS", testDate: "2024-06-15", expiryDate: "2026-06-14", testLab: "Intertek", reportNumber: "ITK-2024-CE-5512", testedBy: "王小明" },
    "PSE":        { status: "NOT_APPLICABLE", notes: "連接器，不需 PSE" },
  },
  "CON-ATP-HV-003": {
    "RoHS":       { status: "PASS", testDate: "2024-07-01", expiryDate: "2026-06-30", testLab: "TÜV Rheinland", reportNumber: "TUV-2024-RH-7801", testedBy: "王小明" },
    "UN38.3":     { status: "NOT_APPLICABLE", notes: "連接器，不適用" },
    "REACH":      { status: "PENDING", notes: "SVHC 篩查進行中，預計本季完成", testedBy: "王小明" },
    "EU-Battery": { status: "NOT_APPLICABLE", notes: "連接器零件，不適用" },
    "IEC-62133":  { status: "NOT_APPLICABLE", notes: "連接器，不適用" },
    "CE":         { status: "PASS", testDate: "2024-07-01", expiryDate: "2026-06-30", testLab: "TÜV Rheinland", reportNumber: "TUV-2024-CE-7801", testedBy: "王小明" },
    "PSE":        { status: "NOT_APPLICABLE", notes: "連接器，不需 PSE" },
  },
  "ELY-ENCHEM-001": {
    "RoHS":       { status: "NOT_APPLICABLE", notes: "電解液為化學品，不屬於 RoHS 管轄範疇" },
    "UN38.3":     { status: "PASS", testDate: "2024-04-05", expiryDate: "2026-04-04", testLab: "TÜV SÜD", reportNumber: "TUV-SUD-2024-EL-001", testedBy: "陳大偉" },
    "REACH":      { status: "PASS", testDate: "2024-04-05", expiryDate: "2026-04-04", testLab: "SGS Taiwan", reportNumber: "SGS-2024-RC-EL-001", testedBy: "王小明", notes: "SVHC 未檢出，SDS 文件完備" },
    "EU-Battery": { status: "PASS", testDate: "2024-04-05", expiryDate: "2026-04-04", testLab: "TÜV Rheinland", reportNumber: "TUV-2024-EU-EL-001", testedBy: "李文華" },
    "IEC-62133":  { status: "NOT_APPLICABLE", notes: "電解液材料，系統層級適用" },
    "CE":         { status: "NOT_APPLICABLE", notes: "電解液原料，不直接標示 CE" },
    "PSE":        { status: "NOT_APPLICABLE", notes: "電解液原料，不需 PSE" },
  },
  "ELY-CAPCHEM-002": {
    "RoHS":       { status: "NOT_APPLICABLE", notes: "電解液為化學品，不屬於 RoHS 管轄範疇" },
    "UN38.3":     { status: "PASS", testDate: "2024-05-20", expiryDate: "2026-05-19", testLab: "CNAS 認證實驗室", reportNumber: "CNAS-2024-EL-0220", testedBy: "陳大偉" },
    "REACH":      { status: "PASS", testDate: "2024-05-20", expiryDate: "2026-05-19", testLab: "Intertek", reportNumber: "ITK-2024-RC-EL-0220", testedBy: "王小明" },
    "EU-Battery": { status: "PENDING", notes: "等候供應商提供電池護照所需材料聲明", testedBy: "李文華" },
    "IEC-62133":  { status: "NOT_APPLICABLE", notes: "材料層級，不適用" },
    "CE":         { status: "NOT_APPLICABLE", notes: "電解液原料，不直接標示 CE" },
    "PSE":        { status: "NOT_APPLICABLE", notes: "電解液原料，不需 PSE" },
  },
  "SEP-SKI-WET-001": {
    "RoHS":       { status: "PASS", testDate: "2024-03-01", expiryDate: "2026-02-28", testLab: "KTL Korea", reportNumber: "KTL-2024-RH-0330", testedBy: "王小明" },
    "UN38.3":     { status: "NOT_APPLICABLE", notes: "隔離膜材料，不適用" },
    "REACH":      { status: "PASS", testDate: "2024-03-01", expiryDate: "2026-02-28", testLab: "SGS Korea", reportNumber: "SGS-2024-RC-KR-0330", testedBy: "王小明" },
    "EU-Battery": { status: "PASS", testDate: "2024-03-01", expiryDate: "2026-02-28", testLab: "TÜV Rheinland", reportNumber: "TUV-2024-EU-SEP-001", testedBy: "李文華" },
    "IEC-62133":  { status: "NOT_APPLICABLE", notes: "材料層級，不適用" },
    "CE":         { status: "PASS", testDate: "2024-03-01", expiryDate: "2026-02-28", testLab: "KTL Korea", reportNumber: "KTL-2024-CE-0330", testedBy: "王小明" },
    "PSE":        { status: "NOT_APPLICABLE", notes: "材料，不需 PSE" },
  },
  "SEP-TORAY-DRY-002": {
    "RoHS":       { status: "PASS", testDate: "2024-09-10", expiryDate: "2026-09-09", testLab: "Bureau Veritas Japan", reportNumber: "BVJ-2024-RH-1102", testedBy: "王小明" },
    "UN38.3":     { status: "NOT_APPLICABLE", notes: "材料，不適用" },
    "REACH":      { status: "PASS", testDate: "2024-09-10", expiryDate: "2026-09-09", testLab: "Bureau Veritas Japan", reportNumber: "BVJ-2024-RC-1102", testedBy: "王小明" },
    "EU-Battery": { status: "PASS", testDate: "2024-09-10", expiryDate: "2026-09-09", testLab: "TÜV Rheinland", reportNumber: "TUV-2024-EU-SEP-002", testedBy: "李文華" },
    "IEC-62133":  { status: "NOT_APPLICABLE", notes: "材料層級，不適用" },
    "CE":         { status: "PASS", testDate: "2024-09-10", expiryDate: "2026-09-09", testLab: "Bureau Veritas Japan", reportNumber: "BVJ-2024-CE-1102", testedBy: "王小明" },
    "PSE":        { status: "NOT_APPLICABLE", notes: "材料，不需 PSE" },
  },
  "AND-BTR-GR-001": {
    "RoHS":       { status: "PASS", testDate: "2024-07-20", expiryDate: "2026-07-19", testLab: "SGS China", reportNumber: "SGS-2024-CN-RH-8801", testedBy: "王小明" },
    "UN38.3":     { status: "NOT_APPLICABLE", notes: "負極材料，系統層級適用" },
    "REACH":      { status: "PASS", testDate: "2024-07-20", expiryDate: "2026-07-19", testLab: "SGS China", reportNumber: "SGS-2024-CN-RC-8801", testedBy: "王小明" },
    "EU-Battery": { status: "PENDING", notes: "再生材料含量申報文件準備中", testedBy: "李文華" },
    "IEC-62133":  { status: "NOT_APPLICABLE", notes: "材料層級，不適用" },
    "CE":         { status: "PASS", testDate: "2024-07-20", expiryDate: "2026-07-19", testLab: "SGS China", reportNumber: "SGS-2024-CN-CE-8801", testedBy: "王小明" },
    "PSE":        { status: "NOT_APPLICABLE", notes: "材料，不需 PSE" },
  },
  "CAT-UMICORE-NMC-001": {
    "RoHS":       { status: "PASS", testDate: "2024-08-15", expiryDate: "2026-08-14", testLab: "TÜV Rheinland", reportNumber: "TUV-2024-RH-CAT-001", testedBy: "王小明" },
    "UN38.3":     { status: "NOT_APPLICABLE", notes: "正極材料，系統層級適用" },
    "REACH":      { status: "PASS", testDate: "2024-08-15", expiryDate: "2026-08-14", testLab: "TÜV Rheinland", reportNumber: "TUV-2024-RC-CAT-001", testedBy: "王小明", notes: "鈷 SVHC 豁免確認，含量未超 0.1%wt 門檻" },
    "EU-Battery": { status: "PASS", testDate: "2024-08-15", expiryDate: "2026-08-14", testLab: "TÜV Rheinland", reportNumber: "TUV-2024-EU-CAT-001", testedBy: "李文華" },
    "IEC-62133":  { status: "NOT_APPLICABLE", notes: "材料層級，不適用" },
    "CE":         { status: "PASS", testDate: "2024-08-15", expiryDate: "2026-08-14", testLab: "TÜV Rheinland", reportNumber: "TUV-2024-CE-CAT-001", testedBy: "王小明" },
    "PSE":        { status: "NOT_APPLICABLE", notes: "材料，不需 PSE" },
  },
  "CAT-SUMITOMO-LFP-002": {
    "RoHS":       { status: "PASS", testDate: "2024-10-01", expiryDate: "2026-09-30", testLab: "Bureau Veritas Japan", reportNumber: "BVJ-2024-RH-CAT-002", testedBy: "王小明" },
    "UN38.3":     { status: "NOT_APPLICABLE", notes: "正極材料，不適用" },
    "REACH":      { status: "PASS", testDate: "2024-10-01", expiryDate: "2026-09-30", testLab: "Bureau Veritas Japan", reportNumber: "BVJ-2024-RC-CAT-002", testedBy: "王小明" },
    "EU-Battery": { status: "PASS", testDate: "2024-10-01", expiryDate: "2026-09-30", testLab: "TÜV Rheinland", reportNumber: "TUV-2024-EU-CAT-002", testedBy: "李文華" },
    "IEC-62133":  { status: "NOT_APPLICABLE", notes: "材料層級，不適用" },
    "CE":         { status: "PASS", testDate: "2024-10-01", expiryDate: "2026-09-30", testLab: "Bureau Veritas Japan", reportNumber: "BVJ-2024-CE-CAT-002", testedBy: "王小明" },
    "PSE":        { status: "NOT_APPLICABLE", notes: "材料，不需 PSE" },
  },
};

async function main() {
  console.log("🌱 Seeding demo components & compliance records...\n");

  // 1. Upsert 所有料件
  const componentIds: Record<string, string> = {};
  for (const comp of components) {
    const { supplier, ...data } = comp;
    const record = await prisma.component.upsert({
      where: { partNumber: data.partNumber },
      update: { ...data },
      create: { ...data },
    });
    componentIds[data.partNumber] = record.id;
    console.log(`  ✓ 料件：${data.partNumber}`);
  }

  // 2. 取得所有法規 ID
  const regulations = await prisma.regulation.findMany({ select: { id: true, code: true } });
  const regulationIds: Record<string, string> = {};
  for (const reg of regulations) {
    regulationIds[reg.code] = reg.id;
  }

  console.log(`\n  找到 ${regulations.length} 筆法規：${regulations.map(r => r.code).join(", ")}\n`);

  // 3. Upsert 合規紀錄
  let complianceCount = 0;
  for (const [partNumber, regMap] of Object.entries(complianceMatrix)) {
    const componentId = componentIds[partNumber];
    if (!componentId) continue;

    for (const [regCode, data] of Object.entries(regMap)) {
      const regulationId = regulationIds[regCode];
      if (!regulationId) continue;

      await prisma.complianceRecord.upsert({
        where: { componentId_regulationId: { componentId, regulationId } },
        update: {
          status: data.status,
          testDate: data.testDate ? new Date(data.testDate) : null,
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
          testLab: data.testLab ?? null,
          reportNumber: data.reportNumber ?? null,
          notes: data.notes ?? null,
          testedBy: data.testedBy ?? null,
        },
        create: {
          componentId,
          regulationId,
          status: data.status,
          testDate: data.testDate ? new Date(data.testDate) : null,
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
          testLab: data.testLab ?? null,
          reportNumber: data.reportNumber ?? null,
          notes: data.notes ?? null,
          testedBy: data.testedBy ?? null,
        },
      });
      complianceCount++;
    }
  }

  console.log(`✅ 完成！`);
  console.log(`   料件：${components.length} 筆`);
  console.log(`   合規紀錄：${complianceCount} 筆`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
