export const config = {
  app: {
    name: "電池合規管理系統",
    description: "手機電池法規合規管理平台",
  },
  upload: {
    maxSizeBytes: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      "application/pdf",
    ],
  },
  rag: {
    chunkSize: 500,
    chunkOverlap: 100,
    topK: 5,
    embeddingDimension: 1536,
    mockMode: process.env.MOCK_AI === "true",
  },
  pagination: {
    defaultPageSize: 20,
  },
} as const;

export { COMPONENT_CATEGORY_LABELS } from "@/lib/types";

export { COMPLIANCE_STATUS_LABELS, COMPLIANCE_STATUS_COLORS } from "@/lib/types";

export const REGULATION_REGION_LABELS: Record<string, string> = {
  EU: "歐盟",
  US: "美國",
  JP: "日本",
  CN: "中國",
  TW: "台灣",
  GLOBAL: "全球",
  OTHER: "其他",
};
