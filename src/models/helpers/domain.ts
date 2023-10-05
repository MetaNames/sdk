export function getParentName(domain: string) {
  const names = domain.split('.')
  if (names.length > 2) return names.slice(1).join('.')
}
