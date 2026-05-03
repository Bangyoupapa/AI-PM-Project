import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { upsertComplianceSchema } from "@/lib/validations/compliance.schema";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const record = await prisma.complianceRecord.findUnique({
      where: { id },
      include: {
        component: { select: { id: true, partNumber: true, name: true } },
        regulation: { select: { id: true, code: true, name: true } },
      },
    });
    if (!record) return NextResponse.json({ error: "找不到合規紀錄" }, { status: 404 });
    return NextResponse.json(record);
  } catch (error) {
    console.error("[GET /api/compliance/:id]", error);
    return NextResponse.json({ error: "無法取得合規紀錄" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = upsertComplianceSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { testDate, expiryDate, ...rest } = parsed.data;
    const record = await prisma.complianceRecord.update({
      where: { id },
      data: {
        ...rest,
        ...(testDate !== undefined ? { testDate: testDate ? new Date(testDate) : null } : {}),
        ...(expiryDate !== undefined ? { expiryDate: expiryDate ? new Date(expiryDate) : null } : {}),
      },
    });
    return NextResponse.json(record);
  } catch (error) {
    console.error("[PUT /api/compliance/:id]", error);
    return NextResponse.json({ error: "更新合規紀錄失敗" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.complianceRecord.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/compliance/:id]", error);
    return NextResponse.json({ error: "刪除合規紀錄失敗" }, { status: 500 });
  }
}
