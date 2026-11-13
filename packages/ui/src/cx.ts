/** Joins class names, skipping falsy values. Later classes are appended, never merged. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}
