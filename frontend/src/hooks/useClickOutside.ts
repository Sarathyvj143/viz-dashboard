import { useEffect, RefObject } from 'react';

/**
 * Hook to detect clicks outside a referenced element and trigger a callback.
 *
 * @param ref - React ref object pointing to the element
 * @param handler - Callback function to execute when clicking outside
 * @param enabled - Whether the listener is active (default: true)
 *
 * @example
 * ```tsx
 * const menuRef = useRef<HTMLDivElement>(null);
 * useClickOutside(menuRef, () => setIsOpen(false), isOpen);
 *
 * return <div ref={menuRef}>Menu content</div>;
 * ```
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent) => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler(event);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref, handler, enabled]);
}
