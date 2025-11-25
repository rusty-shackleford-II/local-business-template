import React from 'react';

interface FlagIconProps {
  countryCode: string;
  className?: string;
}

// SVG flag components - cross-platform compatible
const FlagIcon: React.FC<FlagIconProps> = ({ countryCode, className = "w-6 h-6" }) => {
  const flags: Record<string, React.ReactElement> = {
    // US Flag
    en: (
      <svg className={className} viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
        <clipPath id="t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>
        <path d="M0,0 v30 h60 v-30 z" fill="#b22234"/>
        <path d="M0,3.46 h60 M0,10.38 h60 M0,17.31 h60 M0,24.23 h60" stroke="#fff" strokeWidth="2.31"/>
        <path d="M0,0 v15 h30 v-15 z" fill="#3c3b6e"/>
      </svg>
    ),
    // Spain Flag
    es: (
      <svg className={className} viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
        <rect width="60" height="30" fill="#c60b1e"/>
        <rect y="7.5" width="60" height="15" fill="#ffc400"/>
      </svg>
    ),
    // France Flag
    fr: (
      <svg className={className} viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
        <rect width="20" height="30" fill="#002395"/>
        <rect x="20" width="20" height="30" fill="#ffffff"/>
        <rect x="40" width="20" height="30" fill="#ed2939"/>
      </svg>
    ),
    // Germany Flag
    de: (
      <svg className={className} viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
        <rect width="60" height="10" fill="#000000"/>
        <rect y="10" width="60" height="10" fill="#dd0000"/>
        <rect y="20" width="60" height="10" fill="#ffce00"/>
      </svg>
    ),
    // Italy Flag
    it: (
      <svg className={className} viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
        <rect width="20" height="30" fill="#009246"/>
        <rect x="20" width="20" height="30" fill="#ffffff"/>
        <rect x="40" width="20" height="30" fill="#ce2b37"/>
      </svg>
    ),
    // Portugal Flag
    pt: (
      <svg className={className} viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="30" fill="#006600"/>
        <rect x="24" width="36" height="30" fill="#ff0000"/>
      </svg>
    ),
    // China Flag
    zh: (
      <svg className={className} viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
        <rect width="60" height="30" fill="#de2910"/>
        <polygon points="12,4 14,10 20,10 15,14 17,20 12,16 7,20 9,14 4,10 10,10" fill="#ffde00"/>
      </svg>
    ),
    // Japan Flag
    ja: (
      <svg className={className} viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
        <rect width="60" height="30" fill="#ffffff"/>
        <circle cx="30" cy="15" r="9" fill="#bc002d"/>
      </svg>
    ),
    // South Korea Flag
    ko: (
      <svg className={className} viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
        <rect width="60" height="30" fill="#ffffff"/>
        <circle cx="30" cy="15" r="8" fill="#c60c30"/>
        <circle cx="30" cy="15" r="5" fill="#003478"/>
      </svg>
    ),
    // Saudi Arabia Flag (for Arabic)
    ar: (
      <svg className={className} viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
        <rect width="60" height="30" fill="#165c2a"/>
        <rect x="15" y="10" width="30" height="2" fill="#ffffff"/>
        <rect x="20" y="13" width="20" height="2" fill="#ffffff"/>
      </svg>
    ),
    // Russia Flag
    ru: (
      <svg className={className} viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
        <rect width="60" height="10" fill="#ffffff"/>
        <rect y="10" width="60" height="10" fill="#0039a6"/>
        <rect y="20" width="60" height="10" fill="#d52b1e"/>
      </svg>
    ),
    // India Flag (for Hindi)
    hi: (
      <svg className={className} viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
        <rect width="60" height="10" fill="#ff9933"/>
        <rect y="10" width="60" height="10" fill="#ffffff"/>
        <rect y="20" width="60" height="10" fill="#138808"/>
        <circle cx="30" cy="15" r="4" stroke="#000080" strokeWidth="0.5" fill="none"/>
      </svg>
    ),
  };

  return flags[countryCode] || (
    // Default globe icon for unknown languages
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
};

export default FlagIcon;

