import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert a Supabase aggregator field (such as restaurant_count) into a plain number.
 * The aggregator can be:
 *  - a number (e.g. 3)
 *  - an object { count: 3 }
 *  - an array of objects [ { count: 3 } ]
 */
export function getCount(
  rc: number | { count: number } | { count: number }[] | null
): number {
  if (!rc) return 0;
  if (typeof rc === "number") return rc;
  if (Array.isArray(rc)) {
    // If it's an array, try to return the first element's count
    if (rc.length > 0 && rc[0] && typeof rc[0] === "object" && "count" in rc[0]) {
      return Number(rc[0].count) || 0;
    }
    return 0;
  }
  if (typeof rc === "object" && "count" in rc) {
    return Number(rc.count) || 0;
  }
  return 0;
}
