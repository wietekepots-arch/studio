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
    const maxRadius = center - 80;
    return config.rings.map((_, i) => (maxRadius / ringCount) * (i + 1));
  }, [center, ringCount, config.rings]);

  const blips = useMemo(() => {
    return items.map(item => {
      // Deterministic placement based on item ID
      const baseAngle = (item.quadrantId * (2 * Math.PI)) / quadrantCount;
      const sliceWidth = (2 * Math.PI) / quadrantCount;
      const anglePadding = 0.3;
      
      const seed = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const randomAngle = baseAngle + anglePadding + ((seed * 17) % 100 / 100) * (sliceWidth - 2 * anglePadding);
      
      const innerRadius = item.ringId === 0 ? 0 : ringRadii[item.ringId - 1];
      const outerRadius = ringRadii[item.ringId];
      const rPadding = 25;
      const randomRadius = innerRadius + rPadding + ((seed * 31) % 100 / 100) * (outerRadius - innerRadius - 2 * rPadding);
      
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
    <div className="relative flex justify-center items-center overflow-visible select-none">
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`} 
        className="max-w-full h-auto overflow-visible touch-none"
      >
        <defs>
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Background Glow */}
        <circle cx={center} cy={center} r={ringRadii[ringCount-1] + 20} fill="url(#radarGlow)" />

        {/* Concentric Radar Rings */}
        {ringRadii.slice().reverse().map((radius, i) => (
          <circle
            key={`ring-${i}`}
            cx={center}
            cy={center}
            r={radius}
            className="fill-none stroke-foreground/10 stroke-[1.5px]"
          />
        ))}

        {/* Quadrant Partition Lines */}
        <line x1={center - ringRadii[ringCount - 1]} y1={center} x2={center + ringRadii[ringCount - 1]} y2={center} className="stroke-foreground/5 stroke-[1px]" />
        <line x1={center} y1={center - ringRadii[ringCount - 1]} x2={center} y2={center + ringRadii[ringCount - 1]} className="stroke-foreground/5 stroke-[1px]" />

        {/* Ring Maturity Labels */}
        {config.rings.map((ring, i) => (
          <text
            key={`label-ring-${i}`}
            x={center}
            y={center - ringRadii[i] + 16}
            textAnchor="middle"
            className="text-[9px] font-black uppercase tracking-[0.3em] fill-muted-foreground/60 select-none pointer-events-none"
          >
            {ring}
          </text>
        ))}

        {/* Quadrant Category Labels */}
        {config.quadrants.map((quad, i) => {
          const angle = (i * (2 * Math.PI)) / quadrantCount + (Math.PI / quadrantCount);
          const r = ringRadii[ringCount - 1] + 60;
          return (
            <text
              key={`label-quad-${i}`}
              x={center + r * Math.cos(angle)}
              y={center + r * Math.sin(angle)}
              textAnchor="middle"
              className="text-[10px] font-black uppercase tracking-[0.25em] fill-primary select-none pointer-events-none"
            >
              {quad}
            </text>
          );
        })}

        {/* Individual Tool Blips */}
        {blips.map(({ item, x, y, isNew, hasMoved }) => {
          const isActive = (activeFilters?.quadrant === undefined || activeFilters.quadrant === item.quadrantId) &&
                         (activeFilters?.ring === undefined || activeFilters.ring === item.ringId);
          
          const textWidth = item.name.length * 7;
          
          return (
            <g 
              key={item.id} 
              className={`group cursor-pointer transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-10'}`}
              onClick={() => router.push(`/items/${item.id}`)}
            >
              {/* Pulse effect for new items */}
              {isNew && (
                <circle
                  cx={x}
                  cy={y}
                  r="14"
                  className="fill-primary/20 animate-pulse pointer-events-none"
                />
              )}
              
              {/* Movement indicator */}
              {hasMoved && (
                <path
                  d={`M ${x-12} ${y-12} L ${x-6} ${y-6} M ${x-12} ${y-6} L ${x-12} ${y-12} L ${x-6} ${y-12}`}
                  className="stroke-blue-500 stroke-2 fill-none pointer-events-none"
                />
              )}

              {/* The actual blip circle - isolated scaling with transform-box fix */}
              <circle
                cx={x}
                cy={y}
                r="8"
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                className={`transition-all duration-300 transform-gpu ${
                  item.ringId === 3 ? 'fill-muted stroke-muted-foreground' : 'fill-primary stroke-white'
                } stroke-2 group-hover:scale-[1.4] group-hover:fill-primary-foreground group-hover:stroke-primary`}
              />
              
              {/* Tool Name Tooltip */}
              <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <rect 
                  x={x - (textWidth / 2) - 8} 
                  y={y - 36} 
                  width={textWidth + 16} 
                  height="22" 
                  rx="11" 
                  className="fill-white shadow-lg stroke-primary/10 stroke-1"
                />
                <text
                  x={x}
                  y={y - 21}
                  textAnchor="middle"
                  className="text-[10px] font-black uppercase fill-primary tracking-wider"
                >
                  {item.name}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
