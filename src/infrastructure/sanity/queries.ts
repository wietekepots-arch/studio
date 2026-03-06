import { sanityClient } from "./client";

export async function fetchCommonContent() {
  return sanityClient.fetch(
    `*[_type == "siteSettings"][0]{
      meta { title, description },
      branding { companyName, tagline },
      navigation,
      auth
    }`,
  );
}

export async function fetchPageContent(slug: string) {
  return sanityClient.fetch(
    `*[_type == "pageContent" && slug.current == $slug][0]`,
    { slug },
  );
}

export async function fetchRadarItems() {
  return sanityClient.fetch(
    `*[_type == "radarItem" && status == "Approved"] | order(updatedAt desc){
      _id,
      name,
      shortDesc,
      notes,
      quadrantId,
      ringId,
      tags,
      team,
      costRange,
      origin,
      sustainabilityNotes,
      securityNotes,
      ethicsNotes,
      links,
      scores,
      pricingTiers,
      status
    }`,
  );
}

export async function fetchQuadrants() {
  return sanityClient.fetch(
    `*[_type == "quadrant"] | order(order asc){ _id, name, "id": _id, order }`,
  );
}

export async function fetchRings() {
  return sanityClient.fetch(
    `*[_type == "ring"] | order(order asc){ _id, name, "id": _id, order }`,
  );
}
