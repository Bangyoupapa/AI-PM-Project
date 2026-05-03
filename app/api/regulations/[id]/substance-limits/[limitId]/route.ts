import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string; limitId: string }>;
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { limitId } = await params;
    await prisma.substanceLimit.delete({ where: { id: limitId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE substance-limit]", error);
    return NextResponse.json({ error: "刪除失敗" }, { status: 500 });
  }
}
