import { Vazirmatn } from 'next/font/google';

export const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-vazirmatn',
  display: 'swap',
});

export const PersianFontLoader = () => {
  return null;
};
