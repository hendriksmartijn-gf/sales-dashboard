import Anthropic from "@anthropic-ai/sdk";
import { tavily } from "@tavily/core";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface LeadEnrichmentInput {
  name: string;
  linkedinUrl?: string | null;
  company?: string | null;
  role?: string | null;
}

interface LeadEnrichmentResult {
  summary: string;
  score: number;
}

export async function enrichLead(
  lead: LeadEnrichmentInput
): Promise<LeadEnrichmentResult> {
  const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY! });

  // Search for information about the lead
  const searchQueries = [
    `${lead.name} ${lead.company ?? ""} LinkedIn`,
    `${lead.name} ${lead.company ?? ""} ${lead.role ?? ""}`,
    lead.linkedinUrl ? `${lead.name} site:linkedin.com` : `${lead.name} ${lead.company ?? ""} nieuws`,
  ].filter(Boolean);

  const searchResults = await Promise.allSettled(
    searchQueries.map((query) =>
      tavilyClient.search(query, {
        maxResults: 3,
        searchDepth: "basic",
      })
    )
  );

  const searchContext = searchResults
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<Awaited<ReturnType<typeof tavilyClient.search>>>).value)
    .flatMap((r) => r.results)
    .map((r) => `Titel: ${r.title}\nURL: ${r.url}\nInhoud: ${r.content}`)
    .join("\n\n---\n\n");

  const prompt = `Je bent een sales intelligence assistent voor Goldfizh, een digitaal change consultancy.

Goldfizh biedt de volgende diensten:
- AI Strategie
- Change Management
- Digitale Transformatie
- Organisatieontwerp
- Leiderschapsontwikkeling

Je analyseert een potentiële lead op basis van beschikbare informatie en geeft:
1. Een korte samenvatting (max 150 woorden) over de persoon en hun relevantie voor Goldfizh
2. Een kwalificatiescore van 1-10 (10 = perfect fit voor Goldfizh diensten)

Lead informatie:
- Naam: ${lead.name}
- Bedrijf: ${lead.company ?? "Onbekend"}
- Functie: ${lead.role ?? "Onbekend"}
- LinkedIn: ${lead.linkedinUrl ?? "Niet beschikbaar"}

Gevonden informatie uit het internet:
${searchContext || "Geen aanvullende informatie gevonden."}

Geef je antwoord als JSON in dit exacte formaat:
{
  "summary": "Korte samenvatting hier...",
  "score": 7
}

Beoordeel de score op basis van:
- Beslissingsbevoegdheid (senior functie = hoger)
- Bedrijfsgrootte (middelgroot tot groot = hoger)
- Sector (overheid, zorg, financiën, tech = hoger)
- Relevantie voor digitale transformatie/AI/change
- Beschikbaarheid van informatie (meer info = iets hogere zekerheid)`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  // Extract JSON from response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse JSON from Claude response");
  }

  const result = JSON.parse(jsonMatch[0]) as LeadEnrichmentResult;

  return {
    summary: result.summary,
    score: Math.min(10, Math.max(1, Math.round(result.score))),
  };
}
