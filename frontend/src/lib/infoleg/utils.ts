export function getApiUrl(path: string): string {
  if (typeof window === 'undefined') {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://www.simplar.com.ar'
        : 'http://localhost:3000');
    return `${base}${path}`;
  }

  return path;
}
