'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface WheelProps {
  participants: Array<{ id: string; name: string }>;
  onSpinComplete?: (selectedName: string) => void;
  disabled?: boolean;
}

// Christmas color palette for pie chart segments
const COLORS = [
  '#dc2626', // red
  '#ef4444', // red light
  '#b91c1c', // red dark
  '#16a34a', // green
  '#22c55e', // green light
  '#15803d', // green dark
  '#ffffff', // white
  '#fef2f2', // red very light
  '#dc2626', // red
  '#16a34a', // green
];

export default function Wheel({ participants, onSpinComplete, disabled = false }: WheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(disabled);
  const [rotation, setRotation] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  const handleSpin = () => {
    if (participants.length === 0 || isSpinning || hasSpun || disabled) return;
    setIsSpinning(true);
    setSelectedIndex(null);

    // Calculate random spin
    const fullRotations = 5 + Math.random() * 3; // 5-8 full rotations
    const randomSegment = Math.floor(Math.random() * participants.length);
    const segmentAngle = 360 / participants.length;
    
    // Calculate rotation so the selected segment ends at the top (red pointer)
    // Segments are drawn starting from -90 degrees (top in SVG coordinate system)
    // Each segment's center is at: -90 + (index + 0.5) * segmentAngle
    // The pointer is at the top (0 degrees in the rotated coordinate system)
    // After rotation R, segment center is at: -90 + (index + 0.5) * segmentAngle + R
    // We want this to equal 0 (top), so: -90 + (index + 0.5) * segmentAngle + R = 0
    // Therefore: R = 90 - (index + 0.5) * segmentAngle
    // But we want positive rotation, so: R = 360 + (90 - (index + 0.5) * segmentAngle)
    // = 450 - (index + 0.5) * segmentAngle
    // Segments are drawn starting from -90 degrees (top)
    // Segment center is at: -90 + (index + 0.5) * segmentAngle
    // After rotation R: -90 + (index + 0.5) * segmentAngle + R
    // We want this at 0 (top pointer), so: R = 90 - (index + 0.5) * segmentAngle
    // Since it's landing one behind, subtract one segment to compensate
    const segmentCenterAngle = (randomSegment + 0.5) * segmentAngle;
    const baseRotation = 90 - segmentCenterAngle;
    // Subtract one segment to align properly with pointer
    const adjustedRotation = baseRotation - segmentAngle;
    const finalRotation = fullRotations * 360 + (adjustedRotation + 360) % 360;

    // Animate the spin
    setRotation(finalRotation);

    // Determine selected segment after animation
    setTimeout(() => {
      setIsSpinning(false);
      setHasSpun(true);
      setSelectedIndex(randomSegment);
      
      if (onSpinComplete && participants[randomSegment]) {
        setTimeout(() => {
          onSpinComplete(participants[randomSegment].name);
        }, 500);
      }
    }, 3000); // Match animation duration
  };

  if (participants.length === 0) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">No participants available</p>
      </div>
    );
  }

  const segmentAngle = 360 / participants.length;
  const radius = 180;
  const centerX = 200;
  const centerY = 200;
  const innerRadius = 20; // Reduced center radius

  // Generate SVG path for each segment (with inner radius)
  const createSegmentPath = (index: number) => {
    const startAngle = (index * segmentAngle - 90) * (Math.PI / 180);
    const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);
    
    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);
    
    const x3 = centerX + innerRadius * Math.cos(endAngle);
    const y3 = centerY + innerRadius * Math.sin(endAngle);
    const x4 = centerX + innerRadius * Math.cos(startAngle);
    const y4 = centerY + innerRadius * Math.sin(startAngle);
    
    const largeArc = segmentAngle > 180 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  // Calculate text position for each segment
  const getTextPosition = (index: number) => {
    const angle = ((index + 0.5) * segmentAngle - 90) * (Math.PI / 180);
    const textRadius = radius * 0.65;
    const x = centerX + textRadius * Math.cos(angle);
    const y = centerY + textRadius * Math.sin(angle);
    return { x, y, angle: (angle * 180) / Math.PI + 90 };
  };

  return (
    <div className="w-full h-[500px] relative flex flex-col items-center justify-center">
      {/* Pointer indicator at the top - Christmas red */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-red-600 drop-shadow-lg" />
      </div>

      {/* Pie Chart Wheel */}
      <div className="relative" ref={wheelRef}>
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ 
            duration: 3, 
            ease: [0.17, 0.67, 0.83, 0.67] // Ease out cubic
          }}
          className="relative"
        >
          <svg width="400" height="400" viewBox="0 0 400 400" className="drop-shadow-2xl">
            {participants.map((participant, index) => {
              const isSelected = selectedIndex === index;
              const textPos = getTextPosition(index);
              const color = COLORS[index % COLORS.length];
              
              return (
                <g key={participant.id}>
                  <path
                    d={createSegmentPath(index)}
                    fill={isSelected ? '#fbbf24' : color}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className={isSelected ? 'drop-shadow-lg' : ''}
                    style={{
                      filter: isSelected ? 'brightness(1.2)' : 'none',
                      transition: 'all 0.3s ease',
                    }}
                  />
                  <text
                    x={textPos.x}
                    y={textPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="14"
                    fontWeight={isSelected ? 'bold' : 'normal'}
                    transform={`rotate(${textPos.angle}, ${textPos.x}, ${textPos.y})`}
                    style={{
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      filter: isSelected ? 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.8))' : 'none',
                    }}
                  >
                    {participant.name}
                  </text>
                </g>
              );
            })}
            {/* Center circle - reduced radius - Christmas themed */}
            <circle
              cx={centerX}
              cy={centerY}
              r="20"
              fill="#dc2626"
              stroke="#ffffff"
              strokeWidth="3"
            />
            {/* Small star in center */}
            <text
              x={centerX}
              y={centerY + 5}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="16"
              fill="#fbbf24"
            >
              ⭐
            </text>
          </svg>
        </motion.div>
      </div>

      {/* Spin Button - Christmas themed */}
      {!isSpinning && !hasSpun && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleSpin}
          disabled={disabled || participants.length === 0}
          className="mt-8 px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed disabled:border-gray-400 text-white font-bold rounded-lg shadow-lg transition-all transform hover:scale-105 active:scale-95 border-2 border-white"
        >
          🎄 Spin the Wheel! 🎄
        </motion.button>
      )}

      {isSpinning && (
        <div className="mt-8 px-8 py-3 bg-gray-400 text-white font-bold rounded-lg">
          Spinning...
        </div>
      )}

      {hasSpun && !isSpinning && (
        <div className="mt-8 px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-lg border-2 border-white shadow-lg">
          ✅ Complete! 🎉
        </div>
      )}
    </div>
  );
}
