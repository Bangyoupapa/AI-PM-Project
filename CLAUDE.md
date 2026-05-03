@AGENTS.md

# 手機電池合規管理系統 — 開發規範

## 專案概述

供研發、採購、QA 三個團隊使用的手機電池法規合規管理平台。功能包含法規文件庫、料件清單管理、合規狀態追蹤，以及 AI 自然語言查詢（RAG）。

## 技術堆疊

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Database**: PostgreSQL + pgvector（向量搜尋）
- **ORM**: Prisma
- **Styling**: TailwindCSS v4 + shadcn/ui
- **AI**: Vercel AI SDK（model-agnostic，支援 Anthropic/OpenAI）
- **File parsing**: pdf-parse（PDF）、xlsx（Excel）
- **Validation**: Zod + react-hook-form

## 開發規範

### TypeScript
- 所有函式、元件、資料結構必須有明確的型別定義
- 禁止使用 `any`，除非絕對必要並加上註解說明原因
- 開啟 TypeScript strict mode

### Next.js 15 模式
- 預設使用 Server Components
- 只有在需要 `useState`、`useEffect`、事件處理時才加 `"use client"`
- 使用 App Router 檔案結構（`app/` 目錄）
- API routes 使用 `app/api/` 下的 `route.ts`

### 元件開發
- 使用函式元件 + hooks
- 每個元件的 props 必須定義 TypeScript interface
- 使用 shadcn/ui 元件保持一致性
- 必須包含 loading state 和 error handling
- 使用 Tailwind breakpoints 實作 RWD
- 遵循 accessibility 最佳實踐（ARIA attributes）

### 樣式規範
- TailwindCSS v4：使用 `@import "tailwindcss"`，不用舊的 `@tailwind base/components/utilities`
- 主題設定使用 `@theme` directive（CSS-first 設定）
- 使用 shadcn/ui 元件：`Button`、`Card`、`Dialog`、`Table`、`Badge`、`Sheet` 等
- 語義化 HTML 元素

### 設定管理
- 所有設定值集中在 `/config.ts`
- 禁止在程式碼中 hardcode 設定值（API keys、URL、常數等）
- 環境變數透過 `.env.local` 管理

### 錯誤處理
- 所有 async 操作使用 `try-catch`
- API routes 回傳正確的 HTTP status codes
- 使用 Sonner toast 顯示用戶端錯誤訊息
- 記錄有意義的 error context（不只是 `console.error(e)`）

### 安全性
- 所有用戶輸入用 Zod schema 驗證
- 資料庫操作前先 sanitize 輸入
- 遵循 OWASP Top 10 安全指引
- 上傳的文件只透過 API route stream，不直接暴露在 `/public/`

### 效能
- 圖片使用 Next.js `<Image>` 元件
- 適當使用 Server Components 減少 client bundle
- API 查詢使用 `Promise.all()` 並行處理
- Prisma query 避免 N+1（使用 `include` 而非多次查詢）

## 專案結構

```
/
├── app/
│   ├── layout.tsx              # Root layout（Sidebar + 繁體中文）
│   ├── dashboard/              # 儀表板
│   ├── regulations/            # 法規管理
│   ├── parts/                  # 料件管理
│   ├── compliance/             # 合規狀態矩陣
│   ├── ai/                     # AI 查詢介面
│   └── api/                    # API routes
├── components/
│   ├── layout/                 # Sidebar, TopBar, PageShell
│   ├── ui/                     # shadcn/ui re-exports + 自訂元件
│   ├── dashboard/
│   ├── regulations/
│   ├── parts/
│   └── compliance/
├── lib/
│   ├── prisma.ts               # Prisma singleton
│   ├── ai.ts                   # LLM provider 統一出口
│   ├── utils.ts                # formatDate, statusLabel 等工具
│   ├── rag/
│   │   ├── indexDocument.ts    # PDF 解析 → chunking → embedding
│   │   └── search.ts           # pgvector 向量搜尋
│   └── validations/            # Zod schemas
├── config.ts                   # 所有設定值的統一出口
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── uploads/                    # 上傳的法規文件（在 /public 外）
    └── regulations/
```

## 資料庫

PostgreSQL + pgvector。啟用 vector extension：
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## 常見錯誤注意事項

- 不要用 `any` 型別
- 不要 hardcode 設定值
- 不要跳過 TypeScript strict mode
- 不要忘記 async 操作的錯誤處理
- 不要建立沒有 TypeScript interface 的元件
- Prisma client 必須使用 singleton pattern（見 `lib/prisma.ts`）
- 合規紀錄 upsert 必須處理 `@@unique([componentId, regulationId])` 衝突
- LLM API key 尚未決定時，用 `MOCK_AI=true` 讓 UI 先跑通
