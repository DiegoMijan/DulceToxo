export const isNotFoundError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false

  const candidate = error as {
    statusCode?: number
    status?: number
    response?: { status?: number }
  }

  return (
    candidate.statusCode === 404 || candidate.status === 404 || candidate.response?.status === 404
  )
}
