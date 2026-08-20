import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://cladora.ro';
  const languages = ['ro', 'en'];
  const routes = [
    '',
    '/association',
    '/portfolio',
    '/manager',
    '/financial-truth',
    '/building-dna',
    '/meters',
    '/migration',
    '/pricing',
    '/pilot',
    '/trust',
  ];

  const entries: MetadataRoute.Sitemap = [];

  languages.forEach((lang) => {
    routes.forEach((route) => {
      entries.push({
        url: `${baseUrl}/${lang}${route}`,
        lastModified: new Date('2026-08-20'),
        changeFrequency: 'weekly',
        priority: route === '' ? 1.0 : 0.8,
        alternates: {
          languages: {
            ro: `${baseUrl}/ro${route}`,
            en: `${baseUrl}/en${route}`,
          },
        },
      });
    });
  });

  return entries;
}
