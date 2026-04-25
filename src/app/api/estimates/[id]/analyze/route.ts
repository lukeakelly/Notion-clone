import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import OpenAI from "openai";

const SYSTEM_PROMPT = `You are an expert software project estimator. Analyse the provided text (which may be a Business Requirements Document, discovery workshop output, RFP, user stories, or any project brief) and extract structured information for a software project estimate.

Return a JSON object with the following structure:
{
  "scopeItems": [
    {
      "name": "Short feature name",
      "description": "Plain-English description",
      "category": "frontend|backend|integration|data|ai|devops|testing|design|security",
      "priority": "must|should|could|wont",
      "complexity": "low|medium|high|very_high",
      "effortDriver": "screen|api|workflow|integration|report|data_model|ai_capability|component|migration"
    }
  ],
  "risks": [
    {
      "description": "Risk description",
      "impact": "low|medium|high",
      "likelihood": "low|medium|high",
      "mitigation": "Suggested mitigation"
    }
  ],
  "assumptions": [
    {
      "description": "Assumption text"
    }
  ],
  "summary": "Brief executive summary of what was extracted and key observations",
  "missingInformation": ["List of information gaps or questions that should be clarified"],
  "suggestedProjectType": "web_application|mobile_app|internal_app|saas_product|ai_application|agentic_workflow|integration_platform|data_dashboard|portal|automation_platform|legacy_replacement",
  "suggestedConfidence": "high|medium|low|very_low",
  "confidenceReason": "Explanation of why this confidence level was assigned"
}

Guidelines:
- Extract ALL identifiable features, even if described briefly
- Classify each feature into the most appropriate category (frontend, backend, etc.)
- Infer complexity from the description — features with integrations, complex logic, or security are higher complexity
- Set priority based on language cues ("must", "critical", "nice to have", "optional", etc.)
- Identify risks from ambiguous requirements, unknown integrations, security concerns, etc.
- Generate assumptions from implicit requirements (e.g., "assumes client provides API documentation")
- Flag missing information that would improve the estimate
- Be thorough — it's better to extract more items than fewer
- Only return valid JSON, no markdown or code fences`;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { content } = body as { content: string };

  if (!content?.trim()) {
    return NextResponse.json({ error: "No content provided" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured. Set OPENAI_API_KEY in your environment." },
      { status: 500 },
    );
  }

  const openai = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyse the following project document and extract all features, risks, and assumptions for a software project estimate.\n\nEstimate ID: ${id}\n\n---\n\n${content}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 4096,
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    const result = JSON.parse(text);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI analysis failed";
    console.error("AI analysis error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
