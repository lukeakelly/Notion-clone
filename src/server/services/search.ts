import { prisma } from "@/server/db";

export async function search(query: string, limit = 40) {
  const q = query.trim();
  if (!q) return [];

  return prisma.record.findMany({
    where: {
      archivedAt: null,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { summary: { contains: q, mode: "insensitive" } },
        { bodyMd: { contains: q, mode: "insensitive" } },
        { tags: { some: { tag: { name: { contains: q.toLowerCase() } } } } },
      ],
    },
    orderBy: [{ updatedAt: "desc" }],
    take: limit,
    include: {
      owner: true,
      tags: { include: { tag: true } },
    },
  });
}
