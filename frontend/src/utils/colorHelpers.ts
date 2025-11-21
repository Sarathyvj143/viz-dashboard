/**
 * Color manipulation utilities for theme system
 */

/**
 * Adjusts color brightness by a given percentage
 * Useful for creating readable text colors on light backgrounds
 * @param hex - Hex color string (e.g., "#3B82F6")
 * @param percent - Brightness adjustment (-100 to 100, negative darkens, positive brightens)
 * @returns Adjusted hex color
 */
export function adjustColorBrightness(hex: string, percent: number): string {
  // Remove # if present
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);

  // Clamp RGB values between 0-255
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));

  return '#' + (
    0x1000000 +
    R * 0x10000 +
    G * 0x100 +
    B
  ).toString(16).slice(1).toUpperCase();
}

/**
 * Apply opacity to a hex color using RGBA
 * Provides universal browser support
 * @param hex - Hex color string
 * @param opacity - Opacity percentage (0-100)
 * @returns CSS rgba string
 */
export function withOpacity(hex: string, opacity: number): string {
  const color = hex.replace('#', '');
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const alpha = opacity / 100;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Get contrasting text color (black or white) for a background
 * Uses relative luminance calculation
 * @param bgHex - Background hex color
 * @returns '#000000' or '#FFFFFF'
 */
export function getContrastTextColor(bgHex: string): string {
  const color = bgHex.replace('#', '');
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  // Calculate relative luminance (same algorithm as in themes.ts)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Calculate WCAG contrast ratio between two colors
 * @param color1 - First hex color
 * @param color2 - Second hex color
 * @returns Contrast ratio (1-21)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.replace('#', ''), 16);
    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = (rgb & 0xff) / 255;

    const [rs, gs, bs] = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color combination meets WCAG AA standard
 * @param textColor - Text hex color
 * @param bgColor - Background hex color
 * @param isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns Whether combination passes WCAG AA (4.5:1 normal, 3:1 large)
 */
export function meetsWCAGAA(
  textColor: string,
  bgColor: string,
  isLargeText = false
): boolean {
  const ratio = getContrastRatio(textColor, bgColor);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if color combination meets WCAG AAA standard
 * @param textColor - Text hex color
 * @param bgColor - Background hex color
 * @param isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns Whether combination passes WCAG AAA (7:1 normal, 4.5:1 large)
 */
export function meetsWCAGAAA(
  textColor: string,
  bgColor: string,
  isLargeText = false
): boolean {
  const ratio = getContrastRatio(textColor, bgColor);
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Ensure a foreground color has sufficient contrast against a background
 * Automatically adjusts the foreground color brightness until minimum contrast is met
 * @param foreground - Foreground hex color
 * @param background - Background hex color
 * @param level - WCAG level ('AA' or 'AAA')
 * @param isLargeText - Whether text is large
 * @returns Adjusted foreground color with sufficient contrast
 */
export function ensureContrast(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText = false
): string {
  const meetsRequirement = level === 'AA' ? meetsWCAGAA : meetsWCAGAAA;

  if (meetsRequirement(foreground, background, isLargeText)) {
    return foreground;
  }

  // Determine if we need to darken or lighten
  const bgLuminance = getLuminance(background);
  const shouldDarken = bgLuminance > 0.5;

  let adjustedColor = foreground;
  let adjustment = shouldDarken ? -10 : 10;

  // Try adjusting brightness until we meet contrast requirements (max 10 iterations)
  for (let i = 0; i < 10; i++) {
    adjustedColor = adjustColorBrightness(adjustedColor, adjustment);
    if (meetsRequirement(adjustedColor, background, isLargeText)) {
      return adjustedColor;
    }
  }

  // Fallback: return black or white based on background
  return bgLuminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Helper function to get relative luminance of a color
 * @param hex - Hex color string
 * @returns Relative luminance value (0-1)
 */
function getLuminance(hex: string): number {
  const rgb = parseInt(hex.replace('#', ''), 16);
  const r = ((rgb >> 16) & 0xff) / 255;
  const g = ((rgb >> 8) & 0xff) / 255;
  const b = (rgb & 0xff) / 255;

  const [rs, gs, bs] = [r, g, b].map((c) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}
