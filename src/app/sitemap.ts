import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://cladora.ro';
  const languages = ['ro', 'en'];
  const routes = [
    '',
    '/platform',
    '/solutions/associations',
    '/solutions/property-owners',
    '/solutions/property-managers',
    '/solutions/residents',
    '/solutions/tenants',
    '/modules',
    '/migration',
    '/pricing',
    '/security',
    '/resources/faq',
    '/pilot',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/cookies',
    '/accessibility',
  ];

  const entries: MetadataRoute.Sitemap = [];

  languages.forEach((lang) => {
    routes.forEach((route) => {
      entries.push({
        url: `${baseUrl}/${lang}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: route === '' ? 1.0 : 0.8,
      });
    });
  });

  return entries;
}
