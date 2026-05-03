import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalComponents,
      totalRegulations,
      statusGroups,
      expiringSoon,
      recentRecords,
    ] = await Promise.all([
      prisma.component.count({ where: { isActive: true } }),
      prisma.regulation.count({ where: { isActive: true } }),
      prisma.complianceRecord.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.complianceRecord.findMany({
        where: { status: "PASS", expiryDate: { lte: thirtyDaysFromNow, gte: new Date() } },
        include: {
          component: { select: { partNumber: true, name: true } },
          regulation: { select: { code: true } },
        },
        orderBy: { expiryDate: "asc" },
        take: 5,
      }),
      prisma.complianceRecord.findMany({
        orderBy: { updatedAt: "desc" },
        take: 8,
        include: {
          component: { select: { partNumber: true, name: true } },
          regulation: { select: { code: true } },
        },
      }),
    ]);

    const statusCounts = Object.fromEntries(
      statusGroups.map((g) => [g.status, g._count._all])
    );

    const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    const passRate = total > 0 ? Math.round(((statusCounts.PASS ?? 0) / total) * 100) : 0;

    return NextResponse.json({
      totalComponents,
      totalRegulations,
      totalRecords: total,
      passRate,
      statusCounts,
      expiringSoon,
      recentRecords,
    });
  } catch (error) {
    console.error("[GET /api/dashboard]", error);
    return NextResponse.json({ error: "無法取得儀表板資料" }, { status: 500 });
  }
}
