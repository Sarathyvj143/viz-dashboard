import { useEffect, useRef } from 'react';

/**
 * Global lock counter to coordinate scroll locking across multiple components
 * This prevents conflicts when multiple components (Modal, Sidebar, etc.)
 * need to lock body scroll simultaneously
 */
let lockCount = 0;

/**
 * Custom hook to lock/unlock body scroll in a coordinated way
 *
 * Multiple components can call this hook simultaneously, and body scroll
 * will only be restored when ALL components have released their locks.
 *
 * @param isLocked - Whether this component needs scroll locked
 *
 * @example
 * ```typescript
 * // In Modal component
 * useBodyScrollLock(isOpen);
 *
 * // In Sidebar component
 * useBodyScrollLock(isMobileMenuOpen);
 *
 * // Body scroll is locked as long as at least one is true
 * ```
 */
export function useBodyScrollLock(isLocked: boolean) {
  const wasLocked = useRef(false);

  useEffect(() => {
    if (isLocked && !wasLocked.current) {
      // This component is requesting a lock
      lockCount++;
      wasLocked.current = true;

      // Only lock body scroll if this is the first lock
      if (lockCount === 1) {
        document.body.style.overflow = 'hidden';
      }
    } else if (!isLocked && wasLocked.current) {
      // This component is releasing its lock
      lockCount = Math.max(0, lockCount - 1);
      wasLocked.current = false;

      // Only unlock body scroll if no other locks remain
      if (lockCount === 0) {
        document.body.style.overflow = 'unset';
      }
    }

    // Cleanup on unmount
    return () => {
      if (wasLocked.current) {
        lockCount = Math.max(0, lockCount - 1);
        wasLocked.current = false;

        if (lockCount === 0) {
          document.body.style.overflow = 'unset';
        }
      }
    };
  }, [isLocked]);
}
