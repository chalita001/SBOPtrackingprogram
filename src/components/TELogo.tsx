import React from 'react';
import teLogoOrange from '../assets/te-logo.png';
import teLogoWhite from '../assets/te-logo-white.png';
import teLogoCard from '../assets/te-logo-card.png';

interface TELogoProps {
  className?: string;
  variant?: 'full' | 'mark' | 'white-text' | 'card';
  height?: number;
}

export const TELogo: React.FC<TELogoProps> = ({
  className = '',
  variant = 'full',
  height = 36,
}) => {
  let src = teLogoOrange;
  if (variant === 'white-text') {
    src = teLogoWhite;
  } else if (variant === 'card' || variant === 'mark') {
    src = teLogoCard;
  }

  return (
    <img
      src={src}
      alt="TE Connectivity"
      style={{ height: `${height}px` }}
      className={`w-auto object-contain select-none shrink-0 ${className}`}
      loading="eager"
    />
  );
};
