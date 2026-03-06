"use client";

import { Role } from "@/app/lib/radar-types";

export const COMPANY_EMAIL_DOMAIN = "@greenberry.nl";

export function isCompanyEmail(email?: string | null): boolean {
  return typeof email === "string" && email.endsWith(COMPANY_EMAIL_DOMAIN);
}

export function canReviewBlips(role?: Role | null): boolean {
  return role === "PowerUser" || role === "Admin";
}

export function isAdminRole(role?: Role | null): boolean {
  return role === "Admin";
}
