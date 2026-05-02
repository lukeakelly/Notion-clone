import { EstimatorApp } from "@/components/estimator/estimator-app";
import { requireAuth } from "@/server/require-auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await requireAuth();
  return <EstimatorApp />;
}
