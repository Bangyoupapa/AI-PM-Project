import { PrismaClient, RegulationRegion } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import path from "path";
import fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "regulations");

const PDF_FILES: Record<string, string> = {
  RoHS: "RoHS_2011-65-EU_consolidated_2025.pdf",
  "UN38.3": "UN38.3_6thEdition_Section38-3.pdf",
  REACH: "REACH_EC1907-2006.pdf",
  "EU-Battery": "EU_Battery_Regulation_2023-1542.pdf",
};

async function main() {
  console.log("Seeding regulations...");

  const regulations = [
    {
      code: "RoHS",
      name: "有害物質限制指令",
      nameEn: "Restriction of Hazardous Substances Directive 2011/65/EU",
      region: RegulationRegion.EU,
      version: "2011/65/EU (consolidated 2025)",
      effectiveAt: new Date("2011-07-21"),
      description:
        "限制電子電氣設備中特定有害物質的使用，涵蓋鉛、汞、鎘、六價鉻、PBB、PBDE 等物質。",
      substanceLimits: [
        { substanceName: "鉛 (Pb)", substanceCas: "7439-92-1", limitValue: 1000, limitUnit: "ppm" },
        { substanceName: "汞 (Hg)", substanceCas: "7439-97-6", limitValue: 1000, limitUnit: "ppm" },
        { substanceName: "鎘 (Cd)", substanceCas: "7440-43-9", limitValue: 100, limitUnit: "ppm" },
        { substanceName: "六價鉻 Cr(VI)", substanceCas: "18540-29-9", limitValue: 1000, limitUnit: "ppm" },
        { substanceName: "多溴聯苯 (PBB)", substanceCas: "59536-65-1", limitValue: 1000, limitUnit: "ppm" },
        { substanceName: "多溴二苯醚 (PBDE)", substanceCas: "32534-81-9", limitValue: 1000, limitUnit: "ppm" },
        { substanceName: "鄰苯二甲酸二(2-乙基己基)酯 (DEHP)", substanceCas: "117-81-7", limitValue: 1000, limitUnit: "ppm" },
        { substanceName: "鄰苯二甲酸苯甲酯丁酯 (BBP)", substanceCas: "85-68-7", limitValue: 1000, limitUnit: "ppm" },
        { substanceName: "鄰苯二甲酸二丁酯 (DBP)", substanceCas: "84-74-2", limitValue: 1000, limitUnit: "ppm" },
        { substanceName: "鄰苯二甲酸二異丁酯 (DIBP)", substanceCas: "84-69-5", limitValue: 1000, limitUnit: "ppm" },
      ],
    },
    {
      code: "UN38.3",
      name: "鋰電池運輸安全測試規範",
      nameEn: "UN Manual of Tests and Criteria — Section 38.3 Lithium Batteries",
      region: RegulationRegion.GLOBAL,
      version: "第六修訂版",
      description:
        "規範鋰電池（金屬及離子）作為危險品運輸時須通過的安全測試，包含高度模擬、熱測試、震動、衝擊、外部短路、過充、強制放電等 8 項測試。",
      substanceLimits: [],
    },
    {
      code: "IEC-62133",
      name: "攜帶式鋰電池安全要求",
      nameEn: "IEC 62133-2:2017 — Lithium Systems Safety Requirements",
      region: RegulationRegion.GLOBAL,
      version: "IEC 62133-2:2017",
      effectiveAt: new Date("2017-02-01"),
      description:
        "規範攜帶式密封式鋰電池及電池組的安全要求，包含電性安全測試（過充、短路、振動）及環境測試（溫度循環、跌落）。",
      substanceLimits: [],
    },
    {
      code: "REACH",
      name: "化學品注册、評估、授權及限制規例",
      nameEn: "Registration, Evaluation, Authorisation and Restriction of Chemicals (EC) No 1907/2006",
      region: RegulationRegion.EU,
      version: "(EC) No 1907/2006 (consolidated 2023-12)",
      effectiveAt: new Date("2007-06-01"),
      description:
        "管理化學物質的生產與使用，要求製造商和進口商識別並管理化學品的風險。SVHC 候選清單持續更新，需定期確認料件中是否含有高度關注物質。",
      substanceLimits: [
        { substanceName: "SVHC 候選清單物質（動態更新）", limitValue: 0.1, limitUnit: "%wt", notes: "物品中 SVHC 含量超過 0.1%wt 須通知下游用戶" },
      ],
    },
    {
      code: "EU-Battery",
      name: "歐盟電池與廢電池法規",
      nameEn: "EU Battery Regulation (EU) 2023/1542",
      region: RegulationRegion.EU,
      version: "(EU) 2023/1542",
      issuedAt: new Date("2023-07-28"),
      effectiveAt: new Date("2023-08-17"),
      description:
        "取代舊電池指令 2006/66/EC，涵蓋電池生命週期管理、碳足跡申報、再生材料含量要求、電池護照（Digital Product Passport）及電池廢棄回收規定。",
      substanceLimits: [
        { substanceName: "汞 (Hg)", substanceCas: "7439-97-6", limitValue: 0.0005, limitUnit: "%wt", notes: "攜帶式電池禁止添加" },
        { substanceName: "鎘 (Cd)", substanceCas: "7440-43-9", limitValue: 0.002, limitUnit: "%wt", notes: "攜帶式電池限值" },
        { substanceName: "鉛 (Pb)", substanceCas: "7439-92-1", limitValue: 0.004, limitUnit: "%wt", notes: "攜帶式電池限值" },
      ],
    },
    {
      code: "CE",
      name: "歐盟 CE 合規標誌",
      nameEn: "CE Marking — EU Market Access",
      region: RegulationRegion.EU,
      version: "2024",
      description:
        "電池相關產品進入歐盟市場需取得 CE 標誌，需符合低電壓指令（LVD）、電磁相容指令（EMC）及相關安全標準。",
      substanceLimits: [],
    },
    {
      code: "PSE",
      name: "日本電安法認證",
      nameEn: "Product Safety of Electrical Appliance & Materials (PSE)",
      region: RegulationRegion.JP,
      version: "2024",
      description:
        "日本《電氣用品安全法》要求攜帶式鋰電池必須取得 PSE 認證（菱形 PSE 標誌），測試標準參照 JIS C 8714。",
      substanceLimits: [],
    },
  ];

  for (const reg of regulations) {
    const { substanceLimits, ...regData } = reg;

    const regulation = await prisma.regulation.upsert({
      where: { code: regData.code },
      update: regData,
      create: regData,
    });

    if (substanceLimits.length > 0) {
      await prisma.substanceLimit.deleteMany({ where: { regulationId: regulation.id } });
      await prisma.substanceLimit.createMany({
        data: substanceLimits.map((s) => ({ ...s, regulationId: regulation.id })),
      });
    }

    // Link downloaded PDF if available
    const pdfFile = PDF_FILES[regData.code];
    if (pdfFile) {
      const filePath = path.join(UPLOADS_DIR, pdfFile);
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        const storagePath = path.join("uploads", "regulations", pdfFile);

        const existing = await prisma.regulationDocument.findFirst({
          where: { regulationId: regulation.id, fileName: pdfFile },
        });

        if (!existing) {
          await prisma.regulationDocument.create({
            data: {
              regulationId: regulation.id,
              fileName: pdfFile,
              storagePath,
              mimeType: "application/pdf",
              sizeBytes: stat.size,
              description: "官方法規文件",
            },
          });
          console.log(`  ✓ Linked PDF: ${pdfFile}`);
        }
      }
    }

    console.log(`  ✓ ${regData.code} — ${regData.name}`);
  }

  console.log("\nSeeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
