'use server';
/**
 * @fileOverview An AI agent that suggests initial quadrant and tag recommendations for a new radar blip.
 *
 * - aiBlipCategorization - A function that handles the blip categorization process.
 * - BlipCategorizationInput - The input type for the aiBlipCategorization function.
 * - BlipCategorizationOutput - The return type for the aiBlipCategorization function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BlipCategorizationInputSchema = z.object({
  blipName: z.string().describe("The name of the new radar blip."),
  blipDescription: z.string().describe("A detailed description of the new radar blip."),
  availableQuadrants: z.array(z.string()).describe("A list of available quadrants to choose from."),
  availableTags: z.array(z.string()).describe("A list of common or existing tags to suggest from. The model can also suggest new, relevant tags if needed.")
});
export type BlipCategorizationInput = z.infer<typeof BlipCategorizationInputSchema>;

const BlipCategorizationOutputSchema = z.object({
  suggestedQuadrant: z.string().describe("The most appropriate quadrant for the blip, chosen from the availableQuadrants list."),
  suggestedTags: z.array(z.string()).max(6).describe("A list of suggested tags for the blip, based on its name and description. These can be from the availableTags list or new relevant tags.")
});
export type BlipCategorizationOutput = z.infer<typeof BlipCategorizationOutputSchema>;

export async function aiBlipCategorization(input: BlipCategorizationInput): Promise<BlipCategorizationOutput> {
  return blipCategorizationFlow(input);
}

function normalizeTags(tags: string[]): string[] {
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ).slice(0, 6);
}

const prompt = ai.definePrompt({
  name: 'blipCategorizationPrompt',
  input: {schema: BlipCategorizationInputSchema},
  output: {schema: BlipCategorizationOutputSchema},
  prompt: `Je categoriseert technologie en werkwijzen voor een intern Tech Radar.
Analyseer een nieuw blip en kies het best passende kwadrant plus relevante tags.
De interface is Nederlandstalig, dus gebruik Nederlandse labels en Nederlandse generieke tags.
Behoud product- en merknamen zoals ze officieel geschreven worden.

Beschikbare kwadranten:
{{#each availableQuadrants}}- {{this}}
{{/each}}

Details van de blip:
Naam: {{{blipName}}}
Beschrijving: {{{blipDescription}}}

Gebruik onderstaande tags als inspiratie, maar voeg gerust nieuwe relevante tags toe:
{{#if availableTags}}
{{#each availableTags}}- {{this}}
{{/each}}
{{else}}Er zijn geen voorbeeldtags opgegeven. Stel zelf passende tags voor op basis van de blip.{{/if}}

Kies exact een kwadrant uit de lijst 'availableQuadrants' en stel een lijst relevante tags voor.
Het gekozen kwadrant MOET exact een van de opgegeven waarden zijn.
Geef maximaal 6 tags terug. Tags moeten kort, opgeschoond en ontdubbeld zijn.
Houd de output strikt aan het opgegeven JSON-schema.`
});

const blipCategorizationFlow = ai.defineFlow(
  {
    name: 'blipCategorizationFlow',
    inputSchema: BlipCategorizationInputSchema,
    outputSchema: BlipCategorizationOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    const suggestedQuadrant = input.availableQuadrants.includes(
      output?.suggestedQuadrant || '',
    )
      ? output!.suggestedQuadrant
      : input.availableQuadrants[0] || '';

    return {
      suggestedQuadrant,
      suggestedTags: normalizeTags(output?.suggestedTags || []),
    };
  }
);
