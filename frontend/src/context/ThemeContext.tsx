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
  shades: Record<string, string>;
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
    shades: {
      '50': '#ecfdf5',
      '100': '#d1fae5',
      '200': '#a7f3d0',
      '300': '#6ee7b7',
      '400': '#34d399',
      '500': '#10b981',
      '600': '#059669',
      '700': '#047857',
      '800': '#065f46',
      '900': '#064e3b',
      '950': '#022c22',
    },
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
    shades: {
      '50': '#eff6ff',
      '100': '#dbeafe',
      '200': '#bfdbfe',
      '300': '#93c5fd',
      '400': '#60a5fa',
      '500': '#3b82f6',
      '600': '#2563eb',
      '700': '#1d4ed8',
      '800': '#1e40af',
      '900': '#1e3a8a',
      '950': '#172554',
    },
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
    shades: {
      '50': '#fffbeb',
      '100': '#fef3c7',
      '200': '#fde68a',
      '300': '#fcd34d',
      '400': '#fbbf24',
      '500': '#f59e0b',
      '600': '#d97706',
      '700': '#b45309',
      '800': '#92400e',
      '900': '#78350f',
      '950': '#451a03',
    },
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
    shades: {
      '50': '#f8fafc',
      '100': '#f1f5f9',
      '200': '#e2e8f0',
      '300': '#cbd5e1',
      '400': '#94a3b8',
      '500': '#64748b',
      '600': '#475569',
      '700': '#334155',
      '800': '#1e293b',
      '900': '#0f172a',
      '950': '#020617',
    },
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
    shades: {
      '50': '#faf5ff',
      '100': '#f3e8ff',
      '200': '#e9d5ff',
      '300': '#d8b4fe',
      '400': '#c084fc',
      '500': '#a855f7',
      '600': '#9333ea',
      '700': '#7e22ce',
      '800': '#6b21a8',
      '900': '#581c87',
      '950': '#3b0764',
    },
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
    root.setAttribute('data-theme', currentTheme);
    root.style.setProperty('--primary', themeConfig.primaryColor);
    root.style.setProperty('--primary-dark', themeConfig.primaryHover);
    root.style.setProperty('--primary-subtle', themeConfig.badgeBg);

    // Dynamically inject full Tailwind v4 color variables so all elements change instantly
    Object.entries(themeConfig.shades).forEach(([shade, hex]) => {
      root.style.setProperty(`--color-emerald-${shade}`, hex);
    });
  }, [currentTheme, themeConfig]);

  return (
    <ThemeContext.Provider value={{ currentTheme, themeConfig, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
