import React from 'react';

const Gauge = ({ min, max, value }) => {
  const width = 100;
  const height = 30;
  const padding = 15;
  const barHeight = 6;

  // Calculate position of the pointer
function calculateValuePosition(min, max, value, width, padding) {
    console.log('Value:', value);
    value = Math.max(Math.min(value, max), min);
    return Math.round(((value - min) / (max - min)) * (width - 2 * padding));
}

 // Function to generate a random 8-character string
 function generateRandomId() {
    return Math.random().toString(36).substring(2, 10);
  }

const valuePosition = calculateValuePosition(min, max, value, width, padding);
const maskId = `valueMask${generateRandomId()}`;

console.log('Value position:', valuePosition);
  
  return (
    <svg width={width} height={height} className="gauge">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#22c55e' }} />  {/* green-500 */}
          <stop offset="50%" style={{ stopColor: '#eab308' }} />  {/* yellow-500 */}
          <stop offset="100%" style={{ stopColor: '#ef4444' }} />  {/* red-500 */}
        </linearGradient>
        <mask id={maskId}>
          <rect x={padding} y={(height - barHeight) / 2} width={valuePosition} height={barHeight} fill="white" /> 
        </mask>
      </defs>

      {/* Gray background bar */}
      <rect
        x={padding}
        y={(height - barHeight) / 2}
        width={width - 2 * padding}
        height={barHeight}
        rx={barHeight / 2}
        fill="#4B5563"  // gray-600
      />

      {/* Gradient bar with mask */}
      <rect
        x={padding}
        y={(height - barHeight) / 2}
        width={width - 2 * padding}
        height={barHeight}
        rx={barHeight / 2}
        fill="url(#gradient)"
        mask={`url(#${maskId})`}
      />

      {/* Min label */}
      {/* <text
        x={padding}
        y={height - 2}
        textAnchor="middle"
        fontSize="10"
        fill="#9CA3AF"  // gray-400
    >
      {valuePosition.toFixed(1)}
    </text> */}

    {/* Max label */}
      {/* <text
        x={width - padding}
        y={height - 2}
        textAnchor="middle"
        fontSize="10"
        fill="#9CA3AF"  // gray-400
      >
        {max}
      </text> */}

      {/* Value pointer */}
      <path
        d={`M ${padding + valuePosition} ${(height - barHeight) / 2 - 2} 
            L ${padding + valuePosition + 4} ${(height - barHeight) / 2 - 6}
            L ${padding + valuePosition - 4} ${(height - barHeight) / 2 - 6} Z`}
        fill="white"
      />
    </svg>
  );
};

export default Gauge;