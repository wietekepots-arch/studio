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
    const maxRadius = center - 40;
    return config.rings.map((_, i) => (maxRadius / ringCount) * (i + 1));
  }, [center, ringCount, config.rings]);

  // Generate deterministic but spread out positions for blips
  const blips = useMemo(() => {
    return items.map(item => {
      // Base quadrant angle (0, 90, 180, 270 degrees in radians)
      const baseAngle = (item.quadrantId * (2 * Math.PI)) / quadrantCount;
      
      // Random offset within the quadrant segment (slice is 90 deg wide)
      const sliceWidth = (2 * Math.PI) / quadrantCount;
      const anglePadding = 0.2;
      
      // Use item ID to seed a pseudo-random value for stability
      const seed = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const randomAngle = baseAngle + anglePadding + (seed % 100 / 100) * (sliceWidth - 2 * anglePadding);
      
      // Radius calculation based on ring
      const innerRadius = item.ringId === 0 ? 0 : ringRadii[item.ringId - 1];
      const outerRadius = ringRadii[item.ringId];
      const rPadding = 15;
      const randomRadius = innerRadius + rPadding + (seed * 13 % 100 / 100) * (outerRadius - innerRadius - 2 * rPadding);
      
      return {
        item,
        x: center + randomRadius * Math.cos(randomAngle),
        y: center + randomRadius * Math.sin(randomAngle),
      };
    });
  }, [items, quadrantCount, ringRadii, center]);

  return (
    <div className="relative flex justify-center items-center bg-card rounded-xl shadow-lg p-8 overflow-hidden">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="max-w-full h-auto">
        {/* Radar Rings */}
        {ringRadii.slice().reverse().map((radius, i) => (
          <circle
            key={`ring-${i}`}
            cx={center}
            cy={center}
            r={radius}
            className="fill-none stroke-border stroke-1"
          />
        ))}

        {/* Quadrant Lines */}
        <line x1={center - ringRadii[ringCount - 1]} y1={center} x2={center + ringRadii[ringCount - 1]} y2={center} className="stroke-border stroke-1" />
        <line x1={center} y1={center - ringRadii[ringCount - 1]} x2={center} y2={center + ringRadii[ringCount - 1]} className="stroke-border stroke-1" />

        {/* Ring Labels */}
        {config.rings.map((ring, i) => (
          <text
            key={`label-ring-${i}`}
            x={center}
            y={center - ringRadii[i] + 15}
            textAnchor="middle"
            className="text-[10px] font-bold uppercase tracking-widest fill-muted-foreground select-none pointer-events-none"
          >
            {ring}
          </text>
        ))}

        {/* Quadrant Labels */}
        {config.quadrants.map((quad, i) => {
          const angle = (i * (2 * Math.PI)) / quadrantCount + (Math.PI / quadrantCount);
          const r = ringRadii[ringCount - 1] + 25;
          return (
            <text
              key={`label-quad-${i}`}
              x={center + r * Math.cos(angle)}
              y={center + r * Math.sin(angle)}
              textAnchor="middle"
              className="text-xs font-semibold fill-primary select-none pointer-events-none"
            >
              {quad}
            </text>
          );
        })}

        {/* Blips */}
        {blips.map(({ item, x, y }) => {
          const isActive = (activeFilters?.quadrant === undefined || activeFilters.quadrant === item.quadrantId) &&
                         (activeFilters?.ring === undefined || activeFilters.ring === item.ringId);
          
          return (
            <g 
              key={item.id} 
              className={`cursor-pointer transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-20'}`}
              onClick={() => router.push(`/items/${item.id}`)}
            >
              <circle
                cx={x}
                cy={y}
                r="6"
                className="fill-accent stroke-white stroke-2 hover:fill-primary transition-colors"
              />
              <text
                x={x}
                y={y - 10}
                textAnchor="middle"
                className="text-[9px] font-bold fill-foreground opacity-0 group-hover:opacity-100 pointer-events-none"
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