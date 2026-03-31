'use server';
/**
 * @fileOverview This file implements a Genkit flow for drafting a concise short description
 * for a radar blip based on detailed notes and optional links.
 *
 * - aiBlipShortDescriptionDrafting - A function that generates a short description.
 * - AiBlipShortDescriptionDraftingInput - The input type for the aiBlipShortDescriptionDrafting function.
 * - AiBlipShortDescriptionDraftingOutput - The return type for the aiBlipShortDescriptionDrafting function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiBlipShortDescriptionDraftingInputSchema = z.object({
  detailedNotes: z.string().describe('Detailed notes about the radar blip.'),
  links: z.array(z.string().url()).optional().describe('Optional list of external links related to the radar blip.'),
});
export type AiBlipShortDescriptionDraftingInput = z.infer<typeof AiBlipShortDescriptionDraftingInputSchema>;

const AiBlipShortDescriptionDraftingOutputSchema = z.object({
  shortDescription: z.string().trim().max(160).describe('A concise short description for the radar blip.'),
});
export type AiBlipShortDescriptionDraftingOutput = z.infer<typeof AiBlipShortDescriptionDraftingOutputSchema>;

export async function aiBlipShortDescriptionDrafting(
  input: AiBlipShortDescriptionDraftingInput,
): Promise<AiBlipShortDescriptionDraftingOutput> {
  return aiBlipShortDescriptionDraftingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiBlipShortDescriptionDraftingPrompt',
  input: { schema: AiBlipShortDescriptionDraftingInputSchema },
  output: { schema: AiBlipShortDescriptionDraftingOutputSchema },
  prompt: `Je schrijft korte Nederlandstalige samenvattingen voor een Tech Radar-applicatie.
Genereer exact 1 beknopte zin op basis van de uitgebreide notities en eventuele links.
De omschrijving moet duidelijk maken wat de blip is, waar die voor dient en waarom die relevant is.
Schrijf in helder Nederlands, zonder marketingtaal en zonder opsommingen.
De zin moet maximaal 160 tekens hebben.

Uitgebreide notities:
{{{detailedNotes}}}

{{#if links}}
Externe links (gebruik vooral de notities als links niet goed leesbaar of niet direct relevant zijn):
{{#each links}}- {{{this}}}
{{/each}}
{{/if}}

Houd de output strikt aan het JSON-schema.`,
});

const aiBlipShortDescriptionDraftingFlow = ai.defineFlow(
  {
    name: 'aiBlipShortDescriptionDraftingFlow',
    inputSchema: AiBlipShortDescriptionDraftingInputSchema,
    outputSchema: AiBlipShortDescriptionDraftingOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return {
      shortDescription: output?.shortDescription
        ?.replace(/\s+/g, ' ')
        .trim()
        .slice(0, 160) || '',
    };
  }
);
