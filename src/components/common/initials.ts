export function initialsOf(name?: string | null): string {
  return (name ?? 'U')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
