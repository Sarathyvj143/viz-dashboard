import { SelectHTMLAttributes, forwardRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = '', children, ...props }, ref) => {
    const { theme } = useTheme();

    const selectStyles = {
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
        <select
          ref={ref}
          className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${className}`}
          style={selectStyles}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="mt-1 text-sm" style={errorStyles}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
