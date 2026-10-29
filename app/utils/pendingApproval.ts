// El backend responde 403 { data: { code: "pending_approval" } } a quien aun no ha
// aprobado un admin (ver requireApprovedUser en el backend)
export const isPendingApprovalError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false
  const candidate = error as {
    statusCode?: number
    status?: number
    data?: { data?: { code?: string } }
  }
  const status = candidate.statusCode ?? candidate.status
  return status === 403 && candidate.data?.data?.code === "pending_approval"
}

// Nombre de la ruta (app/pages/pending.vue); localePath la traduce: /pendente, /es/pendiente, /en/pending
export const PENDING_APPROVAL_ROUTE = "pending"
