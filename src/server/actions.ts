"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import {
  createRecord,
  updateRecord,
  archiveRecord,
  type CreateRecordInput,
  type UpdateRecordInput,
} from "@/server/services/records";
import { createLink, deleteLink } from "@/server/services/links";
import { prisma } from "@/server/db";
import type { LinkRelation, Prisma, RecordType } from "@prisma/client";
import { summariseRecord } from "@/server/services/ai";
import { ENTITIES } from "@/lib/entities";

async function currentActorId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function createRecordAction(input: Omit<CreateRecordInput, "actorId">) {
  const actorId = await currentActorId();
  const created = await createRecord({ ...input, actorId });
  revalidatePath("/");
  return created;
}

export async function quickCaptureAction(input: {
  title: string;
  type?: RecordType;
  summary?: string;
}) {
  const actorId = await currentActorId();
  const record = await createRecord({
    type: input.type ?? "idea",
    title: input.title,
    summary: input.summary,
    actorId,
  });
  revalidatePath("/");
  return record;
}

export async function updateRecordAction(input: Omit<UpdateRecordInput, "actorId">) {
  const actorId = await currentActorId();
  const updated = await updateRecord({ ...input, actorId });
  revalidatePath(`/records/${updated.id}`);
  return updated;
}

export async function archiveRecordAction(id: string) {
  const actorId = await currentActorId();
  await archiveRecord(id, actorId);
  revalidatePath("/");
}

export async function createLinkAction(input: {
  fromId: string;
  toId: string;
  relation: LinkRelation;
  note?: string | null;
}) {
  const actorId = await currentActorId();
  const link = await createLink({ ...input, actorId });
  revalidatePath(`/records/${input.fromId}`);
  revalidatePath(`/records/${input.toId}`);
  return link;
}

export async function deleteLinkAction(id: string) {
  const actorId = await currentActorId();
  const link = await deleteLink(id, actorId);
  if (link) {
    revalidatePath(`/records/${link.fromId}`);
    revalidatePath(`/records/${link.toId}`);
  }
}

export async function createCommentAction(input: {
  recordId: string;
  bodyMd: string;
  parentId?: string | null;
}) {
  const actorId = await currentActorId();
  const comment = await prisma.comment.create({
    data: {
      recordId: input.recordId,
      authorId: actorId,
      bodyMd: input.bodyMd,
      parentId: input.parentId ?? null,
    },
  });
  await prisma.activity.create({
    data: {
      recordId: input.recordId,
      actorId,
      verb: "commented",
    },
  });
  revalidatePath(`/records/${input.recordId}`);
  return comment;
}

export async function resolveCommentAction(id: string) {
  await currentActorId();
  const comment = await prisma.comment.update({
    where: { id },
    data: { resolvedAt: new Date() },
  });
  revalidatePath(`/records/${comment.recordId}`);
}

export async function createAttachmentAction(input: {
  recordId: string;
  filename?: string | null;
  externalUrl: string;
}) {
  const actorId = await currentActorId();
  const att = await prisma.attachment.create({
    data: {
      recordId: input.recordId,
      filename: input.filename || input.externalUrl,
      mime: "text/uri-list",
      size: 0,
      storageKey: "",
      externalUrl: input.externalUrl,
      uploadedById: actorId,
    },
  });
  revalidatePath(`/records/${input.recordId}`);
  return att;
}

export async function summariseRecordAction(recordId: string) {
  const actorId = await currentActorId();
  const out = await summariseRecord({ recordId, actorId });
  revalidatePath(`/records/${recordId}`);
  return out;
}

export async function signInDevAction(email: string) {
  // Used on the sign-in page to keep the UI server-component simple.
  // Actual sign-in happens through the NextAuth /api/auth/callback/dev route.
  redirect(`/api/auth/signin/dev?email=${encodeURIComponent(email)}`);
}

export async function searchAction(query: string) {
  return (await import("./services/search")).search(query);
}

export async function findRecordsForPicker(
  query: string,
  excludeId?: string,
  typeFilter?: RecordType,
) {
  const q = query.trim();
  const where: Prisma.RecordWhereInput = {
    archivedAt: null,
    ...(excludeId ? { id: { not: excludeId } } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
  };
  if (q) {
    const lower = q.toLowerCase();
    const matchedTypes = Object.values(ENTITIES)
      .filter((e) =>
        [e.type, e.label, e.labelPlural].some((s) => s.toLowerCase().includes(lower)),
      )
      .map((e) => e.type);
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
      ...(matchedTypes.length > 0 ? [{ type: { in: matchedTypes } }] : []),
    ];
  }
  return prisma.record.findMany({
    where,
    take: 20,
    orderBy: [{ updatedAt: "desc" }],
    select: { id: true, title: true, type: true, status: true },
  });
}
