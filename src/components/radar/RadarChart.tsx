"use client";

import React, { useMemo } from 'react';
import { RadarItem, RadarConfig } from '@/app/lib/radar-types';
import { useRouter } from 'next/navigation';

interface RadarChartProps {
  items: RadarItem[];
  config: RadarConfig;
  activeFilters?: {
    quadrant?: number;
    ring?: number;
  };
}

export const RadarChart: React.FC<RadarChartProps> = ({ items, config, activeFilters }) => {
  const router = useRouter();
  const size = 600;
  const center = size / 2;
  const ringCount = config.rings.length;
  const quadrantCount = config.quadrants.length;
  
  const ringRadii = useMemo(() => {
    const maxRadius = center - 60;
    return config.rings.map((_, i) => (maxRadius / ringCount) * (i + 1));
  }, [center, ringCount, config.rings]);

  const blips = useMemo(() => {
    return items.map(item => {
      const baseAngle = (item.quadrantId * (2 * Math.PI)) / quadrantCount;
      const sliceWidth = (2 * Math.PI) / quadrantCount;
      const anglePadding = 0.25;
      
      const seed = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const randomAngle = baseAngle + anglePadding + (seed % 100 / 100) * (sliceWidth - 2 * anglePadding);
      
      const innerRadius = item.ringId === 0 ? 0 : ringRadii[item.ringId - 1];
      const outerRadius = ringRadii[item.ringId];
      const rPadding = 20;
      const randomRadius = innerRadius + rPadding + (seed * 13 % 100 / 100) * (outerRadius - innerRadius - 2 * rPadding);
      
      const isNew = item.createdAt > (Date.now() - 1000 * 60 * 60 * 24 * 14);
      const hasMoved = item.previousRingId !== undefined && item.previousRingId !== item.ringId;

      return {
        item,
        x: center + randomRadius * Math.cos(randomAngle),
        y: center + randomRadius * Math.sin(randomAngle),
        isNew,
        hasMoved
      };
    });
  }, [items, quadrantCount, ringRadii, center]);

  return (
    <div className="relative flex justify-center items-center overflow-visible">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="max-w-full h-auto overflow-visible">
        {/* Background Gradients/Glow */}
        <defs>
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={center} cy={center} r={ringRadii[ringCount-1]} fill="url(#radarGlow)" />

        {/* Radar Rings */}
        {ringRadii.slice().reverse().map((radius, i) => (
          <circle
            key={`ring-${i}`}
            cx={center}
            cy={center}
            r={radius}
            className="fill-none stroke-secondary/50 stroke-1"
          />
        ))}

        {/* Quadrant Lines */}
        <line x1={center - ringRadii[ringCount - 1]} y1={center} x2={center + ringRadii[ringCount - 1]} y2={center} className="stroke-secondary/50 stroke-1" />
        <line x1={center} y1={center - ringRadii[ringCount - 1]} x2={center} y2={center + ringRadii[ringCount - 1]} className="stroke-secondary/50 stroke-1" />

        {/* Ring Labels */}
        {config.rings.map((ring, i) => (
          <text
            key={`label-ring-${i}`}
            x={center}
            y={center - ringRadii[i] + 15}
            textAnchor="middle"
            className="text-[9px] font-black uppercase tracking-[0.2em] fill-muted-foreground/60 select-none pointer-events-none"
          >
            {ring}
          </text>
        ))}

        {/* Quadrant Labels */}
        {config.quadrants.map((quad, i) => {
          const angle = (i * (2 * Math.PI)) / quadrantCount + (Math.PI / quadrantCount);
          const r = ringRadii[ringCount - 1] + 35;
          return (
            <text
              key={`label-quad-${i}`}
              x={center + r * Math.cos(angle)}
              y={center + r * Math.sin(angle)}
              textAnchor="middle"
              className="text-[10px] font-black uppercase tracking-[0.15em] fill-primary select-none pointer-events-none"
            >
              {quad}
            </text>
          );
        })}

        {/* Blips */}
        {blips.map(({ item, x, y, isNew, hasMoved }) => {
          const isActive = (activeFilters?.quadrant === undefined || activeFilters.quadrant === item.quadrantId) &&
                         (activeFilters?.ring === undefined || activeFilters.ring === item.ringId);
          
          return (
            <g 
              key={item.id} 
              className={`group cursor-pointer transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-10'}`}
              onClick={() => router.push(`/items/${item.id}`)}
            >
              {isNew && (
                <circle
                  cx={x}
                  cy={y}
                  r="12"
                  className="fill-primary/20 animate-pulse"
                />
              )}
              {hasMoved && (
                <path
                  d={`M ${x-10} ${y-10} L ${x-4} ${y-4} M ${x-10} ${y-4} L ${x-10} ${y-10} L ${x-4} ${y-10}`}
                  className="stroke-blue-500 stroke-2 fill-none"
                />
              )}
              <circle
                cx={x}
                cy={y}
                r="7"
                className={`transition-all duration-300 ${
                  item.ringId === 3 ? 'fill-muted stroke-muted-foreground' : 'fill-primary stroke-white'
                } stroke-2 group-hover:scale-150 group-hover:fill-primary-foreground group-hover:stroke-primary`}
              />
              <text
                x={x}
                y={y - 14}
                textAnchor="middle"
                className="text-[10px] font-bold fill-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-white px-2"
              >
                {item.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
