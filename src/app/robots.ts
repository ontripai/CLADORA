import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/private/', '/*/app/', '/*/demo'],
    },
    sitemap: 'https://cladora.ro/sitemap.xml',
  };
}
