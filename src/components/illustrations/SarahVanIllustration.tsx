import React from 'react';

interface Props {
  className?: string;
  animateDrive?: boolean;
}

export const SarahVanIllustration: React.FC<Props> = ({ className = 'w-full h-auto', animateDrive = false }) => {
  return (
    <div className={`relative flex items-center justify-center ${animateDrive ? 'animate-pulse' : ''}`}>
      <svg
        viewBox="0 0 480 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Paws & Routes Mobile Pet Grooming Van"
      >
        <defs>
          <linearGradient id="vanBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F5F1E9" />
          </linearGradient>
          <linearGradient id="sageAccentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A8BFA0" />
            <stop offset="100%" stopColor="#7E9E74" />
          </linearGradient>
          <linearGradient id="amberWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E8A838" />
            <stop offset="100%" stopColor="#D99426" />
          </linearGradient>
          <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D8E8E6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ABC4C1" stopOpacity="0.4" />
          </linearGradient>
          <filter id="subtleShadow" x="-5%" y="-5%" width="115%" height="120%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#3D3D3D" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="230" cy="195" rx="190" ry="10" fill="#E5DFD5" />

        <g filter="url(#subtleShadow)">
          {/* Main Van Body Shell */}
          <path
            d="M 60 170
               L 60 85
               Q 60 48 95 48
               L 310 48
               Q 335 48 355 68
               L 395 110
               Q 410 125 410 145
               L 410 170
               Z"
            fill="url(#vanBodyGrad)"
            stroke="#3D3D3D"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Roof AC / High Ventilation Unit */}
          <path
            d="M 120 48 L 120 36 Q 120 32 125 32 L 210 32 Q 215 32 215 36 L 215 48 Z"
            fill="#EFEAE1"
            stroke="#3D3D3D"
            strokeWidth="2.5"
          />
          <line x1="140" y1="36" x2="140" y2="44" stroke="#A8BFA0" strokeWidth="2" strokeLinecap="round" />
          <line x1="155" y1="36" x2="155" y2="44" stroke="#A8BFA0" strokeWidth="2" strokeLinecap="round" />
          <line x1="170" y1="36" x2="170" y2="44" stroke="#A8BFA0" strokeWidth="2" strokeLinecap="round" />

          {/* Front Cab Windshield */}
          <path
            d="M 322 58
               L 350 58
               Q 362 58 375 72
               L 398 108
               L 322 108
               Z"
            fill="url(#glassGrad)"
            stroke="#3D3D3D"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Sarah Driver Silhouette */}
          <circle cx="346" cy="80" r="9" fill="#4F6B4A" />
          <path d="M 334 104 C 334 94 340 91 346 91 C 352 91 358 94 358 104 Z" fill="#4F6B4A" />
          {/* Driver Steering wheel */}
          <path d="M 370 94 L 362 106" stroke="#3D3D3D" strokeWidth="2.5" strokeLinecap="round" />

          {/* Side Grooming Window */}
          <rect
            x="180"
            y="65"
            width="85"
            height="42"
            rx="6"
            fill="url(#glassGrad)"
            stroke="#3D3D3D"
            strokeWidth="2.5"
          />
          {/* Interior Paw print inside window */}
          <path
            d="M 222 84 C 220 84 218 86 218 88 C 218 90 220 92 222 92 C 224 92 226 90 226 88 C 226 86 224 84 222 84 Z"
            fill="#E8A838"
          />
          <circle cx="217" cy="81" r="2" fill="#E8A838" />
          <circle cx="221" cy="79" r="2" fill="#E8A838" />
          <circle cx="225" cy="81" r="2" fill="#E8A838" />

          {/* Van Side Swoop Accent (Sage & Amber) */}
          <path
            d="M 60 135
               Q 160 135 220 120
               T 410 135
               L 410 152
               Q 320 142 220 142
               T 60 150
               Z"
            fill="url(#sageAccentGrad)"
          />
          <path
            d="M 60 150
               Q 160 145 220 138
               T 410 152
               L 410 158
               Q 320 150 220 150
               T 60 158
               Z"
            fill="url(#amberWaveGrad)"
          />

          {/* Brand Lettering on side */}
          <text
            x="85"
            y="95"
            fontFamily="Nunito, sans-serif"
            fontWeight="800"
            fontSize="15"
            fill="#3D3D3D"
            letterSpacing="0.5"
          >
            PAWS & ROUTES
          </text>
          <text
            x="86"
            y="110"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontWeight="600"
            fontSize="8.5"
            fill="#5C5C5C"
            letterSpacing="1"
          >
            MOBILE PET SPA · AUSTIN, TX
          </text>

          {/* Front Bumper & Headlight */}
          <rect x="402" y="152" width="12" height="18" rx="4" fill="#3D3D3D" />
          <path d="M 405 130 Q 412 130 412 136 L 412 142 L 405 142 Z" fill="#FCE588" stroke="#3D3D3D" strokeWidth="2" />
          {/* Rear Taillight */}
          <rect x="58" y="132" width="5" height="18" rx="2" fill="#E8836B" stroke="#3D3D3D" strokeWidth="1.5" />

          {/* Wheel Wells */}
          <path
            d="M 100 170 A 32 32 0 0 1 164 170 Z"
            fill="#3D3D3D"
          />
          <path
            d="M 315 170 A 32 32 0 0 1 379 170 Z"
            fill="#3D3D3D"
          />

          {/* Rear Wheel */}
          <g transform="translate(132, 170)">
            <circle cx="0" cy="0" r="28" fill="#2B2B2B" stroke="#3D3D3D" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="16" fill="#F0EDE6" stroke="#3D3D3D" strokeWidth="2" />
            <circle cx="0" cy="0" r="6" fill="#4F6B4A" />
            {/* Spokes */}
            <line x1="-12" y1="0" x2="12" y2="0" stroke="#3D3D3D" strokeWidth="2" />
            <line x1="0" y1="-12" x2="0" y2="12" stroke="#3D3D3D" strokeWidth="2" />
          </g>

          {/* Front Wheel */}
          <g transform="translate(347, 170)">
            <circle cx="0" cy="0" r="28" fill="#2B2B2B" stroke="#3D3D3D" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="16" fill="#F0EDE6" stroke="#3D3D3D" strokeWidth="2" />
            <circle cx="0" cy="0" r="6" fill="#4F6B4A" />
            {/* Spokes */}
            <line x1="-12" y1="0" x2="12" y2="0" stroke="#3D3D3D" strokeWidth="2" />
            <line x1="0" y1="-12" x2="0" y2="12" stroke="#3D3D3D" strokeWidth="2" />
          </g>

          {/* Side Door Seam & Handle */}
          <line x1="285" y1="58" x2="285" y2="165" stroke="#D5CFBE" strokeWidth="1.5" />
          <rect x="290" y="118" width="10" height="4" rx="2" fill="#3D3D3D" />
        </g>
      </svg>
    </div>
  );
};
