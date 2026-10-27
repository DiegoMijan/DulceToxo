export const isUnauthorizedError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false

  const candidate = error as {
    statusCode?: number
    status?: number
    response?: { status?: number }
  }

  return (
    candidate.statusCode === 401 || candidate.status === 401 || candidate.response?.status === 401
  )
}
