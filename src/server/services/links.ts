import { prisma } from "@/server/db";
import type { LinkRelation } from "@prisma/client";

export async function createLink(params: {
  fromId: string;
  toId: string;
  relation: LinkRelation;
  note?: string | null;
  actorId: string;
}) {
  if (params.fromId === params.toId) {
    throw new Error("Cannot link a record to itself");
  }
  const existing = await prisma.link.findUnique({
    where: {
      fromId_toId_relation: {
        fromId: params.fromId,
        toId: params.toId,
        relation: params.relation,
      },
    },
  });
  const link = await prisma.link.upsert({
    where: {
      fromId_toId_relation: {
        fromId: params.fromId,
        toId: params.toId,
        relation: params.relation,
      },
    },
    update: { note: params.note ?? undefined },
    create: {
      fromId: params.fromId,
      toId: params.toId,
      relation: params.relation,
      note: params.note ?? undefined,
      createdById: params.actorId,
    },
  });

  if (!existing) {
    await prisma.activity.createMany({
      data: [
        {
          recordId: params.fromId,
          actorId: params.actorId,
          verb: "linked",
          after: { toId: params.toId, relation: params.relation },
        },
        {
          recordId: params.toId,
          actorId: params.actorId,
          verb: "linked",
          after: { fromId: params.fromId, relation: params.relation },
        },
      ],
    });
  }

  return link;
}

export async function deleteLink(id: string, actorId: string) {
  const link = await prisma.link.findUnique({ where: { id } });
  if (!link) return null;
  try {
    await prisma.link.delete({ where: { id } });
  } catch {
    // Concurrent delete: another request already removed the link.
    return null;
  }
  await prisma.activity.createMany({
    data: [
      {
        recordId: link.fromId,
        actorId,
        verb: "unlinked",
        after: { toId: link.toId, relation: link.relation },
      },
      {
        recordId: link.toId,
        actorId,
        verb: "unlinked",
        after: { fromId: link.fromId, relation: link.relation },
      },
    ],
  });
  return link;
}
