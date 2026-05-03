import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createComponentSchema } from "@/lib/validations/component.schema";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    const components = await prisma.component.findMany({
      where: {
        isActive: true,
        ...(category ? { category: category as never } : {}),
        ...(search
          ? {
              OR: [
                { partNumber: { contains: search, mode: "insensitive" } },
                { name: { contains: search, mode: "insensitive" } },
                { nameEn: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(status
          ? { complianceRecords: { some: { status: status as never } } }
          : {}),
      },
      include: {
        supplier: { select: { name: true } },
        _count: {
          select: {
            complianceRecords: true,
          },
        },
        complianceRecords: {
          select: { status: true },
        },
      },
      orderBy: { partNumber: "asc" },
    });

    return NextResponse.json(components);
  } catch (error) {
    console.error("[GET /api/parts]", error);
    return NextResponse.json({ error: "無法取得料件清單" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createComponentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { supplierName, ...rest } = parsed.data;

    let supplierId: string | undefined;
    if (supplierName?.trim()) {
      const supplier = await prisma.supplier.upsert({
        where: { name: supplierName.trim() },
        create: { name: supplierName.trim() },
        update: {},
      });
      supplierId = supplier.id;
    }

    const component = await prisma.component.create({
      data: { ...rest, supplierId },
      include: { supplier: { select: { name: true } } },
    });

    return NextResponse.json(component, { status: 201 });
  } catch (error) {
    console.error("[POST /api/parts]", error);
    return NextResponse.json({ error: "新增料件失敗" }, { status: 500 });
  }
}
