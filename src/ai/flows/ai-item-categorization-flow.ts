'use server';
/**
 * @fileOverview An AI agent that suggests initial quadrant and tag recommendations for a new radar item.
 *
 * - aiItemCategorization - A function that handles the item categorization process.
 * - ItemCategorizationInput - The input type for the aiItemCategorization function.
 * - ItemCategorizationOutput - The return type for the aiItemCategorization function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ItemCategorizationInputSchema = z.object({
  itemName: z.string().describe("The name of the new radar item."),
  itemDescription: z.string().describe("A detailed description of the new radar item."),
  availableQuadrants: z.array(z.string()).describe("A list of available quadrants to choose from."),
  availableTags: z.array(z.string()).describe("A list of common or existing tags to suggest from. The model can also suggest new, relevant tags if needed.")
});
export type ItemCategorizationInput = z.infer<typeof ItemCategorizationInputSchema>;

const ItemCategorizationOutputSchema = z.object({
  suggestedQuadrant: z.string().describe("The most appropriate quadrant for the item, chosen from the availableQuadrants list."),
  suggestedTags: z.array(z.string()).describe("A list of suggested tags for the item, based on its name and description. These can be from the availableTags list or new relevant tags.")
});
export type ItemCategorizationOutput = z.infer<typeof ItemCategorizationOutputSchema>;

export async function aiItemCategorization(input: ItemCategorizationInput): Promise<ItemCategorizationOutput> {
  return itemCategorizationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'itemCategorizationPrompt',
  input: {schema: ItemCategorizationInputSchema},
  output: {schema: ItemCategorizationOutputSchema},
  prompt: `You are an expert in categorizing technology and methods for an agency's Tech Radar.
Your task is to analyze a new radar item and suggest the most appropriate quadrant and a list of relevant tags.

The available quadrants are:
{{#each availableQuadrants}}- {{this}}
{{/each}}

The item's details are:
Item Name: {{{itemName}}}
Item Description: {{{itemDescription}}}

Consider the following common tags for inspiration, but feel free to suggest new, relevant tags:
{{#if availableTags}}
{{#each availableTags}}- {{this}}
{{/each}}
{{else}}No specific tags provided as examples. Suggest relevant tags based on the item.{{/if}}

Based on the item's name and description, select exactly one quadrant from the 'availableQuadrants' list and suggest a list of relevant tags.
The suggested quadrant MUST be one of the provided availableQuadrants.
Ensure the output matches the specified JSON schema.`
});

const itemCategorizationFlow = ai.defineFlow(
  {
    name: 'itemCategorizationFlow',
    inputSchema: ItemCategorizationInputSchema,
    outputSchema: ItemCategorizationOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
