import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateRegulationSchema } from "@/lib/validations/regulation.schema";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const regulation = await prisma.regulation.findUnique({
      where: { id },
      include: {
        documents: { orderBy: { uploadedAt: "desc" } },
        substanceLimits: { orderBy: { substanceName: "asc" } },
        _count: { select: { complianceRecords: true } },
      },
    });
    if (!regulation) {
      return NextResponse.json({ error: "找不到此法規" }, { status: 404 });
    }
    return NextResponse.json(regulation);
  } catch (error) {
    console.error("[GET /api/regulations/:id]", error);
    return NextResponse.json({ error: "無法取得法規資料" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateRegulationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { issuedAt, effectiveAt, expiresAt, ...rest } = parsed.data;
    const regulation = await prisma.regulation.update({
      where: { id },
      data: {
        ...rest,
        ...(issuedAt !== undefined ? { issuedAt: issuedAt ? new Date(issuedAt) : null } : {}),
        ...(effectiveAt !== undefined ? { effectiveAt: effectiveAt ? new Date(effectiveAt) : null } : {}),
        ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}),
      },
    });
    return NextResponse.json(regulation);
  } catch (error) {
    console.error("[PUT /api/regulations/:id]", error);
    return NextResponse.json({ error: "更新法規失敗" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.regulation.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/regulations/:id]", error);
    return NextResponse.json({ error: "刪除法規失敗" }, { status: 500 });
  }
}
