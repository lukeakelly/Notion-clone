import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { ENTITIES } from "@/lib/entities";
import { RecordForm } from "@/components/record/record-form";

export default async function EditRecordPage({
  params,
}: {
  params: { id: string };
}) {
  const record = await prisma.record.findUnique({
    where: { id: params.id },
    include: { tags: { include: { tag: true } } },
  });
  if (!record) notFound();
  const entity = ENTITIES[record.type];
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold">
        Edit {entity.label.toLowerCase()}
      </h1>
      <RecordForm entity={entity} existing={record} />
    </div>
  );
}
