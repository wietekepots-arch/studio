'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BenchmarkLinkSchema = z.object({
  label: z.string().trim().min(1).max(40),
  url: z.string().url(),
});

const PrefillModelEntrySchema = z.object({
  name: z.string().trim().min(1).max(80),
  summary: z.string().trim().min(1).max(220),
  vendorLink: z.string().url().optional(),
  benchmarkLinks: z.array(BenchmarkLinkSchema).max(4).optional(),
});

const AiItemPrefillInputSchema = z.object({
  itemName: z.string().trim().min(1).describe('The radar item name.'),
  existingNotes: z.string().trim().optional().describe('Existing notes or rough context already written by the editor.'),
  primaryLink: z.string().url().optional().describe('Optional primary source link from the editor.'),
  entityType: z.enum(['provider', 'product', 'workflow', 'governance']).describe('The selected top-level entity type.'),
  providerName: z.string().trim().optional().describe('Optional provider context selected in the form.'),
  familyName: z.string().trim().optional().describe('Optional family context selected in the form.'),
  availableTags: z.array(z.string()).optional().describe('Existing tags to align with when possible.'),
});
export type AiItemPrefillInput = z.infer<typeof AiItemPrefillInputSchema>;

const AiItemPrefillOutputSchema = z.object({
  shortDescription: z.string().trim().max(160),
  notes: z.string().trim(),
  securityNotes: z.string().trim(),
  securityCertifications: z.array(z.string().trim().min(1).max(80)).max(6),
  origin: z.enum(['European', 'American', 'Other', '']),
  pricingSummary: z.string().trim().max(140),
  tags: z.array(z.string().trim().min(1).max(32)).max(6),
  modelEntries: z.array(PrefillModelEntrySchema).max(6),
  needsVerification: z.array(z.string().trim().min(1).max(80)).max(10),
});
export type AiItemPrefillOutput = z.infer<typeof AiItemPrefillOutputSchema>;

export async function aiItemPrefill(
  input: AiItemPrefillInput,
): Promise<AiItemPrefillOutput> {
  return aiItemPrefillFlow(input);
}

function normalizeSingleSentence(
  value: string,
  maxLength: number,
): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function normalizeParagraph(value: string): string {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ');
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

function normalizeNeedsVerification(fields: string[]): string[] {
  return Array.from(
    new Set(
      fields
        .map((field) => field.trim())
        .filter(Boolean),
    ),
  ).slice(0, 10);
}

const prompt = ai.definePrompt({
  name: 'aiItemPrefillPrompt',
  input: { schema: AiItemPrefillInputSchema },
  output: { schema: AiItemPrefillOutputSchema },
  prompt: `Je schrijft Nederlandstalige conceptcontent voor een interne Tech Radar.

Doel:
- vul de redacteerbare velden zo volledig mogelijk in
- houd je exact aan het JSON-schema
- maak geen claims over certificeringen, compliance of prijzen als de input daarvoor geen harde basis geeft

Context:
- itemnaam: {{{itemName}}}
- entityType: {{{entityType}}}
- providercontext: {{{providerName}}}
- familiecontext: {{{familyName}}}
- bestaande notities: {{{existingNotes}}}
- primaire link: {{{primaryLink}}}

Bestaande tags om op aan te sluiten:
{{#if availableTags}}
{{#each availableTags}}- {{{this}}}
{{/each}}
{{else}}- Geen bestaande tags opgegeven{{/if}}

Veldregels:
- shortDescription: exact 1 zin, maximaal 160 tekens, feitelijk, zonder marketingtaal
- notes: exact 3 zinnen in deze volgorde:
  1. wat het is
  2. waar het in de organisatie past
  3. huidige aanbeveling of cautie
- securityNotes: 1 kort feitelijk tekstblok
- securityCertifications: alleen invullen als de input dat materieel ondersteunt, anders []
- origin: alleen "European", "American", "Other" of ""
- pricingSummary: exact 1 zin, maximaal 140 tekens, geen prijstabel
- tags: korte labels, opgeschoond, ontdubbeld, maximaal 6
- modelEntries: alleen invullen voor entityType "provider"; voor andere entity types []
- modelEntries.summary: kort fit-advies, geen marketing
- benchmarkLinks/url velden: alleen geldige URLs
- needsVerification: noem veldnamen of onderwerpen die je niet hard kon verifiëren

Verboden:
- markdown
- bullets in platte tekstvelden
- verzonnen certificeringen, compliance claims of prijzen

Als iets niet te onderbouwen is, laat het leeg of zet het onderwerp in needsVerification.
Houd de output strikt aan het JSON-schema.`,
});

const aiItemPrefillFlow = ai.defineFlow(
  {
    name: 'aiItemPrefillFlow',
    inputSchema: AiItemPrefillInputSchema,
    outputSchema: AiItemPrefillOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    const normalizedOrigin: AiItemPrefillOutput['origin'] =
      output?.origin === 'European' ||
      output?.origin === 'American' ||
      output?.origin === 'Other'
        ? output.origin
        : '';
    const normalizedModelEntries =
      input.entityType === 'provider'
        ? (output?.modelEntries || []).map((entry) => ({
            ...entry,
            name: entry.name.trim(),
            summary: normalizeParagraph(entry.summary),
            ...(entry.vendorLink ? { vendorLink: entry.vendorLink.trim() } : {}),
            ...(entry.benchmarkLinks?.length
              ? {
                  benchmarkLinks: entry.benchmarkLinks.map((link) => ({
                    label: link.label.trim(),
                    url: link.url.trim(),
                  })),
                }
              : {}),
          }))
        : [];

    return {
      shortDescription: normalizeSingleSentence(
        output?.shortDescription || '',
        160,
      ),
      notes: normalizeParagraph(output?.notes || ''),
      securityNotes: normalizeParagraph(output?.securityNotes || ''),
      securityCertifications: normalizeTags(output?.securityCertifications || []),
      origin: normalizedOrigin,
      pricingSummary: normalizeSingleSentence(output?.pricingSummary || '', 140),
      tags: normalizeTags(output?.tags || []),
      modelEntries: normalizedModelEntries,
      needsVerification: normalizeNeedsVerification(output?.needsVerification || []),
    };
  },
);
