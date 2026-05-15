export function normalizeRole(role: unknown): string {
  return typeof role === 'string' ? role.trim().toUpperCase() : ''
}

export function isTutorRole(role: unknown): boolean {
  return normalizeRole(role) === 'TUTOR'
}

export function isAdminRole(role: unknown): boolean {
  return normalizeRole(role) === 'ADMIN'
}
