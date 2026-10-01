import React from 'react';
import { motion } from 'motion/react';
import { APP_IMAGES } from '../../engine/constants';
import { Sparkles, MapPin } from 'lucide-react';

interface RealisticSpaVanProps {
  isDriving?: boolean;
  className?: string;
  showBadges?: boolean;
}

export const RealisticSpaVan: React.FC<RealisticSpaVanProps> = ({
  isDriving = false,
  className = '',
  showBadges = true,
}) => {
  return (
    <div className={`relative overflow-hidden w-full max-w-lg mx-auto ${className}`}>
      <motion.div
        animate={
          isDriving
            ? {
                x: [0, 40, 600],
                opacity: [1, 1, 0],
                transition: {
                  duration: 1.2,
                  ease: [0.4, 0, 0.2, 1],
                },
              }
            : {
                y: [0, -2, 0],
                transition: {
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }
        }
        className="relative"
      >
        {/* Realistic Sprinter Mobile Spa Van Image Container */}
        <div className="relative rounded-2xl overflow-hidden shadow-md border border-[#D5CFBE]/60 bg-gradient-to-b from-[#F5F2EC] to-[#FAF7F2]">
          <img
            src={APP_IMAGES.realisticVan}
            alt="Paws & Routes Mercedes Sprinter Mobile Pet Spa Van"
            className="w-full h-auto object-cover object-center max-h-56 select-none"
            onError={(e) => {
              // Graceful fallback to hero van if path needs fallback
              (e.target as HTMLImageElement).src = APP_IMAGES.heroVan;
            }}
          />

          {/* Luxury Badge Overlays */}
          {showBadges && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#FAF7F2]/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#D5CFBE] text-[11px] font-bold text-[#4F6B4A] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#4F6B4A] animate-ping" />
              <span>Mercedes Sprinter · Mobile Pet Spa</span>
            </div>
          )}

          {/* Live Climate-Control & Water Tank specs indicator */}
          {showBadges && (
            <div className="absolute bottom-2.5 right-3 hidden sm:flex items-center gap-2 bg-[#3D3D3D]/85 backdrop-blur-md px-2.5 py-0.5 rounded-lg text-[10px] text-white font-medium">
              <span>Roof A/C Climate Control</span>
              <span>•</span>
              <span>Warm Hydro-Bath Onboard</span>
            </div>
          )}
        </div>

        {/* Dynamic Road Shadow with driving bounce */}
        <div className="w-[85%] h-3 mx-auto mt-[-4px] bg-black/10 blur-sm rounded-full" />
      </motion.div>
    </div>
  );
};
