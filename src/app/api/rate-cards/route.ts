import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

export async function GET() {
  const rateCards = await prisma.rateCard.findMany({
    select: { id: true, name: true, currency: true, isDefault: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(rateCards);
}
