import React, { createContext, useState, useContext, ReactNode, useCallback, Dispatch, SetStateAction } from 'react';
import { translations } from '../i18n';

type Language = 'en' | 'ur';
type Direction = 'ltr' | 'rtl';

interface LanguageContextType {
  language: Language;
  // Fix: Correctly type `setLanguage` to allow functional updates from useState, which resolves the error in App.tsx.
  setLanguage: Dispatch<SetStateAction<Language>>;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
  direction: Direction;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');
  const direction = language === 'ur' ? 'rtl' : 'ltr';

  const t = useCallback((key: string, replacements: { [key: string]: string | number } = {}) => {
    const keys = key.split('.');
    let result: any = translations[language];
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        return key; // Return key if not found
      }
    }
    
    let text = String(result);

    for (const placeholder in replacements) {
        const value = String(replacements[placeholder]);
        text = text.replace(new RegExp(`{{${placeholder}}}`, 'g'), value);
    }
    
    return text;
  }, [language]);


  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, direction }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
