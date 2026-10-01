import React from 'react';

interface Props {
  className?: string;
  species: 'dog' | 'cat';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
}

export const PetSilhouette: React.FC<Props> = ({
  className = 'w-10 h-10',
  species,
  active = false,
}) => {
  const fillColor = active ? '#4F6B4A' : '#5C5C5C';
  const accentColor = active ? '#E8A838' : '#A8BFA0';

  if (species === 'dog') {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Dog Silhouette"
      >
        {/* Sitting Dog Silhouette */}
        <path
          d="M 38 32
             C 38 24 44 18 52 18
             C 58 18 64 22 66 28
             C 72 28 78 32 78 38
             C 78 44 74 48 68 49
             C 66 54 64 62 65 72
             C 66 82 72 86 74 88
             C 74 89 72 90 68 90
             C 60 90 58 84 56 78
             L 54 88
             C 54 90 50 90 48 90
             C 45 90 44 86 44 78
             L 42 66
             C 38 72 32 80 28 88
             C 26 90 22 90 20 89
             C 18 86 20 82 24 74
             C 28 66 32 58 34 50
             C 35 44 36 38 38 32 Z"
          fill={fillColor}
        />
        {/* Dog Ear */}
        <path
          d="M 46 22
             C 42 22 36 28 35 36
             C 34 42 38 44 41 42
             C 44 38 46 30 46 22 Z"
          fill={accentColor}
        />
        {/* Collar & Tag */}
        <path
          d="M 44 47 C 49 50 59 50 64 47 L 65 50 C 60 53 48 53 43 50 Z"
          fill={accentColor}
        />
        <circle cx="54" cy="54" r="3.5" fill="#E8A838" />
        {/* Wagging tail */}
        <path
          d="M 28 82 C 24 78 18 72 15 62 C 14 58 17 56 19 59 C 22 65 26 73 30 78 Z"
          fill={fillColor}
        />
      </svg>
    );
  }

  // Playful Cat Silhouette
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Cat Silhouette"
    >
      {/* Upright Alert Ears */}
      <path d="M 44 24 L 40 10 L 52 18 Z" fill={fillColor} />
      <path d="M 60 18 L 72 10 L 68 24 Z" fill={fillColor} />
      <path d="M 43 21 L 42 14 L 49 19 Z" fill={accentColor} />
      <path d="M 63 19 L 70 14 L 67 21 Z" fill={accentColor} />

      {/* Cat Head */}
      <ellipse cx="56" cy="28" rx="14" ry="12" fill={fillColor} />

      {/* Body & Front Paws */}
      <path
        d="M 48 38
           C 42 46 40 60 41 75
           L 41 88
           C 41 90 46 90 48 90
           C 51 90 52 86 52 80
           L 55 88
           C 55 90 59 90 61 90
           C 64 90 65 86 65 78
           C 65 65 67 52 70 44
           C 68 38 62 36 56 36
           C 52 36 49 37 48 38 Z"
        fill={fillColor}
      />

      {/* Cat Collar */}
      <path
        d="M 46 37 C 52 40 60 40 66 37 L 66 39 C 60 42 52 42 46 39 Z"
        fill={accentColor}
      />
      <circle cx="56" cy="43" r="2.5" fill="#E8A838" />

      {/* Curled High Cat Tail */}
      <path
        d="M 41 82
           C 36 84 28 84 24 76
           C 20 68 22 55 25 45
           C 27 38 32 34 35 38
           C 37 41 33 46 31 52
           C 28 60 27 68 30 73
           C 33 77 38 78 42 77 Z"
        fill={fillColor}
      />
    </svg>
  );
};
