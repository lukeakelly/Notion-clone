import Link from "next/link";
import { MODULES, ENTITIES } from "@/lib/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewRecordChooser() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-xl font-semibold">New record</h1>
      <p className="text-sm text-neutral-500">Choose the type of record to create.</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {MODULES.map((m) => {
          const entities = m.entities.map((t) => ENTITIES[t]).filter((e) => e.mvp);
          if (entities.length === 0) return null;
          return (
            <Card key={m.key}>
              <CardHeader>
                <CardTitle>{m.label}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {entities.map((e) => {
                  const Icon = e.icon;
                  return (
                    <Link
                      key={e.type}
                      href={`/${e.slug}/new`}
                      className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{e.label}</span>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
