import React from 'react';
import { ZoneId } from '../../types';

interface Props {
  selectedZone: ZoneId | null;
  onSelectZone?: (zone: ZoneId) => void;
  className?: string;
  interactive?: boolean;
}

interface ZonePolygon {
  id: ZoneId;
  label: string;
  shortLabel: string;
  cx: number;
  cy: number;
  d: string;
}

const ZONE_DEFINITIONS: ZonePolygon[] = [
  {
    id: 'Cedar Park',
    label: 'Cedar Park',
    shortLabel: 'Cedar Park',
    cx: 110,
    cy: 70,
    d: 'M 40 30 L 160 30 L 170 100 L 70 115 L 40 80 Z',
  },
  {
    id: 'Round Rock',
    label: 'Round Rock',
    shortLabel: 'Round Rock',
    cx: 260,
    cy: 65,
    d: 'M 175 30 L 330 30 L 340 95 L 210 110 L 175 60 Z',
  },
  {
    id: 'North Austin',
    label: 'North Austin (Domain)',
    shortLabel: 'North Austin',
    cx: 185,
    cy: 130,
    d: 'M 75 118 L 172 103 L 230 113 L 270 145 L 225 175 L 110 170 Z',
  },
  {
    id: 'Central Austin',
    label: 'Central Austin (Home Base)',
    shortLabel: 'Central Austin',
    cx: 180,
    cy: 210,
    d: 'M 115 175 L 225 178 L 235 240 L 125 242 Z',
  },
  {
    id: 'East Austin',
    label: 'East Austin',
    shortLabel: 'East Austin',
    cx: 285,
    cy: 220,
    d: 'M 230 150 L 290 148 L 350 195 L 340 270 L 240 255 L 230 180 Z',
  },
  {
    id: 'South Austin',
    label: 'South Austin',
    shortLabel: 'South Austin',
    cx: 180,
    cy: 295,
    d: 'M 125 245 L 238 245 L 245 320 L 195 365 L 115 330 Z',
  },
  {
    id: 'Oak Hill/West',
    label: 'Oak Hill / West',
    shortLabel: 'Oak Hill / West',
    cx: 80,
    cy: 265,
    d: 'M 40 200 L 120 180 L 120 315 L 45 310 Z',
  },
];

export const AustinZoneMapSvg: React.FC<Props> = ({
  selectedZone,
  onSelectZone,
  className = 'w-full h-auto',
  interactive = true,
}) => {
  const activeDef = ZONE_DEFINITIONS.find((z) => z.id === selectedZone);

  return (
    <div className="relative w-full rounded-2xl bg-[#F0EDE6] border border-[#E5DFD5] p-3 overflow-hidden select-none">
      <svg
        viewBox="0 0 380 380"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        role="region"
        aria-label="Interactive Austin Service Zone Map"
      >
        <defs>
          <filter id="pinShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#3D3D3D" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Base Map Grid Texture */}
        <pattern id="dotGrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#DCD5C8" opacity="0.6" />
        </pattern>
        <rect width="380" height="380" fill="url(#dotGrid)" />

        {/* Lady Bird Lake / Colorado River Curve */}
        <path
          d="M 20 225 Q 90 230 140 235 T 235 240 T 360 250"
          fill="none"
          stroke="#ABC4C1"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.85"
        />
        {/* River Label */}
        <text x="290" y="246" fontSize="7" fill="#5C5C5C" fontFamily="Plus Jakarta Sans, sans-serif" opacity="0.7">
          Lady Bird Lake
        </text>

        {/* Major Highways (I-35 & MoPac subtle tracks) */}
        {/* MoPac (Loop 1) */}
        <path
          d="M 140 40 Q 135 150 145 220 T 150 360"
          fill="none"
          stroke="#D0C9BA"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
        {/* I-35 */}
        <path
          d="M 230 40 Q 220 140 225 220 T 215 360"
          fill="none"
          stroke="#D0C9BA"
          strokeWidth="2"
          strokeDasharray="4 3"
        />

        {/* Zone Polygons */}
        {ZONE_DEFINITIONS.map((zone) => {
          const isSelected = selectedZone === zone.id;
          const isHome = zone.id === 'Central Austin';

          let fillColor = '#FFFFFF';
          let strokeColor = '#D5CFBE';
          let textColor = '#5C5C5C';

          if (isSelected) {
            fillColor = '#E7EFE5'; // Soft sage tint
            strokeColor = '#4F6B4A'; // Deep sage border
            textColor = '#3D3D3D';
          } else if (isHome) {
            fillColor = '#FDF9F0'; // Warm cream
            strokeColor = '#E8A838';
          }

          return (
            <g
              key={zone.id}
              className={interactive ? 'cursor-pointer transition-all duration-200' : ''}
              onClick={() => interactive && onSelectZone && onSelectZone(zone.id)}
              role="button"
              tabIndex={interactive ? 0 : -1}
              aria-label={`Zone: ${zone.label}${isSelected ? ' (Selected)' : ''}`}
              onKeyDown={(e) => {
                if (interactive && onSelectZone && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onSelectZone(zone.id);
                }
              }}
            >
              {/* Zone Shape */}
              <path
                d={zone.d}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={isSelected ? '2.5' : '1.5'}
                strokeLinejoin="round"
                className="transition-colors duration-200 hover:fill-[#F4F9F2]"
              />

              {/* Zone Center Label */}
              <text
                x={zone.cx}
                y={zone.cy}
                textAnchor="middle"
                fontSize="9.5"
                fontFamily="Nunito, sans-serif"
                fontWeight={isSelected ? '800' : '700'}
                fill={textColor}
                className="pointer-events-none"
              >
                {zone.shortLabel}
              </text>

              {/* Home Base Indicator Badge */}
              {isHome && (
                <g transform={`translate(${zone.cx - 26}, ${zone.cy + 6})`}>
                  <rect width="52" height="12" rx="4" fill="#4F6B4A" />
                  <text
                    x="26"
                    y="8.5"
                    textAnchor="middle"
                    fontSize="6.5"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                    fontWeight="700"
                    fill="#FFFFFF"
                  >
                    HOME BASE
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Selected Zone Animated Pin Drop */}
        {activeDef && (
          <g
            transform={`translate(${activeDef.cx}, ${activeDef.cy - 16})`}
            filter="url(#pinShadow)"
            className="transition-transform duration-300 ease-out"
          >
            {/* Animated Pin Marker */}
            <path
              d="M 0 0 C -9 0 -14 -6 -14 -14 C -14 -24 0 -38 0 -38 C 0 -38 14 -24 14 -14 C 14 -6 9 0 0 0 Z"
              fill="#E8A838"
              stroke="#3D3D3D"
              strokeWidth="2"
            />
            {/* Inner Pin Dot */}
            <circle cx="0" cy="-14" r="5" fill="#FFFFFF" />
            <circle cx="0" cy="-14" r="2.5" fill="#4F6B4A" />

            {/* Ripple Pulse at Base */}
            <circle cx="0" cy="0" r="4" fill="#E8A838" opacity="0.6">
              <animate attributeName="r" values="3;10;3" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>
        )}
      </svg>

      {/* Map Legend Overlay */}
      <div className="mt-2 flex flex-wrap items-center justify-between text-xs text-[#5C5C5C] px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E8A838] border border-[#3D3D3D]" />
          <span>Selected Zone</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#4F6B4A]" />
          <span>Sarah's Central Hub</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-[#ABC4C1]" />
          <span>Colorado River</span>
        </div>
      </div>
    </div>
  );
};
