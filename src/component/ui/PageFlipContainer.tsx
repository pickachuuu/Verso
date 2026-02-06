'use client';

import { motion } from 'motion/react';
import { ReactNode, useRef, useLayoutEffect, useState, useCallback } from 'react';

export type ViewType = 'cover' | 'toc' | 'page';
export type PageFlipVariant = 'notebook' | 'exam';

interface PageFlipContainerProps {
  currentView: ViewType;
  currentPageIndex: number | null;
  totalPages: number;
  cover: ReactNode;
  toc: ReactNode;
  pageContent: ReactNode;
  previousContent?: ReactNode;
  theme?: 'light' | 'dark';
  variant?: PageFlipVariant;
}

export default function PageFlipContainer({
  currentView,
  currentPageIndex,
  totalPages,
  cover,
  toc,
  pageContent,
  previousContent,
  theme = 'light',
  variant = 'notebook',
}: PageFlipContainerProps) {
  const isDark = theme === 'dark';
  const isExam = variant === 'exam';

  const getPosition = (view: ViewType, pageIdx: number | null): number => {
    if (view === 'cover') return 0;
    if (view === 'toc') return 1;
    return 2 + (pageIdx ?? 0);
  };

  const currentPosition = getPosition(currentView, currentPageIndex);
  const prevPositionRef = useRef(currentPosition);
  const animIdRef = useRef(0);

  // Store what to display - this is the KEY to preventing jitter
  const [displayState, setDisplayState] = useState<{
    baseContent: ReactNode;
    flip: {
      id: number;
      direction: 'forward' | 'backward';
      frontContent: ReactNode;
      targetContent: ReactNode; // Content to show after animation completes
    } | null;
  }>({
    baseContent: currentView === 'cover' ? cover : currentView === 'toc' ? toc : pageContent,
    flip: null,
  });

  const getCurrentContent = () => {
    if (currentView === 'cover') return cover;
    if (currentView === 'toc') return toc;
    return pageContent;
  };

  // Handle animation complete - update base and clear flip atomically
  const handleAnimationComplete = useCallback(() => {
    setDisplayState(prev => {
      if (!prev.flip) return prev;
      return {
        baseContent: prev.flip.targetContent,
        flip: null,
      };
    });
  }, []);

  // useLayoutEffect runs BEFORE browser paint - prevents visual jitter
  // Only handles position/view changes that require animation
  useLayoutEffect(() => {
    if (currentPosition !== prevPositionRef.current) {
      // Position changed - trigger flip animation
      const dir = currentPosition > prevPositionRef.current ? 'forward' : 'backward';
      animIdRef.current++;

      const newContent = getCurrentContent();
      const oldContent = previousContent;

      // Set everything in ONE state update - no intermediate renders
      setDisplayState({
        baseContent: dir === 'forward' ? newContent : oldContent,
        flip: {
          id: animIdRef.current,
          direction: dir,
          frontContent: dir === 'forward' ? oldContent : newContent,
          targetContent: newContent,
        },
      });

      prevPositionRef.current = currentPosition;
    }
  }, [currentPosition, previousContent]);

  // Track if position is about to change (before useLayoutEffect runs)
  const positionChanged = currentPosition !== prevPositionRef.current;

  // Derive base content directly when not animating
  // If position just changed, keep showing previous content until animation starts
  const baseContent = displayState.flip
    ? displayState.baseContent
    : positionChanged
      ? previousContent
      : getCurrentContent();

  // Colors
  const paperColor = isDark ? '#1e1e2e' : '#fffef8';
  const paperBg = isDark
    ? 'linear-gradient(135deg, #2a2a3a 0%, #1e1e2e 100%)'
    : 'linear-gradient(135deg, #fffef8 0%, #f5f5f0 100%)';
  const lineColor = isDark ? 'rgba(157,123,224,0.15)' : 'rgba(95,108,175,0.12)';
  const marginColor = isDark ? 'rgba(180,100,100,0.2)' : 'rgba(220,80,80,0.25)';

  // For exam mode: no left stack on first page (toc), and fewer visual stacks overall
  const leftCount = isExam
    ? (currentView === 'page' && currentPageIndex !== null ? Math.min(currentPageIndex + 1, 3) : 0)
    : Math.min(currentPosition > 0 ? currentPosition : 0, 5);
  const rightCount = Math.min(Math.max(0, 2 + totalPages - currentPosition - 1), 4);

  // All ruled-page visuals as a flat background stack (margin + ruled lines + paper).
  // The margin uses a vertical gradient (matching NotebookPage's fade at top/bottom)
  // constrained to 2px width via backgroundSize, instead of a solid horizontal gradient.
  const ruledPageBackground: React.CSSProperties = !isExam ? {
    backgroundImage: [
      `linear-gradient(180deg, transparent 0%, ${marginColor} 5%, ${marginColor} 95%, transparent 100%)`,
      `repeating-linear-gradient(0deg, transparent, transparent 31px, ${lineColor} 31px, ${lineColor} 32px)`,
      paperBg,
    ].join(', '),
    backgroundSize: '2px 100%, 100% 32px, 100% 100%',
    backgroundPosition: '71px 0, 0 24px, 0 0',
    backgroundRepeat: 'no-repeat, repeat, no-repeat',
  } : { background: paperBg };

  // Pre-mirrored version for the back face of the flipping page.
  // The back face has `transform: rotateY(180deg)` (default origin = center) which
  // mirrors content horizontally. To compensate, we position the margin from the
  // RIGHT side so that after the center-mirror it lands at the same visual position
  // as the left stack's margin.
  const backfaceRuledBackground: React.CSSProperties = !isExam ? {
    backgroundImage: [
      `linear-gradient(180deg, transparent 0%, ${marginColor} 5%, ${marginColor} 95%, transparent 100%)`,
      `repeating-linear-gradient(0deg, transparent, transparent 31px, ${lineColor} 31px, ${lineColor} 32px)`,
      paperBg,
    ].join(', '),
    backgroundSize: '2px 100%, 100% 32px, 100% 100%',
    backgroundPosition: 'calc(100% - 73px) 0, 0 24px, 0 0',
    backgroundRepeat: 'no-repeat, repeat, no-repeat',
  } : { background: paperBg };

  return (
    <div className="w-full h-full relative" style={{ perspective: '2000px' }}>
      {/* Left stack */}
      {leftCount > 0 && [...Array(leftCount)].map((_, i) => {
        // i=0 is the back of the cover (stays plain), i>0 are notebook page backs (ruled lines)
        const isPageBack = i > 0;

        return (
          <div
            key={`l${i}`}
            className="absolute inset-0 rounded-lg overflow-hidden"
            style={{
              transform: 'rotateY(-180deg)',
              transformOrigin: 'left center',
              left: i * 2,
              top: i,
              zIndex: i,
              ...(isPageBack ? ruledPageBackground : { background: paperBg }),
            }}
          />
        );
      })}

      {/* Right stack */}
      {rightCount > 0 && [...Array(rightCount)].map((_, i) => (
        <div
          key={`r${i}`}
          className="absolute inset-0 rounded-lg"
          style={{
            top: (i + 1) * 2,
            left: (i + 1) * 2,
            background: paperBg,
            zIndex: -(i + 1),
          }}
        />
      ))}

      {/* Base layer - content controlled by displayState during animation, direct otherwise */}
      {/* Note: overflow-visible when on cover to allow color picker dropdown to show */}
      <div
        className={`absolute inset-0 rounded-lg ${currentView === 'cover' ? 'overflow-visible' : 'overflow-hidden'}`}
        style={{ zIndex: 10, backgroundColor: currentView === 'cover' ? 'transparent' : paperColor }}
      >
        {baseContent}
      </div>

      {/* Flipping page */}
      {displayState.flip && (
        <motion.div
          key={displayState.flip.id}
          className="absolute inset-0"
          style={{
            transformStyle: 'preserve-3d',
            transformOrigin: 'left center',
            zIndex: 50,
          }}
          initial={{ rotateY: displayState.flip.direction === 'forward' ? 0 : -180 }}
          animate={{ rotateY: displayState.flip.direction === 'forward' ? -180 : 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          onAnimationComplete={handleAnimationComplete}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-lg overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              backgroundColor: paperColor,
            }}
          >
            {displayState.flip.frontContent}
          </div>

          {/* Back — all visuals baked into background layers, zero children.
              Margin gradient is pre-mirrored (-90deg) to compensate for the
              rotateY(180deg) center-mirror so it lines up with the left stack. */}
          <div
            className="absolute inset-0 rounded-lg"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              ...backfaceRuledBackground,
            }}
          />
        </motion.div>
      )}

      {/* Spine */}
      {currentView !== 'cover' && (
        <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l" style={{
          background: isDark
            ? 'linear-gradient(90deg, rgba(50,50,60,0.9), rgba(40,40,50,0.5))'
            : 'linear-gradient(90deg, rgba(180,160,140,0.9), rgba(200,180,160,0.5))',
          zIndex: 60,
        }} />
      )}
    </div>
  );
}
