/** Tiny classname combiner (no dependency). Filters falsy values and joins. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
