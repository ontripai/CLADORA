import { en } from './en';
import { ro } from './ro';
import { Language } from '@/types';

export const getDictionary = (lang: Language) => {
  return lang === 'ro' ? ro : en;
};
