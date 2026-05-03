import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRegulationSchema } from "@/lib/validations/regulation.schema";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const region = searchParams.get("region");
    const isActive = searchParams.get("isActive");

    const regulations = await prisma.regulation.findMany({
      where: {
        isActive: isActive === "false" ? false : true,
        ...(region ? { region: region as never } : {}),
        ...(search
          ? {
              OR: [
                { code: { contains: search, mode: "insensitive" } },
                { name: { contains: search, mode: "insensitive" } },
                { nameEn: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        _count: { select: { documents: true, substanceLimits: true, complianceRecords: true } },
      },
      orderBy: { code: "asc" },
    });

    return NextResponse.json(regulations);
  } catch (error) {
    console.error("[GET /api/regulations]", error);
    return NextResponse.json({ error: "無法取得法規清單" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createRegulationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { issuedAt, effectiveAt, expiresAt, ...rest } = parsed.data;
    const regulation = await prisma.regulation.create({
      data: {
        ...rest,
        issuedAt: issuedAt ? new Date(issuedAt) : null,
        effectiveAt: effectiveAt ? new Date(effectiveAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json(regulation, { status: 201 });
  } catch (error) {
    console.error("[POST /api/regulations]", error);
    return NextResponse.json({ error: "新增法規失敗" }, { status: 500 });
  }
}
