// Simple i18n implementation without external dependencies
import en from './en.json';
import tr from './tr.json';

const resources = {
  en: { translation: en },
  tr: { translation: tr },
};

let currentLanguage = 'en';
const listeners: Array<() => void> = [];

export const t = (key: string): string => {
  const keys = key.split('.');
  let value: any = resources[currentLanguage as keyof typeof resources]?.translation || resources.en.translation;
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
};

export const changeLanguage = (lng: string) => {
  currentLanguage = lng;
  // Notify all listeners about language change
  listeners.forEach(listener => listener());
};

export const getCurrentLanguage = () => currentLanguage;

export const getLanguageLabel = (lng: string) => {
  const labels: { [key: string]: string } = {
    en: 'English',
    tr: 'Türkçe'
  };
  return labels[lng] || lng;
};

export const subscribe = (listener: () => void) => {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
};

// Mock i18n object for compatibility
const i18n = {
  t,
  changeLanguage,
  language: currentLanguage,
  init: () => Promise.resolve(),
  use: () => i18n,
};

export default i18n;
