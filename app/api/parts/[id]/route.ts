import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateComponentSchema } from "@/lib/validations/component.schema";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const component = await prisma.component.findUnique({
      where: { id },
      include: {
        supplier: true,
        complianceRecords: {
          include: { regulation: { select: { id: true, code: true, name: true } } },
          orderBy: { regulation: { code: "asc" } },
        },
      },
    });
    if (!component) return NextResponse.json({ error: "找不到此料件" }, { status: 404 });
    return NextResponse.json(component);
  } catch (error) {
    console.error("[GET /api/parts/:id]", error);
    return NextResponse.json({ error: "無法取得料件資料" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateComponentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { supplierName, ...rest } = parsed.data;

    let supplierId: string | null | undefined;
    if (supplierName !== undefined) {
      if (supplierName?.trim()) {
        const supplier = await prisma.supplier.upsert({
          where: { name: supplierName.trim() },
          create: { name: supplierName.trim() },
          update: {},
        });
        supplierId = supplier.id;
      } else {
        supplierId = null;
      }
    }

    const component = await prisma.component.update({
      where: { id },
      data: { ...rest, ...(supplierId !== undefined ? { supplierId } : {}) },
      include: { supplier: { select: { name: true } } },
    });
    return NextResponse.json(component);
  } catch (error) {
    console.error("[PUT /api/parts/:id]", error);
    return NextResponse.json({ error: "更新料件失敗" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.component.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/parts/:id]", error);
    return NextResponse.json({ error: "刪除料件失敗" }, { status: 500 });
  }
}
