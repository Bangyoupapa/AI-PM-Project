import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { upsertComplianceSchema } from "@/lib/validations/compliance.schema";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const componentId = searchParams.get("componentId");
    const regulationId = searchParams.get("regulationId");
    const status = searchParams.get("status");

    const records = await prisma.complianceRecord.findMany({
      where: {
        ...(componentId ? { componentId } : {}),
        ...(regulationId ? { regulationId } : {}),
        ...(status ? { status: status as never } : {}),
      },
      include: {
        component: { select: { id: true, partNumber: true, name: true, category: true } },
        regulation: { select: { id: true, code: true, name: true } },
      },
      orderBy: [{ regulation: { code: "asc" } }, { component: { partNumber: "asc" } }],
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("[GET /api/compliance]", error);
    return NextResponse.json({ error: "無法取得合規紀錄" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = upsertComplianceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { componentId, regulationId, testDate, expiryDate, ...rest } = parsed.data;
    const record = await prisma.complianceRecord.upsert({
      where: { componentId_regulationId: { componentId, regulationId } },
      create: {
        componentId,
        regulationId,
        ...rest,
        testDate: testDate ? new Date(testDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
      update: {
        ...rest,
        testDate: testDate ? new Date(testDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
      include: {
        component: { select: { partNumber: true, name: true } },
        regulation: { select: { code: true, name: true } },
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("[POST /api/compliance]", error);
    return NextResponse.json({ error: "新增/更新合規紀錄失敗" }, { status: 500 });
  }
}
