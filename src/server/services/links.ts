import { Prisma } from "@prisma/client";
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

  // Race-safe: rely on the (fromId, toId, relation) unique constraint instead
  // of a separate findUnique check. If the create succeeds, the link is new
  // and we log activity. If P2002 fires, the link already exists and we just
  // update its note. This prevents duplicate activity entries when two
  // concurrent requests create the same link.
  try {
    const link = await prisma.link.create({
      data: {
        fromId: params.fromId,
        toId: params.toId,
        relation: params.relation,
        note: params.note ?? undefined,
        createdById: params.actorId,
      },
    });
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
    return link;
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return prisma.link.update({
        where: {
          fromId_toId_relation: {
            fromId: params.fromId,
            toId: params.toId,
            relation: params.relation,
          },
        },
        data: { note: params.note ?? undefined },
      });
    }
    throw err;
  }
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
