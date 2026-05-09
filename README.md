# 手機電池合規管理系統

供研發、採購、QA 三個團隊使用的手機電池法規合規管理平台。

🌐 **線上展示**：https://ai-pm-project-topaz.vercel.app

---

## 功能總覽

| 模組 | 功能 |
|------|------|
| **法規管理** | 新增/編輯法規、上傳 PDF 文件、設定物質限值、觸發向量化（RAG） |
| **料件管理** | 手動新增或 Excel 批次匯入，含物質含量欄位（鉛/鎘/汞/六價鉻/SVHC） |
| **合規矩陣** | 料件 × 法規 pivot table，點格子新增/編輯合規紀錄 |
| **AI 自動分析** | 匯入 Excel 後自動呼叫 GPT 分析每筆料件對所有法規的合規狀態 |
| **AI 查詢（RAG）** | 自然語言詢問法規內容，回答附引用來源 |
| **儀表板** | 合規率統計、即將到期提醒 |

---

## 技術架構

- **Framework**：Next.js 15 (App Router, TypeScript)
- **Database**：PostgreSQL (Neon) + pgvector
- **ORM**：Prisma 7
- **Styling**：TailwindCSS v4 + shadcn/ui
- **AI**：Vercel AI SDK + OpenAI GPT-4o-mini
- **File Storage**：Vercel Blob（本機開發自動 fallback 至本地 `uploads/`）
- **Deployment**：Vercel

---

## 本機開發

### 1. 安裝套件

```bash
npm install
```

### 2. 設定環境變數

建立 `.env.local`：

```env
# 資料庫（可用 Neon 免費方案）
DATABASE_URL="postgresql://..."

# AI（GPT-4o-mini）
OPENAI_API_KEY="sk-..."
OPENAI_ORGANIZATION_ID=""   # 選填

# 本機開發不需要設定 BLOB，檔案會存在 uploads/ 資料夾
# BLOB_READ_WRITE_TOKEN=""

# Mock 模式（不用 API key 也能跑）
MOCK_AI=false
NEXT_PUBLIC_MOCK_AI=false
```

> 若沒有 API key，設 `MOCK_AI=true` / `NEXT_PUBLIC_MOCK_AI=true`，系統改用規則判斷，功能全部可用。

### 3. 初始化資料庫

```bash
npx prisma generate
npx prisma migrate deploy   # 套用所有 migration
npx prisma db seed          # 植入 7 條預設法規（RoHS / UN38.3 / IEC 62133 ...）
```

### 4. 啟動開發伺服器

```bash
npm run dev
```

開啟 http://localhost:3000

---

## Excel 匯入格式

下載範本：系統內「料件管理 → Excel 匯入 → 下載匯入範本」

| 欄位 | 必填 | 說明 |
|------|------|------|
| 料號 | ✅ | 唯一識別碼 |
| 料件名稱 | ✅ | |
| 英文名稱 | | |
| 類別 | ✅ | 電芯 / 電池管理系統 / 外殼 / 接頭 / 電解液 / 隔離膜 / 負極 / 正極 / 其他 |
| 供應商名稱 | | |
| 材質描述 | | |
| 鉛含量(ppm) | | 填入後自動 AI 分析 |
| 鎘含量(ppm) | | |
| 汞含量(ppm) | | |
| 六價鉻含量(ppm) | | |
| 含SVHC(是/否) | | |
| 備註 | | |

匯入後系統自動呼叫 AI 分析每筆料件 × 所有法規，結果顯示在合規矩陣（標記藍色 AI 標籤），工程師確認後即轉為正式紀錄。

---

## 環境變數說明

| 變數 | 用途 | 必填 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 連線字串 | ✅ |
| `OPENAI_API_KEY` | GPT API | AI 功能需要 |
| `OPENAI_ORGANIZATION_ID` | OpenAI 組織 ID | 選填 |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 上傳法規文件 | 選填（無則存本地） |
| `MOCK_AI` | `true` 啟用 mock 模式（server） | |
| `NEXT_PUBLIC_MOCK_AI` | `true` 啟用 mock 模式（client UI） | |

---

## 專案結構

```
app/
├── dashboard/          # 儀表板
├── regulations/        # 法規管理
├── parts/              # 料件管理（含 Excel 匯入）
├── compliance/         # 合規矩陣
├── ai/                 # AI 查詢介面
└── api/                # API routes
components/
├── compliance/         # ComplianceMatrix, ComplianceForm
├── regulations/        # DocumentUploadPanel, SubstanceLimitTable
└── parts/              # ComponentTable, ExcelImportWizard
lib/
├── ai.ts               # LLM provider 統一出口
├── rag/                # indexDocument + search
└── validations/        # Zod schemas
prisma/
├── schema.prisma
└── seed.ts             # 預設法規資料
```

---

## 預設法規

seed 後自動建立 7 條法規：

| 代號 | 名稱 | 地區 |
|------|------|------|
| RoHS | 限制有害物質指令 | EU |
| UN38.3 | 鋰電池運輸測試規範 | GLOBAL |
| IEC-62133 | 攜帶式鋰電池安全標準 | GLOBAL |
| CE | 歐盟 CE 認證 | EU |
| REACH | 化學物質登錄評估許可 | EU |
| PSE | 日本電器安全法 | JP |
| GB/T-31241 | 中國攜帶式電子產品鋰電池安全要求 | CN |
