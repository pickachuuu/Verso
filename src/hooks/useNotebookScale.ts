'use client';

import { useRef, useState, useEffect, useCallback, RefObject } from 'react';

/** Canonical notebook page dimensions (in px) */
export const NOTEBOOK_WIDTH = 896;   // 56rem
export const NOTEBOOK_HEIGHT = 1144; // 35 lines × 32px + 24px offset

/**
 * Measures the available space inside `containerRef` and returns a scale factor
 * that fits the canonical notebook size (896 × 1144) within that space.
 *
 * The scale is capped at 1 so the notebook never grows beyond its natural size.
 *
 * When `widthOnly` is true, the scale is based solely on available width,
 * ignoring the container height. This is useful on mobile where we want
 * the notebook to fill the width and let the page scroll vertically.
 */
export function useNotebookScale(
  containerRef: RefObject<HTMLDivElement | null>,
  options?: { widthOnly?: boolean },
) {
  const [scale, setScale] = useState(1);
  const widthOnly = options?.widthOnly ?? false;

  const recalc = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const availableWidth = el.clientWidth;
    const availableHeight = el.clientHeight;

    const s = widthOnly
      ? Math.min(availableWidth / NOTEBOOK_WIDTH, 1)
      : Math.min(
          availableWidth / NOTEBOOK_WIDTH,
          availableHeight / NOTEBOOK_HEIGHT,
          1, // never scale up
        );

    setScale(s);
  }, [containerRef, widthOnly]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Initial measurement
    recalc();

    const ro = new ResizeObserver(() => recalc());
    ro.observe(el);

    return () => ro.disconnect();
  }, [containerRef, recalc]);

  return scale;
}
