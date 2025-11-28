import { useEffect } from 'react';

/**
 * Development-only hook for debugging viewport, zoom, and responsive behavior.
 * Logs comprehensive information about window dimensions, breakpoints, and element sizes.
 *
 * @param enabled - Whether to enable logging (defaults to DEV mode)
 * @param componentName - Name to display in console logs
 */
export function useViewportDebug(enabled: boolean = import.meta.env.DEV, componentName: string = 'Component') {
  useEffect(() => {
    if (!enabled) return;

    const logViewportInfo = () => {
      // Only log in development mode
      if (!import.meta.env.DEV) return;

      const visualViewport = window.visualViewport;
      const documentWidth = document.documentElement.clientWidth;
      const windowWidth = window.innerWidth;
      const devicePixelRatio = window.devicePixelRatio;

      console.group(`🔍 ${componentName} - Viewport & Zoom Debug`);
      console.log('📏 Window Dimensions:');
      console.log('  - innerWidth:', windowWidth, 'px');
      console.log('  - innerHeight:', window.innerHeight, 'px');
      console.log('  - outerWidth:', window.outerWidth, 'px');
      console.log('  - outerHeight:', window.outerHeight, 'px');

      console.log('📐 Document Dimensions:');
      console.log('  - clientWidth:', documentWidth, 'px');
      console.log('  - clientHeight:', document.documentElement.clientHeight, 'px');
      console.log('  - scrollWidth:', document.documentElement.scrollWidth, 'px');

      console.log('🔎 Visual Viewport:');
      console.log('  - width:', visualViewport?.width, 'px');
      console.log('  - height:', visualViewport?.height, 'px');
      console.log('  - scale (zoom):', visualViewport?.scale);
      console.log('  - offsetLeft:', visualViewport?.offsetLeft);
      console.log('  - offsetTop:', visualViewport?.offsetTop);

      console.log('🖥️ Device & Display:');
      console.log('  - devicePixelRatio:', devicePixelRatio);

      // Better zoom detection
      const browserZoom = Math.round((window.outerWidth / window.innerWidth) * 100);
      const visualZoom = Math.round((visualViewport?.scale || 1) * 100);
      console.log('  - Browser zoom (calculated):', browserZoom + '%');
      console.log('  - Visual viewport zoom:', visualZoom + '%');

      // Detect zoom method
      if (browserZoom !== 100 && visualZoom === 100) {
        console.log('  - 🔎 Zoom method: Browser zoom (Ctrl +/-)');
      } else if (visualZoom !== 100) {
        console.log('  - 🔎 Zoom method: Pinch zoom or viewport scale');
      } else if (devicePixelRatio !== 1) {
        console.log('  - 🔎 Zoom method: Display scaling or high-DPI');
      } else {
        console.log('  - 🔎 Zoom method: Normal (no zoom)');
      }

      console.log('📱 Responsive Breakpoint Detection:');
      const breakpoints = {
        mobile: documentWidth < 640,
        sm: documentWidth >= 640 && documentWidth < 768,
        md: documentWidth >= 768 && documentWidth < 1024,
        lg: documentWidth >= 1024 && documentWidth < 1280,
        xl: documentWidth >= 1280 && documentWidth < 1536,
        '2xl': documentWidth >= 1536
      };
      console.log('  - Mobile (< 640px):', breakpoints.mobile);
      console.log('  - SM (640-767px):', breakpoints.sm);
      console.log('  - MD (768-1023px):', breakpoints.md, breakpoints.md ? '← ACTIVE' : '');
      console.log('  - LG (1024-1279px):', breakpoints.lg, breakpoints.lg ? '← ACTIVE' : '');
      console.log('  - XL (1280-1535px):', breakpoints.xl, breakpoints.xl ? '← ACTIVE' : '');
      console.log('  - 2XL (1536px+):', breakpoints['2xl'], breakpoints['2xl'] ? '← ACTIVE' : '');

      // Show what classes should be active
      const activeBreakpoint = breakpoints['2xl'] ? '2XL' : breakpoints.xl ? 'XL' : breakpoints.lg ? 'LG' : breakpoints.md ? 'MD' : breakpoints.sm ? 'SM' : 'Mobile';
      console.log('  - 🎯 Current breakpoint:', activeBreakpoint);

      // Log table element dimensions if available
      const tableContainer = document.querySelector('.overflow-x-auto');
      const table = document.querySelector('table');
      if (tableContainer && table) {
        console.log('📊 Table Dimensions:');
        console.log('  - Container width:', tableContainer.clientWidth, 'px');
        console.log('  - Container scroll width:', tableContainer.scrollWidth, 'px');
        console.log('  - Table width:', table.offsetWidth, 'px');
        console.log('  - Has horizontal scroll:', tableContainer.scrollWidth > tableContainer.clientWidth);

        // Log column details
        const headers = table.querySelectorAll('th');
        const firstRow = table.querySelector('tbody tr');

        if (headers.length > 0) {
          console.log('Column Headers:', headers.length);
          headers.forEach((header, index) => {
            console.log(`  - Column ${index + 1} (${header.textContent?.trim()}):`, {
              width: header.offsetWidth,
              computed: getComputedStyle(header).width
            });
          });
        }

        if (firstRow) {
          const cells = firstRow.querySelectorAll('td');
          console.log('First Row Cells:', cells.length);
          cells.forEach((cell, index) => {
            const computedStyles = getComputedStyle(cell);
            console.log(`  - Cell ${index + 1}:`, {
              width: cell.offsetWidth,
              computedWidth: computedStyles.width,
              paddingLeft: computedStyles.paddingLeft,
              paddingRight: computedStyles.paddingRight,
              fontSize: computedStyles.fontSize,
              className: cell.className
            });
          });

          // Check applied responsive classes
          console.log('🎨 Responsive Classes Applied:');
          const sampleHeader = headers[0];
          const sampleCell = cells[0];
          if (sampleHeader) {
            console.log('  - Header classes:', sampleHeader.className);
            console.log('  - Header computed styles:', {
              fontSize: getComputedStyle(sampleHeader).fontSize,
              padding: `${getComputedStyle(sampleHeader).paddingTop} ${getComputedStyle(sampleHeader).paddingRight}`
            });
          }
          if (sampleCell) {
            console.log('  - Cell classes:', sampleCell.className);
            console.log('  - Cell computed styles:', {
              fontSize: getComputedStyle(sampleCell).fontSize,
              padding: `${getComputedStyle(sampleCell).paddingTop} ${getComputedStyle(sampleCell).paddingRight}`
            });
          }
        }
      }

      console.groupEnd();
    };

    // Log on mount (only in development)
    if (import.meta.env.DEV) {
      console.log(`🚀 ${componentName} mounted`);
    }
    setTimeout(logViewportInfo, 100); // Small delay to ensure DOM is ready

    // Log on resize
    const handleResize = () => {
      if (import.meta.env.DEV) {
        console.log(`🔄 ${componentName} - Window resized`);
      }
      logViewportInfo();
    };

    // Log on visual viewport changes (zoom)
    const handleVisualViewportResize = () => {
      if (import.meta.env.DEV) {
        console.log(`🔍 ${componentName} - Visual viewport changed (zoom/pinch)`);
      }
      logViewportInfo();
    };

    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleVisualViewportResize);
    window.visualViewport?.addEventListener('scroll', handleVisualViewportResize);

    return () => {
      if (import.meta.env.DEV) {
        console.log(`🛑 ${componentName} unmounting`);
      }
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleVisualViewportResize);
      window.visualViewport?.removeEventListener('scroll', handleVisualViewportResize);
    };
  }, [enabled, componentName]);
}
