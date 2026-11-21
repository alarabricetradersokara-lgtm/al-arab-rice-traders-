import React from 'react';
import { useTheme, THEME_PRESETS, AppTheme } from '../../context/ThemeContext';
import { Palette, Check, X } from 'lucide-react';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({ isOpen, onClose }) => {
  const { currentTheme, setTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-200 text-slate-800">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">سسٹم کا رنگ منتخب کریں</h3>
              <p className="text-[11px] text-slate-500 font-medium">Select Application Theme Color</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-2.5">
          {(Object.keys(THEME_PRESETS) as AppTheme[]).map((themeKey) => {
            const preset = THEME_PRESETS[themeKey];
            const isSelected = currentTheme === themeKey;

            return (
              <button
                key={themeKey}
                onClick={() => {
                  setTheme(themeKey);
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-slate-800 bg-slate-50/80 shadow-xs ring-2 ring-slate-800/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full shadow-xs flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: preset.previewColor }}
                  >
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-900 block">{preset.nameUrdu}</span>
                    <span className="text-[10px] text-slate-400 font-medium block">{preset.nameEn}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-md font-semibold border"
                    style={{
                      backgroundColor: preset.badgeBg,
                      color: preset.badgeText,
                      borderColor: preset.ringColor + '40',
                    }}
                  >
                    {isSelected ? 'فعال ہے' : 'منتخب کریں'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white cursor-pointer transition-colors"
          >
            ٹھیک ہے (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
