import { useCallback } from 'react';

/**
 * Configuration for themed hover effects
 */
interface HoverConfig {
  /** Background color on hover */
  hoverBg?: string;
  /** Background color when not hovering */
  normalBg?: string;
  /** Text color on hover */
  hoverColor?: string;
  /** Text color when not hovering */
  normalColor?: string;
  /** Border color on hover */
  hoverBorder?: string;
  /** Border color when not hovering */
  normalBorder?: string;
  /** Opacity on hover (0-1) */
  hoverOpacity?: number;
  /** Condition that must be true for hover to apply */
  condition?: boolean;
}

/**
 * Custom hook for managing themed hover effects with performance optimization.
 *
 * Uses useCallback to memoize event handlers and prevent unnecessary re-renders.
 * Provides a clean API for applying hover effects without inline event handlers.
 *
 * @param config - Configuration object for hover behavior
 * @returns Object with memoized onMouseEnter and onMouseLeave handlers
 *
 * @example
 * ```tsx
 * const { theme } = useTheme();
 * const hoverProps = useThemedHover({
 *   hoverBg: theme.colors.bgTertiary,
 *   normalBg: 'transparent',
 *   condition: !isActive
 * });
 *
 * <button {...hoverProps}>Click me</button>
 * ```
 */
export function useThemedHover(config: HoverConfig) {
  const {
    hoverBg,
    normalBg = 'transparent',
    hoverColor,
    normalColor,
    hoverBorder,
    normalBorder,
    hoverOpacity,
    condition = true,
  } = config;

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!condition) return;

      if (hoverBg !== undefined) {
        e.currentTarget.style.backgroundColor = hoverBg;
      }
      if (hoverColor !== undefined) {
        e.currentTarget.style.color = hoverColor;
      }
      if (hoverBorder !== undefined) {
        e.currentTarget.style.borderBottomColor = hoverBorder;
      }
      if (hoverOpacity !== undefined) {
        e.currentTarget.style.opacity = String(hoverOpacity);
      }
    },
    [hoverBg, hoverColor, hoverBorder, hoverOpacity, condition]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!condition) return;

      if (hoverBg !== undefined || normalBg !== undefined) {
        e.currentTarget.style.backgroundColor = normalBg;
      }
      if (hoverColor !== undefined || normalColor !== undefined) {
        e.currentTarget.style.color = normalColor || '';
      }
      if (hoverBorder !== undefined || normalBorder !== undefined) {
        e.currentTarget.style.borderBottomColor = normalBorder || '';
      }
      if (hoverOpacity !== undefined) {
        e.currentTarget.style.opacity = '1';
      }
    },
    [normalBg, normalColor, normalBorder, hoverOpacity, condition]
  );

  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };
}
