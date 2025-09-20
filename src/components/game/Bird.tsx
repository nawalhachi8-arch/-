'use client';
import React from 'react';
import { BIRD_WIDTH_PERCENT, BIRD_HEIGHT_PERCENT, BIRD_START_X_PERCENT } from '@/lib/game-constants';

type BirdProps = {
  y: number;
  rotation: number;
  isFlapping: boolean;
};

export const Bird: React.FC<BirdProps> = ({ y, rotation, isFlapping }) => {
  return (
    <div
      className="absolute transition-transform duration-100"
      style={{
        top: y,
        left: `calc(${BIRD_START_X_PERCENT * 100}vw - (${BIRD_WIDTH_PERCENT * 100}vw / 2))`, 
        width: `${BIRD_WIDTH_PERCENT * 100}vw`,
        height: `${BIRD_HEIGHT_PERCENT * 100}vh`,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center',
      }}
    >
      <svg viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <g>
          {/* Beak */}
          <path d="M35 20 L38 22 L35 24 Z" fill="#F44336"/>
          
          {/* Body */}
          <path d="M22,10 C29,10 35,14 35,22 C35,30 29,34 22,34 C15,34 9,30 9,22 C9,14 15,10 22,10 Z" fill="#FFC107" stroke="#E65100" strokeWidth="1.5"/>

          {/* Wing */}
          <path
            className={`transition-transform duration-200 ease-in-out ${isFlapping ? 'rotate-[-30deg]' : 'rotate-[20deg]'}`}
            style={{ transformOrigin: '18px 22px' }}
            d="M18,15 C10,18 12,28 18,28 Q25,24 18,15"
            fill="#FFD54F"
            stroke="#E65100"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Eye */}
          <circle cx="28" cy="18" r="3" fill="white" />
          <circle cx="29" cy="18" r="1.5" fill="black" />

          {/* Tuft */}
          <path d="M22,10 C20,6 24,6 25,9" stroke="#E65100" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M25,10 C24,7 27,7 28,9" stroke="#E65100" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};

Bird.displayName = 'Bird';
