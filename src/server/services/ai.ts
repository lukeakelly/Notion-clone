import { prisma } from "@/server/db";

export function aiEnabled() {
  return Boolean(process.env.OPENAI_API_KEY);
}

interface SummariseArgs {
  recordId: string;
  actorId: string;
}

export async function summariseRecord(args: SummariseArgs) {
  if (!aiEnabled()) throw new Error("AI disabled: OPENAI_API_KEY not set");

  const record = await prisma.record.findUnique({
    where: { id: args.recordId },
    include: {
      outgoingLinks: { include: { to: true } },
      incomingLinks: { include: { from: true } },
    },
  });
  if (!record) throw new Error("Record not found");

  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const contextParts: string[] = [];
  contextParts.push(`# ${record.type}: ${record.title}`);
  if (record.summary) contextParts.push(record.summary);
  if (record.bodyMd) contextParts.push(record.bodyMd);
  const linkSummary = [
    ...record.outgoingLinks.map((l) => `→ ${l.relation} ${l.to.type}:${l.to.title}`),
    ...record.incomingLinks.map((l) => `← ${l.relation} from ${l.from.type}:${l.from.title}`),
  ].join("\n");
  if (linkSummary) contextParts.push(`## Links\n${linkSummary}`);

  const prompt = contextParts.join("\n\n");

  const response = await client.chat.completions.create({
    model: process.env.AI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Summarise the given Product OS record in 3-6 bullet points. Be concise, concrete, and include key decisions, risks or evidence referenced by links.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
  });

  const content = response.choices[0]?.message?.content ?? "";
  const ai = await prisma.aIOutput.create({
    data: {
      recordId: record.id,
      action: "summarise",
      content,
      model: response.model,
      tokens: response.usage?.total_tokens,
      contextIds: [],
      createdById: args.actorId,
    },
  });
  return ai;
}
