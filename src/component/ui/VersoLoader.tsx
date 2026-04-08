'use client';

import './VersoLoader.css';

const FRAME_COUNT = 25;
const ANIMATION_DURATION_S = 2.5; // approx 20fps for a relaxed dance pace

interface VersoLoaderProps {
  /** Display size in px (default: 64) */
  size?: number;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label (default: "Loading...") */
  label?: string;
  /** Show text label below animation */
  showLabel?: boolean;
}

export default function VersoLoader({
  size = 64,
  className = '',
  label = 'Loading...',
  showLabel = true,
}: VersoLoaderProps) {
  return (
    <div
      className={`verso-loader-container ${className}`}
      role="status"
      aria-label={label}
    >
      <div
        className="verso-loader"
        style={{
          '--verso-size': `${size}px`,
          '--verso-frames': FRAME_COUNT,
          '--verso-duration': `${ANIMATION_DURATION_S}s`,
        } as React.CSSProperties}
      />
      {showLabel && (
        <span className="verso-loader-label" aria-hidden="true">
          {label}
        </span>
      )}
    </div>
  );
}
