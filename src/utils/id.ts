export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function generateCaseNumber(prefix: string, counter: number): string {
  const year = new Date().getFullYear()
  const seq = String(counter).padStart(4, '0')
  return `${prefix}-${year}-${seq}`
}
