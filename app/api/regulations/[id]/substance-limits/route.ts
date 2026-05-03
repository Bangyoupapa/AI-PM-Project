import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const substanceLimitSchema = z.object({
  substanceName: z.string().min(1),
  substanceCas: z.string().optional().nullable(),
  limitValue: z.number().optional().nullable(),
  limitUnit: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: regulationId } = await params;
    const body = await req.json();
    const parsed = substanceLimitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const limit = await prisma.substanceLimit.create({
      data: { ...parsed.data, regulationId },
    });
    return NextResponse.json(limit, { status: 201 });
  } catch (error) {
    console.error("[POST /api/regulations/:id/substance-limits]", error);
    return NextResponse.json({ error: "新增物質限值失敗" }, { status: 500 });
  }
}
