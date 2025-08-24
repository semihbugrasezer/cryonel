import { useCallback, useState, useEffect } from 'react';
import { t as translate, changeLanguage as changeLang, getCurrentLanguage as getCurrLang, getLanguageLabel as getLangLabel, subscribe } from '../locales';

export const useI18n = () => {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'tr'>(() => {
    return getCurrLang() as 'en' | 'tr' || 'en';
  });

  // Subscribe to language changes
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setCurrentLanguage(getCurrLang() as 'en' | 'tr');
    });
    return unsubscribe;
  }, []);

  const changeLanguage = useCallback((language: 'en' | 'tr') => {
    changeLang(language);
    // Store language preference in localStorage
    localStorage.setItem('cryonel-language', language);
  }, []);

  const getCurrentLanguage = useCallback(() => {
    return currentLanguage;
  }, [currentLanguage]);

  const getLanguageLabel = useCallback((language: 'en' | 'tr') => {
    return getLangLabel(language);
  }, []);

  // Initialize language from localStorage on mount
  const initializeLanguage = useCallback(() => {
    const savedLanguage = localStorage.getItem('cryonel-language') as 'en' | 'tr';
    if (savedLanguage && ['en', 'tr'].includes(savedLanguage)) {
      changeLanguage(savedLanguage);
    }
  }, [changeLanguage]);

  useEffect(() => {
    initializeLanguage();
  }, [initializeLanguage]);

  return {
    t: translate,
    changeLanguage,
    getCurrentLanguage,
    getLanguageLabel,
    initializeLanguage,
    currentLanguage,
  };
};
