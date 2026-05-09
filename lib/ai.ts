import { createOpenAI } from "@ai-sdk/openai";

export const MOCK_MODE = process.env.MOCK_AI === "true";

// Real OpenAI provider — only instantiated when not in mock mode
export function getModel() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY 未設定");
  const openai = createOpenAI({ apiKey });
  return openai("gpt-4o-mini");
}

export const SYSTEM_PROMPT = `你是一位專業的電池法規合規查詢助理，服務對象為研發、採購、QA 工程師。
你的回答必須：
1. 以繁體中文回答
2. 根據提供的法規文件內容作答，並標明來源
3. 若文件中沒有相關資訊，明確說明「根據現有文件無法確認」
4. 回答要精確，包含具體數值（如 ppm、限值）
5. 格式清楚，使用條列或表格

你有以下法規資料：RoHS、UN38.3、REACH、EU Battery Regulation 2023。`;

export async function getMockResponse(prompt: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 800));

  if (prompt.toLowerCase().includes("rohs") || prompt.includes("鉛") || prompt.includes("汞")) {
    return `根據 **RoHS 2011/65/EU**（2025年整合版）：

**主要物質限值：**
| 物質 | 限值 |
|------|------|
| 鉛 (Pb) | 1000 ppm |
| 汞 (Hg) | 1000 ppm |
| 鎘 (Cd) | 100 ppm |
| 六價鉻 Cr(VI) | 1000 ppm |
| PBB / PBDE | 各 1000 ppm |
| DEHP / BBP / DBP / DIBP | 各 1000 ppm |

電池本身不受 RoHS 直接管轄，但電池組中的 PCB、連接器等零件須符合上述限值。

> 📄 資料來源：RoHS_2011-65-EU_consolidated_2025.pdf（已上傳）`;
  }

  if (prompt.includes("UN38.3") || prompt.includes("運輸") || prompt.includes("測試")) {
    return `根據 **UN38.3（第六修訂版）**，鋰電池運輸安全測試共 8 項：

1. **T.1** 高度模擬（11.6 kPa，6小時）
2. **T.2** 熱測試（-40°C 至 +75°C 循環）
3. **T.3** 振動測試
4. **T.4** 衝擊測試
5. **T.5** 外部短路（55°C，10分鐘）
6. **T.6** 撞擊測試
7. **T.7** 過充測試（鋰離子電池）
8. **T.8** 強制放電測試

> 📄 資料來源：UN38.3_6thEdition_Section38-3.pdf（已上傳）`;
  }

  return `我是電池合規查詢助理。您可以問我：

- **法規內容**：「RoHS 對鉛的限值是多少？」
- **測試要求**：「UN38.3 需要做哪些測試？」
- **合規範圍**：「REACH 對電池有哪些要求？」

系統目前載入了 4 份法規文件：RoHS、UN38.3、REACH、EU Battery Regulation。

> ⚠️ 目前為 Mock 模式，尚未連接 LLM API。`;
}
