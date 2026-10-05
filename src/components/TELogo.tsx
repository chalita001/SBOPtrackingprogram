import React from 'react';

interface TELogoProps {
  className?: string;
  variant?: 'full' | 'mark' | 'white-text';
  height?: number;
}

export const TELogo: React.FC<TELogoProps> = ({
  className = '',
  variant = 'full',
  height = 36,
}) => {
  // Proportional width based on height (aspect ratio ~ 3.4 for full, 1.25 for mark)
  const isMarkOnly = variant === 'mark';
  const width = isMarkOnly ? Math.round(height * 1.25) : Math.round(height * 4.2);

  return (
    <div className={`inline-flex items-center select-none ${className}`} style={{ height }}>
      <svg
        viewBox={isMarkOnly ? '0 0 54 40' : '0 0 190 40'}
        height={height}
        width={width}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* TE Orange Badge */}
        <rect width="52" height="40" rx="8" fill="#F37021" />

        {/* Stylized TE Lettermark */}
        <g fill="#FFFFFF">
          {/* T Crossbar & E Top Bar Connected */}
          <path d="M 9 10 L 45 10 L 45 15.5 L 32.5 15.5 L 32.5 19.5 L 42 19.5 L 42 24.5 L 32.5 24.5 L 32.5 26.5 L 45 26.5 L 45 32 L 26 32 L 26 15.5 L 20 15.5 L 20 32 L 13.5 32 L 13.5 15.5 L 9 15.5 Z" />
        </g>

        {/* "connectivity" Wordmark if full variant */}
        {!isMarkOnly && (
          <text
            x="60"
            y="26"
            fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontSize="18"
            fontWeight="500"
            letterSpacing="-0.3px"
            fill={variant === 'white-text' ? '#FFFFFF' : '#F37021'}
          >
            connectivity
          </text>
        )}
      </svg>
    </div>
  );
};
