export const ringSchema = {
  name: "ring",
  title: "Ring",
  type: "document",
  fields: [
    { name: "name", title: "Name", type: "string", validation: (Rule: any) => Rule.required() },
    { name: "order", title: "Order", type: "number", validation: (Rule: any) => Rule.required() },
  ],
  orderings: [
    { title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
  ],
};
