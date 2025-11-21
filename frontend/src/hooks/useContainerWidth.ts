import { useState, useEffect, useRef, RefObject } from 'react';

interface UseContainerWidthOptions {
  debounce?: number;
  initialWidth?: number;
  threshold?: number; // Minimum width change to trigger update (avoids sub-pixel changes)
}

/**
 * Custom hook to measure and track container width with resize handling
 *
 * @param options Configuration options
 * @param options.debounce - Debounce delay in ms (default: 150)
 * @param options.initialWidth - Initial width before first measurement
 * @param options.threshold - Minimum width change in px to trigger update (default: 10)
 * @returns Tuple of [containerRef, width, isReady]
 *
 * @example
 * ```typescript
 * const [containerRef, containerWidth, isReady] = useContainerWidth<HTMLDivElement>({
 *   debounce: 150,
 *   threshold: 10,
 * });
 *
 * return (
 *   <div ref={containerRef}>
 *     {isReady && <GridLayout width={containerWidth} />}
 *   </div>
 * );
 * ```
 */
export function useContainerWidth<T extends HTMLElement = HTMLDivElement>(
  options: UseContainerWidthOptions = {}
): [RefObject<T>, number, boolean] {
  const { debounce = 150, initialWidth, threshold = 10 } = options;

  const containerRef = useRef<T>(null);
  const [width, setWidth] = useState<number>(() => {
    // Smart initial value based on viewport to avoid flash of wrong layout
    if (initialWidth !== undefined) return initialWidth;
    if (typeof window !== 'undefined') {
      // Estimate content width accounting for typical padding
      return Math.min(window.innerWidth - 48, 1200);
    }
    return 1200;
  });
  const [isReady, setIsReady] = useState(false);

  // Track previous width to implement threshold
  const previousWidthRef = useRef<number>(width);

  useEffect(() => {
    let isMounted = true; // Track mount state to prevent updates after unmount

    const updateWidth = () => {
      if (!isMounted || !containerRef.current) return;

      const newWidth = containerRef.current.offsetWidth;
      const previousWidth = previousWidthRef.current;

      // Only update if change exceeds threshold (avoids sub-pixel jitter)
      if (Math.abs(newWidth - previousWidth) > threshold) {
        previousWidthRef.current = newWidth;
        setWidth(newWidth);
        setIsReady(true);
      } else if (!isReady) {
        // First measurement always sets isReady, and update previousWidth even if below threshold
        previousWidthRef.current = newWidth;
        setIsReady(true);
      }
    };

    // Initial measurement
    updateWidth();

    if (debounce > 0) {
      // Debounced resize handler
      let timeoutId: ReturnType<typeof setTimeout>;
      const debouncedUpdate = () => {
        clearTimeout(timeoutId);
        if (isMounted) {
          // Only set new timeout if still mounted
          timeoutId = setTimeout(updateWidth, debounce);
        }
      };

      window.addEventListener('resize', debouncedUpdate);

      return () => {
        isMounted = false; // Mark as unmounted
        clearTimeout(timeoutId);
        window.removeEventListener('resize', debouncedUpdate);
      };
    } else {
      // No debouncing
      window.addEventListener('resize', updateWidth);
      return () => {
        isMounted = false;
        window.removeEventListener('resize', updateWidth);
      };
    }
  }, [debounce, threshold]); // Removed isReady from dependencies - it's only used for internal logic

  return [containerRef, width, isReady];
}
