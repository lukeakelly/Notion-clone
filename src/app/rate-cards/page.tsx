import { getRateCards } from "@/server/actions";
import { RateCardsManager } from "@/components/estimate/rate-cards-manager";

export default async function RateCardsPage() {
  const rateCards = await getRateCards();
  return <RateCardsManager initialRateCards={rateCards} />;
}
