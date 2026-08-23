import { en } from './en';
import { ro } from './ro';
import { fa } from './fa';
import { Language } from '@/types';

export const getDictionary = (lang: Language) => {
  if (lang === 'ro') return ro;
  if (lang === 'fa') return fa;
  return en;
};
