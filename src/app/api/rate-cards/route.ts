import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { auth } from "@/server/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json([], { status: 401 });
  }

  const rateCards = await prisma.rateCard.findMany({
    select: { id: true, name: true, currency: true, isDefault: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(rateCards);
}
