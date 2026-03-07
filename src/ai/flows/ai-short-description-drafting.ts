'use server';
/**
 * @fileOverview This file implements a Genkit flow for drafting a concise short description
 * for a radar item based on detailed notes and optional links.
 *
 * - aiShortDescriptionDrafting - A function that generates a short description.
 * - AiShortDescriptionDraftingInput - The input type for the aiShortDescriptionDrafting function.
 * - AiShortDescriptionDraftingOutput - The return type for the aiShortDescriptionDrafting function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiShortDescriptionDraftingInputSchema = z.object({
  detailedNotes: z.string().describe('Detailed notes about the radar item.'),
  links: z.array(z.string().url()).optional().describe('Optional list of external links related to the radar item.'),
});
export type AiShortDescriptionDraftingInput = z.infer<typeof AiShortDescriptionDraftingInputSchema>;

const AiShortDescriptionDraftingOutputSchema = z.object({
  shortDescription: z.string().trim().max(160).describe('A concise short description for the radar item.'),
});
export type AiShortDescriptionDraftingOutput = z.infer<typeof AiShortDescriptionDraftingOutputSchema>;

export async function aiShortDescriptionDrafting(input: AiShortDescriptionDraftingInput): Promise<AiShortDescriptionDraftingOutput> {
  return aiShortDescriptionDraftingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiShortDescriptionDraftingPrompt',
  input: { schema: AiShortDescriptionDraftingInputSchema },
  output: { schema: AiShortDescriptionDraftingOutputSchema },
  prompt: `Je schrijft korte Nederlandstalige samenvattingen voor een Tech Radar-applicatie.
Genereer exact 1 beknopte zin op basis van de uitgebreide notities en eventuele links.
De omschrijving moet duidelijk maken wat het item is, waar het voor dient en waarom het relevant is.
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

const aiShortDescriptionDraftingFlow = ai.defineFlow(
  {
    name: 'aiShortDescriptionDraftingFlow',
    inputSchema: AiShortDescriptionDraftingInputSchema,
    outputSchema: AiShortDescriptionDraftingOutputSchema,
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
