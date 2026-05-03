import { PageShell } from "@/components/layout/PageShell";
import { ChatInterface } from "@/components/ai/ChatInterface";

export default function AIPage() {
  return (
    <PageShell title="AI 法規查詢" description="自然語言查詢法規內容，由上傳的官方文件提供答案">
      <ChatInterface />
    </PageShell>
  );
}
