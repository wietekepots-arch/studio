export const radarItemSchema = {
  name: "radarItem",
  title: "Radar Item",
  type: "document",
  fields: [
    { name: "name", title: "Name", type: "string", validation: (Rule: any) => Rule.required() },
    { name: "shortDesc", title: "Short Description", type: "string" },
    { name: "notes", title: "Strategic Context", type: "text" },
    {
      name: "quadrantId",
      title: "Quadrant",
      type: "number",
    },
    {
      name: "ringId",
      title: "Ring",
      type: "number",
    },
    { name: "tags", title: "Tags", type: "array", of: [{ type: "string" }] },
    { name: "team", title: "Team", type: "string" },
    {
      name: "costRange",
      title: "Cost Range",
      type: "string",
      options: { list: ["Free", "Low", "Medium", "High"] },
    },
    {
      name: "origin",
      title: "Origin",
      type: "string",
      options: { list: ["European", "American", "Other"] },
    },
    { name: "sustainabilityNotes", title: "Sustainability Notes", type: "text" },
    { name: "securityNotes", title: "Security Notes", type: "text" },
    { name: "ethicsNotes", title: "Ethics Notes", type: "text" },
    { name: "links", title: "Links", type: "array", of: [{ type: "url" }] },
    {
      name: "scores",
      title: "Scores",
      type: "object",
      fields: [
        { name: "maturity", title: "Maturity", type: "number" },
        { name: "impact", title: "Impact", type: "number" },
        { name: "effort", title: "Effort", type: "number" },
        { name: "risk", title: "Risk", type: "number" },
      ],
    },
    {
      name: "pricingTiers",
      title: "Pricing Tiers",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "name", title: "Tier Name", type: "string" },
            { name: "cost", title: "Cost", type: "string" },
            { name: "billing", title: "Billing Period", type: "string" },
            { name: "features", title: "Features", type: "array", of: [{ type: "string" }] },
          ],
        },
      ],
    },
    {
      name: "status",
      title: "Status",
      type: "string",
      options: { list: ["Draft", "Pending", "Approved"] },
      initialValue: "Draft",
    },
  ],
  preview: {
    select: { title: "name", subtitle: "shortDesc" },
  },
};
