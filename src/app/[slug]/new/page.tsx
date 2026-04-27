import { notFound } from "next/navigation";
import { entityBySlug } from "@/lib/entities";
import { RecordForm } from "@/components/record/record-form";
import { requireAuth } from "@/server/require-auth";

export default async function NewRecordPage({
  params,
}: {
  params: { slug: string };
}) {
  await requireAuth();
  const entity = entityBySlug(params.slug);
  if (!entity) notFound();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold">New {entity.label.toLowerCase()}</h1>
      <RecordForm entity={entity} />
    </div>
  );
}
