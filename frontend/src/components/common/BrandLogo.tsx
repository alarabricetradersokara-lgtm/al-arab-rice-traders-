import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: 'dark' | 'light';
  subText?: string;
  className?: string;
}

export const BrandEmblem: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-sm transition-transform hover:scale-105 ${className}`}
    >
      <defs>
        {/* Luxury Emerald Gradient */}
        <linearGradient id="emeraldBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#064E3B" />
          <stop offset="50%" stopColor="#047857" />
          <stop offset="100%" stopColor="#022C22" />
        </linearGradient>

        {/* Royal Gold Gradient */}
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="40%" stopColor="#F59E0B" />
          <stop offset="80%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        {/* Pearl White Rice Grain Gradient */}
        <linearGradient id="riceGrainGrad" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#FEF3C7" />
          <stop offset="100%" stopColor="#FDE68A" />
        </linearGradient>

        {/* Soft Shadow */}
        <filter id="glowShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Rounded Squircle Outer Emblem Shield */}
      <rect
        x="4"
        y="4"
        width="92"
        height="92"
        rx="26"
        fill="url(#emeraldBg)"
        stroke="url(#goldGradient)"
        strokeWidth="3.5"
      />

      {/* Inner Decorative Golden Ring */}
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        stroke="url(#goldGradient)"
        strokeWidth="1.2"
        strokeDasharray="3 3"
        opacity="0.6"
      />

      {/* Left Symmetrical Rice Sheaf (Golden Grain Ears) */}
      <g stroke="url(#goldGradient)" strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d="M 28 72 C 24 54, 30 36, 46 22" />
        {/* Grain grains on left stalk */}
        <ellipse cx="26" cy="62" rx="4.5" ry="2.2" fill="url(#goldGradient)" transform="rotate(-30 26 62)" stroke="none" />
        <ellipse cx="28" cy="50" rx="4.8" ry="2.3" fill="url(#goldGradient)" transform="rotate(-20 28 50)" stroke="none" />
        <ellipse cx="33" cy="39" rx="4.8" ry="2.3" fill="url(#goldGradient)" transform="rotate(-10 33 39)" stroke="none" />
        <ellipse cx="40" cy="29" rx="4.5" ry="2.2" fill="url(#goldGradient)" transform="rotate(5 40 29)" stroke="none" />
      </g>

      {/* Right Symmetrical Rice Sheaf (Golden Grain Ears) */}
      <g stroke="url(#goldGradient)" strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d="M 72 72 C 76 54, 70 36, 54 22" />
        {/* Grain grains on right stalk */}
        <ellipse cx="74" cy="62" rx="4.5" ry="2.2" fill="url(#goldGradient)" transform="rotate(30 74 62)" stroke="none" />
        <ellipse cx="72" cy="50" rx="4.8" ry="2.3" fill="url(#goldGradient)" transform="rotate(20 72 50)" stroke="none" />
        <ellipse cx="67" cy="39" rx="4.8" ry="2.3" fill="url(#goldGradient)" transform="rotate(10 67 39)" stroke="none" />
        <ellipse cx="60" cy="29" rx="4.5" ry="2.2" fill="url(#goldGradient)" transform="rotate(-5 60 29)" stroke="none" />
      </g>

      {/* Centerpiece: Elegant Long Basmati Grain */}
      <g filter="url(#glowShadow)">
        <path
          d="M 50 18 C 58 32, 60 52, 50 80 C 40 52, 42 32, 50 18 Z"
          fill="url(#riceGrainGrad)"
        />
        {/* Grain center delicate contour */}
        <path
          d="M 50 24 C 52 42, 52 58, 50 74"
          stroke="#D97706"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.75"
        />
      </g>

      {/* Arabic Calligraphy Monogram Motif "العرب" */}
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fontSize="17"
        fontWeight="900"
        fontFamily="sans-serif"
        fill="#047857"
        style={{ letterSpacing: '0.5px' }}
      >
        العرب
      </text>

      {/* Stars on bottom crest */}
      <circle cx="50" cy="85" r="2.2" fill="url(#goldGradient)" />
      <circle cx="42" cy="83" r="1.6" fill="url(#goldGradient)" opacity="0.8" />
      <circle cx="58" cy="83" r="1.6" fill="url(#goldGradient)" opacity="0.8" />
    </svg>
  );
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  textColor = 'dark',
  subText,
  className = '',
}) => {
  const sizeMap = {
    sm: { icon: 34, title: 'text-sm', sub: 'text-[9px]' },
    md: { icon: 42, title: 'text-base sm:text-lg', sub: 'text-[10px] sm:text-[11px]' },
    lg: { icon: 54, title: 'text-xl sm:text-2xl', sub: 'text-xs sm:text-sm' },
    xl: { icon: 72, title: 'text-2xl sm:text-3xl', sub: 'text-xs sm:text-sm' },
  };

  const currentSize = sizeMap[size];
  const isDark = textColor === 'dark';

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 ${className}`}>
      {/* Golden Emblem Seal */}
      <BrandEmblem size={currentSize.icon} />

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col text-left">
          {/* Main Urdu Stylized Title */}
          <div className="flex items-center gap-2">
            <span
              className={`font-black tracking-tight leading-tight ${currentSize.title} ${
                isDark ? 'text-slate-900' : 'text-white'
              }`}
            >
              العرب رائز ٹریڈرز
            </span>
          </div>

          {/* Subtitle / English Title */}
          <span
            className={`font-semibold tracking-wide ${currentSize.sub} ${
              isDark ? 'text-emerald-700' : 'text-emerald-300'
            }`}
          >
            {subText || 'AL ARAB RICE TRADERS · اوکاڑہ ⟷ مانسہرہ'}
          </span>
        </div>
      )}
    </div>
  );
};
