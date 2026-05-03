export const config = {
  app: {
    name: "電池合規管理系統",
    description: "手機電池法規合規管理平台",
  },
  upload: {
    maxSizeBytes: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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

export const COMPONENT_CATEGORY_LABELS: Record<string, string> = {
  CELL: "電芯",
  BMS: "電池管理系統",
  HOUSING: "外殼",
  CONNECTOR: "接頭",
  ELECTROLYTE: "電解液",
  SEPARATOR: "隔離膜",
  ANODE: "負極",
  CATHODE: "正極",
  OTHER: "其他",
};

export const COMPLIANCE_STATUS_LABELS: Record<string, string> = {
  PASS: "合格",
  FAIL: "不合格",
  PENDING: "待審查",
  NOT_APPLICABLE: "不適用",
  EXPIRED: "已過期",
};

export const COMPLIANCE_STATUS_COLORS: Record<string, string> = {
  PASS: "bg-green-100 text-green-800",
  FAIL: "bg-red-100 text-red-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  NOT_APPLICABLE: "bg-gray-100 text-gray-600",
  EXPIRED: "bg-orange-100 text-orange-800",
};

export const REGULATION_REGION_LABELS: Record<string, string> = {
  EU: "歐盟",
  US: "美國",
  JP: "日本",
  CN: "中國",
  TW: "台灣",
  GLOBAL: "全球",
  OTHER: "其他",
};
