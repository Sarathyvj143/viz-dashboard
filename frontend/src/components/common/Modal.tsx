import { ReactNode, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /**
   * Modal size variant
   * - sm: max-w-md (~448px) - Compact modals for simple actions
   * - md: max-w-2xl (~672px) - Default size for most modals
   * - lg: max-w-4xl (~896px) - Large content forms or data displays
   * - xl: max-w-6xl (~1152px) - Extra large for complex interfaces
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles();

  // Map size prop to Tailwind max-width classes
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  // Use coordinated scroll lock to prevent conflicts with Sidebar
  useBodyScrollLock(isOpen);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div className={`relative rounded-lg shadow-xl ${sizeClasses[size]} w-full mx-4 max-h-[90vh] overflow-auto`} style={{ backgroundColor: theme.colors.bgPrimary }}>
        {title && (
          <div className="px-6 py-4" style={styles.borderBottom()}>
            <h2 className="text-xl font-semibold" style={styles.heading.primary}>{title}</h2>
          </div>
        )}
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
