import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EntityMeta } from "@/lib/entities";

export function DataFieldsPanel({
  entity,
  data,
}: {
  entity: EntityMeta;
  data: Record<string, unknown>;
}) {
  if (!entity.dataFields || entity.dataFields.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{entity.label} fields</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {entity.dataFields.map((f) => {
            const v = data?.[f.key];
            if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) return null;
            return (
              <div key={f.key}>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  {f.label}
                </dt>
                <dd className="mt-0.5 text-sm">
                  {Array.isArray(v) ? (
                    <ul className="list-disc pl-4">
                      {v.map((item, i) => (
                        <li key={i}>{String(item)}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="whitespace-pre-wrap">{String(v)}</div>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      </CardContent>
    </Card>
  );
}
