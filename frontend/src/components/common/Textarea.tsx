import { TextareaHTMLAttributes, forwardRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    const { theme } = useTheme();

    const textareaStyles = {
      backgroundColor: theme.colors.bgPrimary,
      color: theme.colors.textPrimary,
      borderColor: error ? theme.colors.error : theme.colors.borderPrimary,
      borderWidth: '1px',
      borderStyle: 'solid' as const,
      outlineColor: theme.colors.accentPrimary,
    };

    const labelStyles = {
      color: theme.colors.textPrimary,
    };

    const errorStyles = {
      color: theme.colors.error,
    };

    return (
      <div className="w-full">
        {label && (
          <label
            className="block text-sm font-medium mb-1"
            style={labelStyles}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 ${className}`}
          style={textareaStyles}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm" style={errorStyles}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
