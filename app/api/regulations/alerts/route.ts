import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classifyExpiryUrgency } from "@/lib/alerts/classifyExpiry";

export const runtime = "nodejs";

export async function GET() {
  const today = new Date();

  const [regulations, newsAlerts] = await Promise.all([
    prisma.regulation.findMany({
      where: { isActive: true, expiresAt: { not: null } },
      select: { id: true, code: true, name: true, expiresAt: true },
    }),
    prisma.regulationAlert.findMany({
      orderBy: { fetchedAt: "desc" },
      include: { regulation: { select: { code: true, name: true } } },
    }),
  ]);

  const expiryAlerts = regulations
    .map((reg) => ({
      type: "expiry" as const,
      regulationId: reg.id,
      regulationCode: reg.code,
      regulationName: reg.name,
      urgency: classifyExpiryUrgency(reg.expiresAt, today),
      expiresAt: reg.expiresAt,
    }))
    .filter((a) => a.urgency !== null);

  const news = newsAlerts.map((a) => ({
    type: "news" as const,
    regulationId: a.regulationId,
    regulationCode: a.regulation.code,
    regulationName: a.regulation.name,
    title: a.title,
    url: a.url,
    publishedAt: a.publishedAt,
    fetchedAt: a.fetchedAt,
  }));

  return NextResponse.json({ expiryAlerts, news });
}
