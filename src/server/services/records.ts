import { prisma } from "@/server/db";
import type { Prisma, RecordType } from "@prisma/client";
import { entityByType } from "@/lib/entities";

export interface CreateRecordInput {
  type: RecordType;
  title: string;
  summary?: string | null;
  bodyMd?: string | null;
  status?: string | null;
  phase?: Prisma.RecordCreateInput["phase"];
  priority?: Prisma.RecordCreateInput["priority"];
  confidence?: Prisma.RecordCreateInput["confidence"];
  ownerId?: string | null;
  data?: Record<string, unknown>;
  tags?: string[];
  actorId: string;
}

export async function createRecord(input: CreateRecordInput) {
  const entity = entityByType(input.type);
  const status = input.status ?? entity.defaultStatus;
  const tags = input.tags ?? [];

  const record = await prisma.$transaction(async (tx) => {
    const created = await tx.record.create({
      data: {
        type: input.type,
        title: input.title,
        summary: input.summary ?? null,
        bodyMd: input.bodyMd ?? null,
        status,
        phase: input.phase ?? null,
        priority: input.priority ?? null,
        confidence: input.confidence ?? null,
        ownerId: input.ownerId ?? null,
        data: (input.data ?? {}) as Prisma.InputJsonValue,
        createdById: input.actorId,
        updatedById: input.actorId,
        tags: {
          create: await createTagConnectors(tx, tags),
        },
      },
    });

    await tx.activity.create({
      data: {
        recordId: created.id,
        actorId: input.actorId,
        verb: "created",
        after: { title: created.title, status: created.status },
      },
    });
    return created;
  });

  return record;
}

async function createTagConnectors(
  tx: Prisma.TransactionClient,
  names: string[],
) {
  const connectors: Prisma.TagOnRecordCreateWithoutRecordInput[] = [];
  for (const name of names) {
    const normalised = name.trim().toLowerCase();
    if (!normalised) continue;
    const tag = await tx.tag.upsert({
      where: { name: normalised },
      update: {},
      create: { name: normalised },
    });
    connectors.push({ tag: { connect: { id: tag.id } } });
  }
  return connectors;
}

export interface UpdateRecordInput {
  id: string;
  actorId: string;
  title?: string;
  summary?: string | null;
  bodyMd?: string | null;
  status?: string | null;
  phase?: Prisma.RecordCreateInput["phase"] | null;
  priority?: Prisma.RecordCreateInput["priority"] | null;
  confidence?: Prisma.RecordCreateInput["confidence"] | null;
  ownerId?: string | null;
  data?: Record<string, unknown>;
  tags?: string[];
}

export async function updateRecord(input: UpdateRecordInput) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.record.findUnique({ where: { id: input.id } });
    if (!before) throw new Error("Record not found");

    const update: Prisma.RecordUpdateInput = {
      updatedBy: { connect: { id: input.actorId } },
    };
    if (input.title !== undefined) update.title = input.title;
    if (input.summary !== undefined) update.summary = input.summary;
    if (input.bodyMd !== undefined) update.bodyMd = input.bodyMd;
    if (input.status !== undefined && input.status !== null) update.status = input.status;
    if (input.phase !== undefined) update.phase = input.phase;
    if (input.priority !== undefined) update.priority = input.priority;
    if (input.confidence !== undefined) update.confidence = input.confidence;
    if (input.ownerId !== undefined) {
      update.owner = input.ownerId
        ? { connect: { id: input.ownerId } }
        : { disconnect: true };
    }
    if (input.data !== undefined) update.data = input.data as Prisma.InputJsonValue;

    if (input.tags !== undefined) {
      await tx.tagOnRecord.deleteMany({ where: { recordId: input.id } });
      const connectors = await createTagConnectors(tx, input.tags);
      update.tags = { create: connectors };
    }

    const updated = await tx.record.update({
      where: { id: input.id },
      data: update,
    });

    if (input.status && before.status !== updated.status) {
      await tx.activity.create({
        data: {
          recordId: updated.id,
          actorId: input.actorId,
          verb: "status_changed",
          field: "status",
          before: { status: before.status },
          after: { status: updated.status },
        },
      });
    } else {
      await tx.activity.create({
        data: {
          recordId: updated.id,
          actorId: input.actorId,
          verb: "updated",
        },
      });
    }

    return updated;
  });
}

export async function archiveRecord(id: string, actorId: string) {
  return prisma.record.update({
    where: { id },
    data: { archivedAt: new Date(), updatedById: actorId },
  });
}

export async function getRecord(id: string) {
  return prisma.record.findUnique({
    where: { id },
    include: {
      owner: true,
      createdBy: true,
      updatedBy: true,
      tags: { include: { tag: true } },
      outgoingLinks: { include: { to: true } },
      incomingLinks: { include: { from: true } },
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
      attachments: true,
      activity: { include: { actor: true }, orderBy: { createdAt: "desc" }, take: 50 },
      aiOutputs: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function listRecords(type: RecordType, opts?: {
  status?: string;
  phase?: string;
  ownerId?: string;
  tag?: string;
  search?: string;
  includeArchived?: boolean;
}) {
  const where: Prisma.RecordWhereInput = {
    type,
    archivedAt: opts?.includeArchived ? undefined : null,
  };
  if (opts?.status) where.status = opts.status;
  if (opts?.phase) where.phase = opts.phase as Prisma.RecordWhereInput["phase"];
  if (opts?.ownerId) where.ownerId = opts.ownerId;
  if (opts?.tag) {
    where.tags = { some: { tag: { name: opts.tag.toLowerCase() } } };
  }
  if (opts?.search) {
    where.OR = [
      { title: { contains: opts.search, mode: "insensitive" } },
      { summary: { contains: opts.search, mode: "insensitive" } },
      { bodyMd: { contains: opts.search, mode: "insensitive" } },
    ];
  }

  return prisma.record.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }],
    include: {
      owner: true,
      tags: { include: { tag: true } },
      _count: { select: { outgoingLinks: true, incomingLinks: true, comments: true } },
    },
  });
}
