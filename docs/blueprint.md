# **App Name**: Greenberry Agency Radar

## Core Features:

- User Authentication & Role Management: Secure Google sign-in for users, with role assignments (Admin, Editor, Viewer) to control access and permissions across the application.
- Dynamic Radar Visualization: An interactive and customizable radar interface displaying tools and techniques across defined quadrants and rings, with filtering by quadrant, search, and a "new / moved" indicator per item.
- Radar Item Creation & Management: Editors can create and update radar items ("Pulses") using a detailed form, defining metadata like description, quadrant, ring, tags, scores, pricing tiers, sustainability notes, security notes, ethics notes, links, and managing status workflow for their own drafts.
- Admin Governance Workflow: Admins have dedicated controls to review proposed items, approve or reject them with comments, and manage the movement of approved items between rings, ensuring proper oversight.
- Item Discussion & Activity Feed: Provides threaded commenting functionality for each radar item, alongside a clear, simple activity feed showing item status changes and important updates.
- Experience Reports: Team members can share how they used a tool — including prompts, findings, outcome ratings, time saved, and data sensitivity — creating a living knowledge base of real usage.
- Dynamic Radar Configuration: An administrative interface for customizing the radar structure by defining and managing the names and order of quadrants and rings.
- AI-Assisted Item Categorization: A generative AI tool (Genkit + Gemini) that suggests initial quadrant and tag recommendations based on the item's name and description during the creation process.
- AI Short-Description Drafting: AI-assisted drafting of concise item descriptions to reduce editor effort.

## Data Model Highlights:

- `RadarItem`: id, name, shortDesc, notes, quadrantId, ringId, previousRingId, tags, team, ownerId, ownerName, scores (maturity/impact/effort/risk), costRange, origin (European/American/Other), sustainabilityNotes, securityNotes, ethicsNotes, pricingTiers, links, status, createdAt, createdBy, updatedAt, updatedBy, history.
- `Experience`: id, title, summary, toolLinks (RadarItem IDs), howUsed, promptsOrTemplates, findings, recommendations, roleTitle, team, dataSensitivity, outcomeRating, timeSavedHours, tags, status, createdAt, createdBy.
- `RadarConfig`: quadrants (default: "Creation & Craft", "Strategy & Intelligence", "Process & Flow", "Positive Impact"), rings (default: Adopt, Trial, Assess, Hold).
- `UserProfile`: uid, displayName, email, role (Admin/Editor/Viewer), team.

## Style Guidelines:

- The visual scheme is light with bold typographic hierarchy, conveying clarity and creative confidence suitable for an agency knowledge platform.
- Design language: "Design for Progress" — large black uppercase headings, rounded card containers, subtle shadows, and high-contrast primary accent.
- Colors defined as design tokens in `globals.css` via `@theme`; no raw Tailwind color utilities.
- Headline and body text font: 'Inter', a grotesque sans-serif, chosen for its modern, objective, and neutral aesthetic, ensuring legibility and a clean interface.
- Implement a clean card layout with ample spacing between elements, emphasizing readability and easy navigation.
- Subtle and fluid animations should be used for interactive elements within the radar visualization, enhancing the perception of fast and responsive interactions.