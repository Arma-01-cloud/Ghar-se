import React from 'react';

/**
 * UR GROZY Exact Uploaded Logo Component
 * Displays the exact uploaded logo design without alterations.
 */
export default function UrGrozyLogo({
  size = 'md',
  className = '',
  onClick,
  showTagline = false,
  subtitle = ''
}) {
  const sizeMap = {
    xs: 'h-6',
    sm: 'h-8 sm:h-9',
    md: 'h-9 sm:h-10 md:h-11',
    lg: 'h-12 sm:h-14',
    xl: 'h-16 sm:h-20',
  };

  const heightClass = sizeMap[size] || sizeMap.md;

  return (
    <div 
      onClick={onClick}
      className={`inline-flex flex-col justify-center select-none shrink-0 ${onClick ? 'cursor-pointer group' : ''} ${className}`}
    >
      <div className="flex items-center">
        <img 
          src="/ur-grozy-logo.png" 
          alt="UR GROZY" 
          className={`${heightClass} w-auto max-w-full object-contain filter drop-shadow-xs transition-transform duration-200 group-hover:scale-102`}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/logo.png';
          }}
        />
      </div>
      {subtitle ? (
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mt-0.5">
          {subtitle}
        </span>
      ) : showTagline ? (
        <span className="text-[10px] sm:text-[11px] text-stone-500 font-semibold tracking-wide hidden xs:inline leading-none mt-0.5">
          Local Groceries Delivered
        </span>
      ) : null}
    </div>
  );
}
