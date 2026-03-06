export const siteSettingsSchema = {
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    {
      name: "meta",
      title: "Meta",
      type: "object",
      fields: [
        { name: "title", title: "Site Title", type: "string" },
        { name: "description", title: "Site Description", type: "string" },
      ],
    },
    {
      name: "branding",
      title: "Branding",
      type: "object",
      fields: [
        { name: "companyName", title: "Company Name", type: "string" },
        { name: "tagline", title: "Tagline", type: "string" },
      ],
    },
    {
      name: "navigation",
      title: "Navigation Labels",
      type: "object",
      fields: [
        { name: "radar", title: "Radar", type: "string" },
        { name: "dashboard", title: "Dashboard", type: "string" },
        { name: "experiences", title: "Experiences", type: "string" },
        { name: "proposeTool", title: "Propose Tool", type: "string" },
        { name: "signIn", title: "Sign In", type: "string" },
      ],
    },
    {
      name: "auth",
      title: "Auth Messages",
      type: "object",
      fields: [
        { name: "companySignInRequired", title: "Company Sign-in Required", type: "string" },
        { name: "goToSignIn", title: "Go to Sign In", type: "string" },
        { name: "memberFallback", title: "Member Fallback", type: "string" },
      ],
    },
  ],
  preview: {
    prepare: () => ({ title: "Site Settings" }),
  },
};
