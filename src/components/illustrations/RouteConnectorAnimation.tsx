import React from 'react';
import { ZoneId } from '../../types';

interface Props {
  fromZone: ZoneId | string;
  toZone: ZoneId | string;
  driveTimeMin: number;
  bufferMin?: number;
  nextZone?: ZoneId | string;
  driveToNextMin?: number;
  className?: string;
}

export const RouteConnectorAnimation: React.FC<Props> = ({
  fromZone,
  toZone,
  driveTimeMin,
  bufferMin = 10,
  nextZone,
  driveToNextMin,
  className = 'w-full',
}) => {
  return (
    <div className={`p-4 rounded-xl bg-[#F0EDE6] border border-[#E5DFD5] ${className}`}>
      <div className="flex items-center justify-between text-xs text-[#5C5C5C] mb-2 font-medium">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#5C5C5C]" />
          <span>{fromZone}</span>
        </span>
        <span className="text-[#4F6B4A] font-semibold">
          {driveTimeMin} min drive + {bufferMin} min buffer
        </span>
        <span className="flex items-center gap-1 text-[#3D3D3D] font-bold">
          <span className="w-2 h-2 rounded-full bg-[#E8A838]" />
          <span>{toZone}</span>
        </span>
        {nextZone && (
          <span className="flex items-center gap-1">
            <span className="text-xs text-[#5C5C5C]">→ Next:</span>
            <span className="font-semibold text-[#5C5C5C]">{nextZone}</span>
          </span>
        )}
      </div>

      <div className="relative h-12 w-full overflow-hidden flex items-center">
        <svg viewBox="0 0 400 48" className="w-full h-12" fill="none">
          {/* Background Track Line */}
          <line
            x1="20"
            y1="24"
            x2="380"
            y2="24"
            stroke="#D5CFBE"
            strokeWidth="3"
            strokeDasharray="6 6"
            strokeLinecap="round"
          />

          {/* Start Point */}
          <circle cx="20" cy="24" r="6" fill="#5C5C5C" />
          <circle cx="20" cy="24" r="3" fill="#FAF7F2" />

          {/* Customer Destination Point */}
          <circle cx="200" cy="24" r="8" fill="#E8A838" stroke="#3D3D3D" strokeWidth="2" />
          <circle cx="200" cy="24" r="3" fill="#FFFFFF" />

          {/* Next Point (if present) */}
          {nextZone && (
            <>
              <circle cx="380" cy="24" r="6" fill="#4F6B4A" />
              <circle cx="380" cy="24" r="3" fill="#FAF7F2" />
            </>
          )}

          {/* Mini Van Moving along route */}
          <g className="van-anim-group">
            <g transform="translate(0, 8)">
              {/* Mini Van Silhouette */}
              <rect x="0" y="4" width="28" height="15" rx="3" fill="#FAF7F2" stroke="#3D3D3D" strokeWidth="1.5" />
              <path d="M 20 4 L 25 10 L 28 10 L 28 19 L 20 19 Z" fill="#E8A838" />
              {/* Tiny Wheels */}
              <circle cx="7" cy="19" r="3" fill="#3D3D3D" />
              <circle cx="21" cy="19" r="3" fill="#3D3D3D" />
            </g>
          </g>
        </svg>

        <style>{`
          @media (prefers-reduced-motion: no-preference) {
            .van-anim-group {
              animation: driveVanAlongTrack 4s linear infinite;
            }
          }
          @keyframes driveVanAlongTrack {
            0% {
              transform: translateX(10px);
            }
            50% {
              transform: translateX(180px);
            }
            100% {
              transform: translateX(350px);
            }
          }
        `}</style>
      </div>

      <div className="flex items-center justify-between text-[11px] text-[#5C5C5C] pt-1 border-t border-[#E5DFD5]">
        <span>Previous stop</span>
        <span className="text-[#4F6B4A] font-medium">Your requested location</span>
        {nextZone ? <span>{driveToNextMin ? `${driveToNextMin}m to next` : 'Next stop'}</span> : <span>Open route</span>}
      </div>
    </div>
  );
};
