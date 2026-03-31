export const TEAM_OPTIONS = [
  "Development",
  "Content",
  "Management",
  "Strategy",
  "Visual Design",
  "User Experience",
  "Greenberry",
] as const;

export type TeamOption = (typeof TEAM_OPTIONS)[number];

export function isTeamOption(value: string): value is TeamOption {
  return TEAM_OPTIONS.includes(value as TeamOption);
}
