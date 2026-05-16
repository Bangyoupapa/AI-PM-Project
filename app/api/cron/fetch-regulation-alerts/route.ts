import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 60;

const KEEP_PER_REGULATION = 3;

export async function GET(req: NextRequest) {
  // Verify Vercel Cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "TAVILY_API_KEY not set" }, { status: 500 });

  const regulations = await prisma.regulation.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true },
  });

  let fetched = 0;

  for (const reg of regulations) {
    try {
      const query = `${reg.code} ${reg.name} regulation update 2024 2025`;
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: "basic",
          max_results: KEEP_PER_REGULATION,
          include_answer: false,
        }),
      });

      if (!res.ok) continue;
      const data = await res.json() as { results: { title: string; url: string; published_date?: string }[] };
      const results = data.results ?? [];

      // Replace existing alerts for this regulation
      await prisma.$transaction([
        prisma.regulationAlert.deleteMany({ where: { regulationId: reg.id } }),
        prisma.regulationAlert.createMany({
          data: results.slice(0, KEEP_PER_REGULATION).map((r) => ({
            regulationId: reg.id,
            title: r.title,
            url: r.url,
            publishedAt: r.published_date ? new Date(r.published_date) : null,
          })),
        }),
      ]);

      fetched += results.length;
    } catch (err) {
      console.error(`[cron/fetch-regulation-alerts] ${reg.code}`, err);
    }
  }

  return NextResponse.json({ ok: true, fetched });
}
