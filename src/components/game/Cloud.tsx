'use client';
import React from 'react';

type CloudProps = {
  x: number;
  y: number;
  scale: number;
  opacity: number;
};

export const Cloud: React.FC<CloudProps> = ({ x, y, scale, opacity }) => {
  return (
    <div
      className="absolute"
      style={{
        left: x,
        top: y,
        transform: `scale(${scale})`,
        opacity: opacity,
        filter: 'blur(2px)',
        pointerEvents: 'none', // Ensure clouds don't interfere with clicks
      }}
    >
      <svg
        width="120"
        height="60"
        viewBox="0 0 120 60"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="30" cy="35" r="25" />
        <circle cx="60" cy="30" r="30" />
        <circle cx="90" cy="35" r="25" />
      </svg>
    </div>
  );
};

Cloud.displayName = 'Cloud';
