export const getSafeRedirectPath = (raw: unknown): string | null => {
  if (typeof raw !== "string") return null
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) return null
  return raw
}
