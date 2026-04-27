import { notFound } from "next/navigation";
import { getEstimate, getRateCards } from "@/server/actions";
import { EstimateWorkspace } from "@/components/estimate/estimate-workspace";

export default async function EstimateDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [estimate, rateCards] = await Promise.all([
    getEstimate(params.id),
    getRateCards(),
  ]);

  if (!estimate) notFound();

  return <EstimateWorkspace estimate={estimate} rateCards={rateCards} />;
}
