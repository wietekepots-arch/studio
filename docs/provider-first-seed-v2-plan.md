# Provider-First Seed V2 Plan

Status: Proposed
Date: 2026-03-07
Related: `docs/provider-first-blip-spec.md`

## Goal

Replace the current starter seed with a smaller, clearer dataset that matches
the provider-first spec and gives each blip useful copy for the whole
organization.

This plan answers three questions:

1. Which current seed entries should be deleted, merged, or kept?
2. What should the new starter set contain?
3. How should the copy for each new blip be written?

## Seed Review Summary

The current seed is not suitable for a direct rewrite in place. It should be
treated as a legacy starter set.

Main issues:

- too many LLM version blips
- pricing is over-detailed
- role-based usefulness is mostly missing
- security/compliance wording is too absolute in places
- many entries have no primary link
- provider-level governance is duplicated across model entries

## Current Seed Actions

## Delete And Replace With Provider Blips

These should not survive as standalone blips in v2:

- `claude-3-5` -> merge into `anthropic-platform`
- `claude-4-6` -> merge into `anthropic-platform`
- `gpt-5-4` -> merge into `openai-platform`
- `gpt-5-3` -> merge into `openai-platform`
- `gpt-5-3-codex` -> merge into `openai-platform`
- `gpt-5-1-codex-mini` -> merge into `openai-platform`
- `gemini-3-flash` -> merge into `google-gemini-platform`
- `mistral-le-chat` -> replace with `mistral-platform`

## Keep As Standalone Product Blips, But Rewrite Copy

These are still meaningful top-level adoption decisions:

- `transcriptor`
- `firebase-studio`
- `cursor`
- `copilot`
- `claude-code`
- `warp`
- `windsurf`
- `v0`
- `perplexity`
- `lovable`

## Remove Or Hold Back From Starter Seed

These should not be in the default seed unless there is a strong internal
reason:

- `antigravity`

Reason:

- too vague
- unclear governance and sourcing
- weak fit for a curated starter dataset

## Proposed V2 Starter Set

The seed should be smaller and more opinionated. A good default target is
10-14 top-level blips.

## Provider Blips

- `anthropic-platform`
- `openai-platform`
- `google-gemini-platform`
- `mistral-platform`

## Product Blips

- `firebase-studio`
- `cursor`
- `github-copilot`
- `claude-code`
- `warp`
- `windsurf`
- `v0`
- `perplexity`
- `transcriptor`
- `lovable`

This keeps the starter set broad enough for the organization without flooding
the radar with model versions.

## Proposed Replacement Map

| Current Item             | Action           | New Item                  |
| ------------------------ | ---------------- | ------------------------- |
| Claude 3.5 Sonnet        | Delete / merge   | Anthropic Platform        |
| Claude 4.6 Sonnet        | Delete / merge   | Anthropic Platform        |
| GPT-5.4                  | Delete / merge   | OpenAI Platform           |
| GPT-5.3                  | Delete / merge   | OpenAI Platform           |
| GPT-5.3 Codex            | Delete / merge   | OpenAI Platform           |
| GPT-5.1 Codex mini       | Delete / merge   | OpenAI Platform           |
| Gemini 3 Flash           | Delete / merge   | Google Gemini Platform    |
| Mistral Le Chat          | Delete / replace | Mistral Platform          |
| Transcriptor             | Keep / rewrite   | Transcriptor              |
| Firebase Studio          | Keep / rewrite   | Firebase Studio           |
| Cursor                   | Keep / rewrite   | Cursor                    |
| GitHub Copilot           | Keep / rewrite   | GitHub Copilot            |
| Claude Code              | Keep / rewrite   | Claude Code               |
| Warp                     | Keep / rewrite   | Warp                      |
| Windsurf                 | Keep / rewrite   | Windsurf                  |
| v0 by Vercel             | Keep / rewrite   | v0 by Vercel              |
| Perplexity               | Keep / rewrite   | Perplexity                |
| Lovable                  | Keep / rewrite   | Lovable                   |
| Antigravity              | Remove           | none                      |

## Content Blueprint For Every New Blip

Each seed entry should be written to the same copy contract.

## Required Primary Sections

- `Short description`
  - one sentence
  - explains what it is and why it matters
- `Overview`
  - short paragraph only
  - starts with what the tool is
  - then what people can use it for
  - then current recommendation/caution
- `Useful for`
  - role-based bullets or structured labels
  - at least 2 roles when relevant
- `Security`
  - short factual summary
  - mention certifications only when supported
- `Origin`
  - short enum-backed label plus optional short note
- `Pricing`
  - short summary only
- `Primary link`
  - always present

## Required Secondary Sections

- `Sustainability`
- `Ethics`
- `Certificates / Compliance`
  - chip/link/modal pattern
- `Activity`
- `Experiences`

## Copy Rules

- avoid marketing language
- avoid unqualified claims like `fully compliant` or `guaranteed secure`
- keep security, sustainability, and ethics concise
- prefer `Needs verification` over invented detail
- role-based usefulness must be explicit
- every seeded blip must have a source link

## Proposed Blip Drafts

These are not final production copy. They are content-direction briefs for the
new seed.

## 1. Anthropic Platform

- `id`: `anthropic-platform`
- `entityType`: `provider`
- `quadrant`: `Models & Intelligence`
- `ring`: `Adopt` or `Trial`
- `why this exists`:
  - captures the provider-level decision to use Anthropic across the
    organization

Copy direction:

- short description:
  - `Anthropic is a foundation model platform used for reasoning, writing, and coding workflows.`
- overview:
  - explain that Anthropic is relevant for teams using Claude across research,
    writing, and engineering use cases
  - note that model choice sits inside the provider blip
- useful for:
  - Developer: coding support and agent workflows
  - Designer: concepting and content iteration
  - Project manager: summaries and structured drafting
- security:
  - factual summary only
  - mention supported enterprise/privacy claims with links
- model entries:
  - Claude Sonnet
  - Claude Opus if relevant
  - benchmark links

## 2. OpenAI Platform

- `id`: `openai-platform`
- `entityType`: `provider`
- `quadrant`: `Models & Intelligence`
- `ring`: `Adopt`

Copy direction:

- short description:
  - `OpenAI is a general-purpose AI platform used across chat, reasoning, and coding workflows.`
- useful for:
  - Developer: coding and automation
  - Designer: ideation and copy iteration
  - Project manager: planning, summarization, synthesis
- model entries:
  - GPT family
  - Codex/coding-oriented models when relevant
  - benchmark links

## 3. Google Gemini Platform

- `id`: `google-gemini-platform`
- `entityType`: `provider`
- `quadrant`: `Models & Intelligence`
- `ring`: `Trial` or `Assess`

Copy direction:

- short description:
  - `Google Gemini Platform is a multimodal AI platform suited to high-volume and Google-connected workflows.`
- useful for:
  - Developer: multimodal prototyping and Google ecosystem use
  - Designer: image/text-assisted exploration
  - Project manager: summaries inside Google-heavy workflows
- model entries:
  - Gemini Flash
  - Gemini Pro or equivalent family rows

## 4. Mistral Platform

- `id`: `mistral-platform`
- `entityType`: `provider`
- `quadrant`: `Trust & Governance` or `Models & Intelligence`
- `ring`: `Assess`

Copy direction:

- short description:
  - `Mistral is a European AI platform worth assessing for teams that prioritize EU context and data-residency concerns.`
- useful for:
  - Project manager: privacy-sensitive drafting
  - Strategist: research with stronger European positioning
  - Operations: workflows requiring regional governance review
- note:
  - avoid overclaiming on GDPR or residency without linked evidence

## 5. Firebase Studio

- `id`: `firebase-studio`
- `entityType`: `product`
- keep as a top-level product blip

Copy direction:

- focus on internal-tool prototyping and MVP delivery
- useful for:
  - Developer: internal tooling and prototypes
  - Designer: validating ideas with working interfaces
  - Project manager: fast testable concepts for delivery alignment

## 6. Cursor

- `id`: `cursor`
- `entityType`: `product`

Copy direction:

- focus on daily engineering use, codebase navigation, refactoring, and agentic
  editing
- useful for:
  - Developer: daily coding, refactoring, debugging
  - Tech lead: faster codebase exploration and implementation review

## 7. GitHub Copilot

- `id`: `github-copilot`
- `entityType`: `product`

Copy direction:

- focus on teams standardized on GitHub and VS Code
- useful for:
  - Developer: inline completion and chat
  - Engineering manager: broad team rollout with familiar tooling

## 8. Claude Code

- `id`: `claude-code`
- `entityType`: `product`

Why it stays:

- it is a distinct product experience and adoption decision, not just a model
  choice

Copy direction:

- focus on terminal-native multi-step development workflows
- useful for:
  - Developer: codebase changes, CLI-driven workflows
  - Tech lead: controlled agentic engineering tasks

## 9. Warp

- `id`: `warp`
- `entityType`: `product`

Copy direction:

- focus on terminal productivity rather than generic AI
- useful for:
  - Developer: command-line productivity
  - Operations: repeatable shell workflows

## 10. Windsurf

- `id`: `windsurf`
- `entityType`: `product`

Copy direction:

- position as an alternative IDE worth assessing, not as a default standard
- useful for:
  - Developer: alternative AI IDE evaluation
  - Engineering lead: benchmark against Cursor/Copilot

## 11. v0 by Vercel

- `id`: `v0`
- `entityType`: `product`

Copy direction:

- focus on front-end prototyping and design-to-code acceleration
- useful for:
  - Designer: concept validation and UI iteration
  - Developer: fast starting point for front-end work
  - Project manager: faster prototype reviews

## 12. Perplexity

- `id`: `perplexity`
- `entityType`: `product`

Copy direction:

- focus on research and cited answer workflows
- useful for:
  - Strategist: competitive scanning
  - Project manager: quick briefing and synthesis
  - Designer: reference gathering and trend research

## 13. Transcriptor

- `id`: `transcriptor`
- `entityType`: `product`

Copy direction:

- focus on meeting capture, summaries, and language support
- useful for:
  - Project manager: meeting summaries and actions
  - Operations: searchable meeting memory
  - Strategist: interview and workshop capture

## 14. Lovable

- `id`: `lovable`
- `entityType`: `product`

Copy direction:

- focus on app generation for quick concept validation
- useful for:
  - Designer: concept exploration
  - Developer: rapid starting point
  - Project manager: MVP concept validation

## Proposed Provider Model Rows

These belong inside provider blips, not as top-level radar dots.

## Anthropic Platform

- Claude Sonnet
- Claude Opus if adopted/assessed

## OpenAI Platform

- GPT flagship row
- GPT fast/efficient row if relevant
- Codex/coding row

## Google Gemini Platform

- Gemini Flash
- Gemini Pro or equivalent reasoning row

## Mistral Platform

- Le Chat or platform chat experience
- any enterprise/API-facing family worth comparing

Each model row should include:

- name
- one-line fit summary
- vendor/model page link
- benchmark link when available

## Content Rewrite Priorities

If you do this in phases, use this order:

1. Replace LLM version blips with provider blips.
2. Add primary links to every seeded item.
3. Rewrite overview copy to include role-based usefulness.
4. Replace pricing tiers with short pricing summaries.
5. Rewrite security copy to remove unsupported absolute claims.
6. Fill secondary governance fields only when evidence exists.

## Implementation Notes

- Reuse the existing provider and family collections.
- Add new top-level provider `radarItems` rather than relying on provider
  records alone.
- Keep product blips separate from provider blips when the product is a distinct
  adoption decision.
- Do not seed long-form compliance prose.
- Do not seed empty links.
- Do not seed placeholder items that lack a clear internal recommendation.

## Acceptance Check For The New Seed

The v2 seed is ready when:

- no LLM version is a top-level starter blip
- every starter blip has a primary link
- every starter blip answers `what is this useful for?`
- every starter blip includes role-based guidance where relevant
- pricing is summary-first, not tier-table-first
- security wording is concise and sourceable
- provider blips include model rows instead of extra radar dots
