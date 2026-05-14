export function createProductSlug(id: number | string, name: string): string {
  const slugifiedName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${slugifiedName}-${id}`;
}

export function extractIdFromSlug(slug: string): number {
  const match = slug.match(/-(\d+)$/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return parseInt(slug, 10);
}
