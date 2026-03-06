export const pageContentSchema = {
  name: "pageContent",
  title: "Page Content",
  type: "document",
  fields: [
    {
      name: "slug",
      title: "Page Slug",
      type: "slug",
      validation: (Rule: any) => Rule.required(),
      options: {
        list: [
          { title: "Home", value: "home" },
          { title: "Login", value: "login" },
          { title: "Dashboard", value: "dashboard" },
          { title: "Item Detail", value: "item-detail" },
          { title: "Item Form", value: "item-form" },
          { title: "Experiences", value: "experiences" },
          { title: "Experience Form", value: "experience-form" },
        ],
      },
    },
    { name: "heading", title: "Heading", type: "string" },
    { name: "headingHighlight", title: "Heading Highlight", type: "string" },
    { name: "description", title: "Description", type: "text" },
    {
      name: "content",
      title: "Page-specific Content",
      type: "object",
      fields: [
        { name: "json", title: "Content JSON", type: "text", description: "Full page content as JSON — mirrors the local JSON file structure." },
      ],
    },
  ],
  preview: {
    select: { title: "slug.current" },
    prepare: ({ title }: { title: string }) => ({ title: `Page: ${title}` }),
  },
};
