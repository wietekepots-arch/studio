export const quadrantSchema = {
  name: "quadrant",
  title: "Quadrant",
  type: "document",
  fields: [
    { name: "name", title: "Name", type: "string", validation: (Rule: any) => Rule.required() },
    { name: "order", title: "Order", type: "number", validation: (Rule: any) => Rule.required() },
  ],
  orderings: [
    { title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
  ],
};
