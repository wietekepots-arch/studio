# Provider-First Radar Blips Spec

Status: Proposed
Date: 2026-03-07

## Summary

The radar should track adoption decisions, not every individual model release.
For foundation model vendors, the adoption decision is usually the provider
platform, not a single LLM version. This feature shifts LLM representation from
"one blip per model" to "one blip per provider, with a model comparison table
inside the provider blip."

This keeps the radar stable, makes the content easier to maintain, and gives
every blip a consistent structure:

- Description
- Security, including certifications/compliance mentions
- Origin
- Pricing
- Primary link
- Activity
- Experiences

Less prominent metadata remains available, but visually secondary:

- Creator of blip
- Created / updated date
- Sustainability
- Ethics

## Problem

- The current seed mixes products, providers, and individual LLM versions at the
  same level.
- LLM model versions change too fast, which makes the radar noisy and hard to
  curate.
- Pricing is too prominent today and is especially weak as a model-level
  comparison dimension.
- The app already has provider and family inheritance, but the top-level blip
  strategy does not fully use it.
- The current seed action only upserts starter data. It does not delete
  obsolete starter entries, so old content survives a reseed.

## Product Decision

- A radar blip represents the unit the team can meaningfully Adopt, Trial,
  Assess, or Hold.
- For LLM ecosystems, that unit is the provider platform in most cases.
- Individual LLMs should not become top-level radar blips by default.
- LLMs should be shown as a sub-section inside the provider blip:
  `Models`, `Families`, or `Compare models`.
- That sub-section should be a compact table or sub-radar with benchmark links.
- A model-specific blip is only allowed when it has a materially different
  adoption decision. Example: local deployment, different compliance posture,
  or a dedicated product with its own workflow impact.

## Proposed Information Architecture

## Top-level Blip Types

- `provider`: LLM vendors or AI platforms like OpenAI, Anthropic, Google.
- `product`: standalone tools like Cursor or GitHub Copilot.
- `workflow`: internal workflows, agent setups, or delivery patterns.
- `governance`: trust, risk, compliance, or policy tools.

## Blip Detail Layout

All top-level blips use the same section order:

1. Description
2. Security
3. Origin
4. Pricing
5. Primary link
6. Activity
7. Experiences

The `Description` section must start with a practical overview:

- what the tool/provider is
- what people in the organization can use it for
- who it is most relevant for, such as developer, designer, project manager,
  strategist, or operations

This should help a reader decide quickly whether the blip is relevant to their
role before they read governance or operational details.

Secondary metadata is shown in a lower-contrast sidebar or collapsible section:

- Creator
- Created date
- Updated date
- Sustainability
- Ethics

Provider blips get one extra section between `Pricing` and `Activity`:

- `Models & Benchmarks`

That section contains a small comparison table with:

- Model or family name
- Short fit note
- Benchmark link
- Optional vendor/model page link

This section is informational only. It does not create extra radar dots.

## Data Model Proposal

Keep the current provider and family collections. Extend the item model so the
UI can render provider-first blips without overloading the current `pricingTiers`
shape.

### Radar Shared Profile

Extend shared inheritance so provider and family defaults can also carry
certification metadata.

```ts
interface RadarSharedProfile {
  origin?: Origin;
  sustainabilityNotes?: string;
  securityNotes?: string;
  securityCertifications?: string[];
  ethicsNotes?: string;
}
```

### Radar Item

Add lightweight fields instead of introducing a second top-level entity.

```ts
type RadarEntityType = "provider" | "product" | "workflow" | "governance";

interface RadarBenchmarkLink {
  label: string;
  url: string;
}

interface RadarModelEntry {
  name: string;
  familyId?: string;
  summary?: string;
  vendorLink?: string;
  benchmarkLinks?: RadarBenchmarkLink[];
}

interface RadarItem {
  entityType?: RadarEntityType;
  pricingSummary?: string;
  pricingUrl?: string;
  securityCertifications?: string[];
  modelEntries?: RadarModelEntry[];
}
```

### Experience Linkage

Experiences should keep linking to the top-level blip, but they need optional
model context so provider-level experiences stay precise.

```ts
interface ExperienceToolContext {
  itemId: string;
  providerId?: string;
  familyId?: string;
  modelName?: string;
  modelVersion?: string;
}

interface Experience {
  toolLinks: string[]; // Keep for backward compatibility
  toolContexts?: ExperienceToolContext[];
}
```

Rules:

- `toolLinks` continues to point to the top-level radar blip.
- For provider blips, `toolContexts` stores which family/model was actually
  used.
- This keeps the radar stable while preserving model-level experience detail.

### Legacy Pricing

- Keep `pricingTiers` in the schema for backward compatibility during the
  transition.
- Stop using `pricingTiers` in the new seed.
- Prefer `pricingSummary` for top-level display.
- For provider blips, pricing should describe the provider/platform, not the
  individual LLM list.
- Deprecate `costRange` from the main authoring UI.
- Keep `costRange` only as an optional legacy/internal field until old content
  is migrated.

## Content Rules

## Provider Model Setup

The provider-first structure should be modeled like this:

- `radarProviders`
  - canonical provider record
  - owns default governance data
  - example fields: name, website, description, origin, security notes,
    security certifications, sustainability notes, ethics notes
- `radarFamilies`
  - optional grouping layer under a provider
  - used for inheritance and editorial grouping
  - examples: `GPT`, `Claude`, `Gemini`
- `radarItems`
  - contains the actual top-level radar blips
  - a provider decision is one `radarItem` with `entityType: "provider"`
  - that item references `providerId` and may optionally use `familyId` when
    the blip is really about a family-level decision
- `modelEntries`
  - nested inside a provider `radarItem`
  - lists the notable models or families users may want to compare
  - does not create extra radar dots

Recommended relationship rules:

- One provider should usually have one top-level provider blip.
- Families are optional metadata unless a family has a separate adoption
  decision.
- Models stay inside `modelEntries` unless they clearly justify their own blip.
- Experiences attach to the provider blip and optionally specify the exact model
  via `toolContexts`.
- A `modelEntry` must include:
  - `name`
  - `summary`
  - at least one outbound link, preferably a benchmark link and otherwise a
    vendor/model page link

This gives you one stable radar object for strategy, while still allowing
model-level detail where people actually need it.

## LLM Providers

- Create one blip per provider.
- The blip name should match the provider or platform decision. Example:
  `OpenAI`, `Anthropic`, `Google Gemini Platform`.
- Put model families or notable models in `modelEntries`.
- Add benchmark links in `modelEntries`, not as separate blips.
- Do not include detailed pricing rows for each model.

## Standalone Products

- Keep one blip per product when that product is the adoption decision.
- Examples: Cursor, GitHub Copilot, Firebase Studio.

## Governance Fields

- `Security` should explicitly mention certifications/compliance when known.
- `Sustainability` and `Ethics` remain part of the record, but they move to the
  secondary metadata area.
- `Origin` remains a primary field.

## UI / UX Changes

## UX / Design Principles

The tool should be useful across the whole organization, not only for technical
readers. Every blip should optimize for quick understanding first and detailed
evaluation second.

Primary reading goal:

- A reader should understand in a few seconds:
  - what this is
  - what they can use it for
  - whether it is relevant to their role

Required overview pattern:

- Start each blip with a concise practical overview.
- Include a `Useful for` or `Best for` block with role-based guidance.
- Prefer short role labels with one-line usage examples.

Example role framing:

- Developer: coding, prototyping, debugging, automation
- Designer: concepting, copy, research, iteration
- Project manager: planning, summarization, coordination

Governance content principles:

- Origin, security, sustainability, and ethics are important, but should be
  concise in the default view.
- Default view should show a short summary, not a long essay.
- Additional detail should be available progressively:
  - via inline external links
  - via certificate/compliance chips with links
  - or via an info icon that opens a modal/drawer with more context

Certificate/compliance presentation:

- Show certifications or compliance claims as compact chips or badges.
- Each chip should support either:
  - a direct outbound link to the source
  - or an info modal with a short explanation and source link
- Avoid pasting long compliance text into the main blip body.

Content density rules:

- Short description should stay brief and scannable.
- Security/origin/pricing summaries should be 1 short paragraph or less.
- Sustainability and ethics should remain secondary and collapsible when long.
- Long paragraphs should be avoided in the main overview area.

Interaction principle:

- The page should feel layered:
  - immediate answer first
  - structured summaries second
  - evidence/details on demand

This keeps blips approachable for broad internal audiences while preserving the
trust and governance detail needed for informed adoption decisions.

## Radar Item Detail Page

- Replace the large pricing card with a smaller `Pricing` summary block.
- Add a `Models & Benchmarks` table for `entityType === "provider"`.
- Keep `Activity` and `Related Experiences` as primary sections.
- Move sustainability and ethics out of the main overview grid into secondary
  metadata.
- Show security certifications as badges or chips under the security section.

Main body:

- Description
- Useful for / Best for by role
- Security
- Origin
- Pricing
- Models & Benchmarks when applicable
- Experiences

Right sidebar:

- Activity
- Primary link CTA
- Provider/family context
- Creator and dates
- Certificate/compliance affordance when not shown inline

Collapsed or low-emphasis metadata:

- Sustainability
- Ethics
- Legacy/internal fields that are not part of the primary reading flow

## Radar Item Form

- Add `Entity type`.
- Replace `Cost Range` as the main pricing control with:
  - `Pricing summary`
  - `Pricing link` optional
- Remove `Cost Range` from the main form.
- If a coarse cost label is still needed internally, calculate or maintain it as
  an optional admin-only field, not a required editor input.
- Add `Security certifications`.
- Add provider-only `Models & Benchmarks` editor.
- Move sustainability and ethics into an `Advanced` or `Secondary metadata`
  section.

### AI-Assisted Authoring

AI assistance is part of the feature and should remain in the form.

Goals:

- Reduce manual entry for repetitive fields.
- Keep formatting consistent across generated content.
- Generate structured draft content that a human editor reviews before saving.

Recommended actions:

- `AI Categorize`
  - suggests quadrant and tags
- `AI Summary`
  - drafts the short description
- `AI Prefill`
  - drafts most editable fields from item name, notes, provider context, and
    source link

`AI Prefill` should be able to propose:

- short description
- description/body copy
- security notes
- security certifications
- origin
- pricing summary
- tags
- provider model entries when `entityType === "provider"`

Prompt/output requirements:

- AI output must be structured JSON matching a strict schema.
- The prompt must define a style guide per field, not just a general writing
  instruction.
- The model must not return markdown, bullets, or headings inside plain-text
  fields unless the field schema explicitly allows it.
- The model must not invent certifications, compliance claims, or pricing.
- If evidence is missing, the output should use an empty value or a fixed
  placeholder such as `Needs verification`.
- Benchmark links must be valid URLs when provided.
- Every generated field should have deterministic formatting constraints:
  - short description: 1 sentence, max 160 characters
  - pricing summary: 1 sentence, max 140 characters
  - security notes: 1 short paragraph, factual tone
  - origin: enum only
  - tags: normalized array of short labels
  - model entries: fixed object schema only

Editorial rule:

- AI-generated content is always a draft suggestion.
- A human reviewer/editor remains responsible for correctness and consistency.

### AI Output Contracts

The AI flows should be implemented as schema-first operations, not free-form
text generation.

#### AI Categorize

Purpose:

- Suggest quadrant and tags only.

Output contract:

```ts
interface AiCategorizeOutput {
  suggestedQuadrant: string; // must match one available quadrant exactly
  suggestedTags: string[]; // normalized short labels
}
```

Rules:

- `suggestedQuadrant` must be one of the provided quadrant names exactly.
- `suggestedTags` should be deduplicated, trimmed, and consistently cased.
- Maximum 6 tags.

#### AI Summary

Purpose:

- Generate the short description only.

Output contract:

```ts
interface AiSummaryOutput {
  shortDescription: string;
}
```

Rules:

- Exactly 1 sentence.
- Maximum 160 characters.
- No hype language, exclamation marks, or marketing claims.
- Must describe what the tool/provider is and why it matters.

#### AI Prefill

Purpose:

- Generate a draft for most editable fields in a single action.

Output contract:

```ts
interface AiPrefillOutput {
  shortDescription: string;
  notes: string;
  securityNotes: string;
  securityCertifications: string[];
  origin: "European" | "American" | "Other" | "";
  pricingSummary: string;
  tags: string[];
  modelEntries: Array<{
    name: string;
    summary: string;
    vendorLink?: string;
    benchmarkLinks?: Array<{
      label: string;
      url: string;
    }>;
  }>;
  needsVerification: string[];
}
```

Rules:

- `needsVerification` lists fields where the AI could not verify the content.
- `securityCertifications` must be empty unless the source materially supports
  the claim.
- `origin` must be enum-only, never prose.
- `pricingSummary` must be plain text, not a tier table.
- `modelEntries` should be empty for non-provider blips.
- `notes` should follow a fixed editorial structure:
  - sentence 1: what it is
  - sentence 2: where it fits
  - sentence 3: current recommendation or caution

Validation rule:

- The client/server must validate AI output before applying it to the form.
- Invalid fields should be discarded rather than partially trusted.

## Shared Profiles Admin

- Providers and families should support inherited certifications.
- Providers remain the default governance owner for most LLM-related blips.
- Families remain a taxonomy and override layer, not a required radar dot.

## Persistence and CMS Migration

For this feature, Firestore remains the source of truth.

Short term:

- Store providers, families, blips, experiences, review state, and activity in
  Firestore.
- Build the provider-first model directly on top of the existing Firestore data
  flow.

Later, when a CMS is introduced:

- Move curated editorial blip content to the CMS:
  - provider descriptions
  - pricing summaries
  - benchmark links
  - published security/origin/sustainability/ethics copy
  - model comparison content
- Keep operational app data in Firestore:
  - experiences
  - drafts and submissions
  - review workflow
  - item history/activity
  - ownership and user-linked metadata
  - counters and interaction data

Migration rule:

- Do not redesign this feature around the future CMS now.
- Keep Firestore as the active source of truth during this implementation.
- Isolate read/write access so published blip reads can later be swapped to a
  CMS adapter without rewriting the whole UI.

Experience migration rule:

- Existing experiences remain valid with `toolLinks` only.
- New experience writes should store both:
  - `toolLinks` for backward compatibility
  - `toolContexts` when model-level context is available
- Read logic should prefer `toolContexts` when present and fall back to
  `toolLinks` otherwise.

## Seed Strategy

## Goal

Delete the current starter content and replace it with a cleaner provider-first
seed.

## Constraint

The current `seedRadarCollections()` flow only writes missing or changed docs.
It does not remove legacy seed items, legacy seed histories, or legacy config
records that are no longer present in the new seed definition.

## Proposed Reset Strategy

- Introduce a seed-managed marker on all new starter docs:
  - `seedManaged: true`
  - `seedVersion: "v2"`
- The reset scope includes seed-managed docs in:
  - `quadrants`
  - `rings`
  - `radarProviders`
  - `radarFamilies`
  - `tags`
  - `radarItems`
  - `radarItems/{id}/itemHistory`
- Add an admin-only reset action:
  - delete all `seedManaged` starter docs
  - delete their `itemHistory` subcollections
  - recreate starter docs from the new seed
- For one-time cleanup of the current starter set, explicitly delete the legacy
  ids from the existing `radar-seed.ts` dataset before loading the new seed.

This avoids deleting user-created content by accident.

## New Seed Shape

The new seed should favor fewer, clearer starter entries:

- Provider blips for major LLM vendors
- Product blips for standalone AI tools
- Workflow or governance blips where the thing being evaluated is not a vendor
  platform

Example LLM seed pattern:

- `openai` top-level blip
- `anthropic` top-level blip
- `google-gemini-platform` top-level blip
- Each of those includes `modelEntries` with benchmark links

Example non-LLM seed pattern:

- `cursor`
- `github-copilot`
- `firebase-studio`

## Implementation Plan

1. Extend TypeScript models for `entityType`, pricing summary, certifications,
   model entries, and experience model context.
2. Update shared profile resolution to inherit security certifications.
3. Refactor the radar item form to support provider-first authoring and
   AI-assisted field prefilling with strict structured outputs.
4. Redesign the item detail page around the new primary and secondary section
   hierarchy.
5. Keep Firestore as the source of truth and isolate the data access layer for
   future CMS-backed published blip reads.
6. Replace the current starter seed with a provider-first seed file.
7. Add a safe reset-and-reseed action for starter content.
8. Verify that experiences still link cleanly to top-level provider blips and
   can optionally capture model-level usage context.

## Acceptance Criteria

- No individual LLM model version is seeded as a top-level radar blip by
  default.
- Provider blips can show a model comparison table with external benchmark
  links.
- Experiences can link to a provider blip while still recording the exact model
  used.
- AI assistance remains part of the authoring flow and produces schema-validated
  drafts with consistent field formatting.
- Every blip starts with a practical overview and role-based usage guidance for
  broad organizational audiences.
- Every blip detail page uses the same primary structure:
  description, security, origin, pricing, link, activity, experiences.
- Sustainability, ethics, creator, and date metadata are present but visibly
  secondary.
- Security can display certification/compliance metadata.
- The starter reset removes the old seed before writing the new one.
- The reset flow does not wipe user-created content.
- The spec explicitly keeps Firestore as the near-term source of truth and
  defines the future CMS split.

## Recommendation

Use provider-level blips for LLM ecosystems and reserve top-level blips for
actual adoption decisions. This fits the current app well because provider and
family inheritance already exist. The main work is not conceptual; it is the UI
cleanup and the resettable seed pipeline needed to replace the current starter
dataset safely.
