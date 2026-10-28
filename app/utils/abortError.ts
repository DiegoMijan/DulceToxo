export const isAbortError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false
  if (error instanceof DOMException) return error.name === "AbortError"

  const candidate = error as { name?: string; cause?: unknown }
  if (candidate.name === "AbortError") return true

  const cause = candidate.cause
  if (cause instanceof DOMException) return cause.name === "AbortError"
  if (cause && typeof cause === "object" && "name" in cause) {
    return (cause as { name?: string }).name === "AbortError"
  }

  return false
}
