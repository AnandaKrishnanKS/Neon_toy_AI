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

export function optimizeUnsplashUrl(url: string, width: number = 500, quality: number = 80): string {
  if (!url || !url.includes('unsplash.com')) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('auto', 'format');
    urlObj.searchParams.set('w', width.toString());
    urlObj.searchParams.set('q', quality.toString());
    return urlObj.toString();
  } catch {
    return url;
  }
}
