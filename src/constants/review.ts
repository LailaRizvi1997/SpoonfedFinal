export const REVIEW_TAGS = [
  "worth the hype",
  "underrated",
  "overhyped",
  "elite",
  "daylight robbery",
  "guilty pleasure",
  "marmite",
  "mid",
  "NPC central"
] as const

export type ReviewTag = typeof REVIEW_TAGS[number] | null 