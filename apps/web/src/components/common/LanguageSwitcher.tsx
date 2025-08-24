import { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';

export default function LanguageSwitcher() {
  const { changeLanguage, getCurrentLanguage, getLanguageLabel, currentLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const languages: Array<{ code: 'en' | 'tr'; label: string; flag: string }> = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  ];

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  const handleLanguageChange = (languageCode: 'en' | 'tr') => {
    changeLanguage(languageCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-800/50 dark:hover:bg-slate-700/50 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all duration-200 min-h-[44px] min-w-[44px] touch-manipulation"
        aria-label="Change language"
      >
        <Globe className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        <span className="text-sm font-medium">{currentLang.flag}</span>
        <span className="hidden sm:block text-sm text-slate-700 dark:text-slate-200">{currentLang.label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 text-slate-600 dark:text-slate-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 sm:w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-2 z-50 backdrop-blur-sm">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left min-h-[48px] touch-manipulation ${
                currentLanguage === language.code ? 'bg-slate-100 dark:bg-slate-700/50 text-orange-600 dark:text-orange-500' : 'text-slate-700 dark:text-slate-200'
              }`}
            >
              <span className="text-lg">{language.flag}</span>
              <span className="font-medium">{language.label}</span>
              {currentLanguage === language.code && (
                <span className="ml-auto text-orange-600 dark:text-orange-500 font-bold">✓</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
