import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CLADORA — Residential Asset Operating System',
    short_name: 'CLADORA',
    description: 'Residential asset operations, accounting, metering, governance, and portfolio management.',
    start_url: '/ro',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#102A43',
    icons: [
      {
        src: '/brand/app/cladora-app-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/brand/app/cladora-app-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
