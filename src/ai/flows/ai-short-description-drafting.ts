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

const AiShortDescriptionDraftingOutputSchema = z.string().describe('A concise short description for the radar item.');
export type AiShortDescriptionDraftingOutput = z.infer<typeof AiShortDescriptionDraftingOutputSchema>;

export async function aiShortDescriptionDrafting(input: AiShortDescriptionDraftingInput): Promise<AiShortDescriptionDraftingOutput> {
  return aiShortDescriptionDraftingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiShortDescriptionDraftingPrompt',
  input: { schema: AiShortDescriptionDraftingInputSchema },
  output: { schema: AiShortDescriptionDraftingOutputSchema },
  prompt: `You are an AI assistant specialized in summarizing technical information for a "Tech Radar" application.
Your goal is to generate a concise short description (around 1-2 sentences) for a radar item, based on the provided detailed notes and any relevant information from the given links.
The short description should capture the essence of the item, highlighting its purpose, key features, or impact, in a way that is easily understandable for a technical audience.

Detailed Notes:
{{{detailedNotes}}}

{{#if links}}
External Links (Please prioritize information from notes if links are not easily parsable or directly relevant):
{{#each links}}- {{{this}}}
{{/each}}
{{/if}}

Please provide only the concise short description.`,
});

const aiShortDescriptionDraftingFlow = ai.defineFlow(
  {
    name: 'aiShortDescriptionDraftingFlow',
    inputSchema: AiShortDescriptionDraftingInputSchema,
    outputSchema: AiShortDescriptionDraftingOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
