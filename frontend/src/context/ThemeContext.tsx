import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'emerald' | 'blue' | 'amber' | 'slate' | 'purple';

export interface ThemeConfig {
  id: AppTheme;
  nameUrdu: string;
  nameEn: string;
  primaryColor: string;
  primaryHover: string;
  badgeBg: string;
  badgeText: string;
  ringColor: string;
  previewColor: string;
}

export const THEME_PRESETS: Record<AppTheme, ThemeConfig> = {
  emerald: {
    id: 'emerald',
    nameUrdu: 'زمردی ہرا (ڈیفالٹ)',
    nameEn: 'Emerald Forest',
    primaryColor: '#047857',
    primaryHover: '#065F46',
    badgeBg: '#ECFDF5',
    badgeText: '#065F46',
    ringColor: '#10B981',
    previewColor: '#047857',
  },
  blue: {
    id: 'blue',
    nameUrdu: 'شاہی نیلا',
    nameEn: 'Royal Sapphire',
    primaryColor: '#1D4ED8',
    primaryHover: '#1E40AF',
    badgeBg: '#EFF6FF',
    badgeText: '#1E40AF',
    ringColor: '#3B82F6',
    previewColor: '#1D4ED8',
  },
  amber: {
    id: 'amber',
    nameUrdu: 'سنہری چاول',
    nameEn: 'Golden Grain',
    primaryColor: '#B45309',
    primaryHover: '#92400E',
    badgeBg: '#FFFBEB',
    badgeText: '#92400E',
    ringColor: '#F59E0B',
    previewColor: '#B45309',
  },
  slate: {
    id: 'slate',
    nameUrdu: 'جدید سلیٹ',
    nameEn: 'Midnight Luxury',
    primaryColor: '#0F172A',
    primaryHover: '#1E293B',
    badgeBg: '#F1F5F9',
    badgeText: '#0F172A',
    ringColor: '#475569',
    previewColor: '#0F172A',
  },
  purple: {
    id: 'purple',
    nameUrdu: 'شاہی پرپل',
    nameEn: 'Imperial Violet',
    primaryColor: '#6D28D9',
    primaryHover: '#5B21B6',
    badgeBg: '#F5F3FF',
    badgeText: '#5B21B6',
    ringColor: '#8B5CF6',
    previewColor: '#6D28D9',
  },
};

interface ThemeContextType {
  currentTheme: AppTheme;
  themeConfig: ThemeConfig;
  setTheme: (theme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: 'emerald',
  themeConfig: THEME_PRESETS.emerald,
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('alarab_theme') as AppTheme;
    return saved && THEME_PRESETS[saved] ? saved : 'emerald';
  });

  const setTheme = (theme: AppTheme) => {
    setCurrentThemeState(theme);
    localStorage.setItem('alarab_theme', theme);
  };

  const themeConfig = THEME_PRESETS[currentTheme];

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', themeConfig.primaryColor);
    root.style.setProperty('--primary-dark', themeConfig.primaryHover);
    root.style.setProperty('--primary-subtle', themeConfig.badgeBg);
    root.setAttribute('data-theme', currentTheme);
  }, [currentTheme, themeConfig]);

  return (
    <ThemeContext.Provider value={{ currentTheme, themeConfig, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
