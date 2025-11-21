import { useState, useRef, useEffect, useMemo, forwardRef, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ChevronDownIcon, XMarkIcon, CheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { withOpacity } from '../../utils/colorHelpers';
import { useClickOutside } from '../../hooks/useClickOutside';

export interface DropdownOption<T = string | number> {
  value: T;
  label: string;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  disabled?: boolean;
  description?: string;
  badge?: string | number;
}

// Single-select props
interface SingleSelectDropdownProps<T = string | number> {
  /** Available options */
  options: DropdownOption<T>[];

  /** Selected value */
  value?: T;

  /** Change handler */
  onChange: (value: T | undefined) => void;

  /** Placeholder text */
  placeholder?: string;

  /** Label */
  label?: string;

  /** Error message */
  error?: string;

  /** Enable search/filter */
  searchable?: boolean;

  /** Enable multi-select */
  multiSelect?: false;

  /** Disabled state */
  disabled?: boolean;

  /** Custom option renderer */
  renderOption?: (option: DropdownOption<T>) => React.ReactNode;

  /** Custom selected value renderer */
  renderValue?: (option: DropdownOption<T>) => React.ReactNode;

  /** Maximum height of dropdown menu */
  maxHeight?: string;

  /** Additional CSS classes */
  className?: string;

  /** Show clear button */
  clearable?: boolean;

  /** Position of dropdown */
  position?: 'bottom' | 'top' | 'auto';
}

// Multi-select props
interface MultiSelectDropdownProps<T = string | number> {
  /** Available options */
  options: DropdownOption<T>[];

  /** Selected values */
  value?: T[];

  /** Change handler */
  onChange: (value: T[]) => void;

  /** Placeholder text */
  placeholder?: string;

  /** Label */
  label?: string;

  /** Error message */
  error?: string;

  /** Enable search/filter */
  searchable?: boolean;

  /** Enable multi-select */
  multiSelect: true;

  /** Disabled state */
  disabled?: boolean;

  /** Custom option renderer */
  renderOption?: (option: DropdownOption<T>) => React.ReactNode;

  /** Custom selected value renderer */
  renderValue?: (option: DropdownOption<T>) => React.ReactNode;

  /** Maximum height of dropdown menu */
  maxHeight?: string;

  /** Additional CSS classes */
  className?: string;

  /** Show clear button */
  clearable?: boolean;

  /** Position of dropdown */
  position?: 'bottom' | 'top' | 'auto';
}

type DropdownProps<T = string | number> =
  | SingleSelectDropdownProps<T>
  | MultiSelectDropdownProps<T>;

function DropdownComponent<T = string | number>(
  props: DropdownProps<T>,
  ref: React.Ref<HTMLDivElement>
) {
  const {
    options,
    value,
    onChange,
    placeholder = 'Select...',
    label,
    error,
    searchable = false,
    multiSelect = false,
    disabled = false,
    renderOption,
    renderValue,
    maxHeight = '16rem',
    className = '',
    clearable = false,
  } = props;

  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Use forwarded ref or internal ref
  const combinedRef = (ref as React.RefObject<HTMLDivElement>) || containerRef;

  // Close dropdown when clicking outside
  useClickOutside(combinedRef, () => setIsOpen(false), isOpen);

  // Normalize value to array for easier handling
  const selectedValues = useMemo(() => {
    if (multiSelect) {
      return Array.isArray(value) ? value : [];
    }
    return value !== undefined ? [value] : [];
  }, [value, multiSelect]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.description?.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  // Get selected option(s)
  const selectedOptions = useMemo(() => {
    return options.filter((opt) => selectedValues.includes(opt.value as never));
  }, [options, selectedValues]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Handle option selection with proper typing
  const handleSelect = useCallback(
    (option: DropdownOption<T>) => {
      if (option.disabled) return;

      if (multiSelect) {
        const currentValues = Array.isArray(value) ? value : [];
        const newValues = currentValues.includes(option.value)
          ? currentValues.filter((v) => v !== option.value)
          : [...currentValues, option.value];
        (onChange as (value: T[]) => void)(newValues);
      } else {
        (onChange as (value: T | undefined) => void)(option.value);
        setIsOpen(false);
      }
    },
    [multiSelect, value, onChange]
  );

  // Handle clear
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (multiSelect) {
        (onChange as (value: T[]) => void)([]);
      } else {
        (onChange as (value: T | undefined) => void)(undefined);
      }
    },
    [multiSelect, onChange]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          if (!isOpen) {
            e.preventDefault();
            setIsOpen(true);
          } else if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
            e.preventDefault();
            handleSelect(filteredOptions[focusedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setFocusedIndex((prev) =>
              prev < filteredOptions.length - 1 ? prev + 1 : prev
            );
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (isOpen) {
            setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          }
          break;
      }
    },
    [disabled, isOpen, focusedIndex, filteredOptions, handleSelect]
  );

  const styles = {
    container: {
      position: 'relative' as const,
    },
    label: {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: 500,
      marginBottom: '0.25rem',
      color: theme.colors.textPrimary,
    },
    control: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 0.75rem',
      backgroundColor: theme.colors.bgPrimary,
      borderWidth: '1px',
      borderStyle: 'solid' as const,
      borderColor: error ? theme.colors.error : theme.colors.borderPrimary,
      borderRadius: '0.375rem',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      transition: 'border-color 0.2s, box-shadow 0.2s',
    },
    controlFocused: {
      borderColor: theme.colors.accentPrimary,
      boxShadow: `0 0 0 3px ${withOpacity(theme.colors.accentPrimary, 20)}`,
    },
    valueContainer: {
      flex: 1,
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '0.25rem',
      alignItems: 'center',
    },
    placeholder: {
      color: theme.colors.textSecondary,
      fontSize: '0.875rem',
    },
    singleValue: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: theme.colors.textPrimary,
      fontSize: '0.875rem',
    },
    multiValue: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      padding: '0.125rem 0.5rem',
      backgroundColor: withOpacity(theme.colors.accentPrimary, 15),
      color: theme.colors.accentPrimary,
      borderRadius: '0.25rem',
      fontSize: '0.75rem',
      fontWeight: 500,
    },
    clearButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0.25rem',
      color: theme.colors.textSecondary,
      cursor: 'pointer',
      borderRadius: '0.25rem',
      transition: 'color 0.2s, background-color 0.2s',
    },
    chevron: {
      color: theme.colors.textSecondary,
      transition: 'transform 0.2s',
      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
    },
    menu: {
      position: 'absolute' as const,
      zIndex: 1000,
      width: '100%',
      marginTop: '0.25rem',
      backgroundColor: theme.colors.bgPrimary,
      borderWidth: '1px',
      borderStyle: 'solid' as const,
      borderColor: theme.colors.borderPrimary,
      borderRadius: '0.375rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      maxHeight,
      overflowY: 'auto' as const,
    },
    search: {
      padding: '0.5rem',
      borderBottom: `1px solid ${theme.colors.borderPrimary}`,
    },
    searchInput: {
      width: '100%',
      padding: '0.5rem 0.75rem 0.5rem 2.25rem',
      backgroundColor: theme.colors.bgSecondary,
      color: theme.colors.textPrimary,
      borderWidth: '1px',
      borderStyle: 'solid' as const,
      borderColor: theme.colors.borderPrimary,
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      outline: 'none',
    },
    searchIcon: {
      position: 'absolute' as const,
      left: '1rem',
      top: '50%',
      transform: 'translateY(-50%)',
      color: theme.colors.textSecondary,
      pointerEvents: 'none' as const,
    },
    option: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.625rem 0.75rem',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    optionHover: {
      backgroundColor: theme.colors.bgSecondary,
    },
    optionFocused: {
      backgroundColor: theme.colors.bgTertiary,
    },
    optionSelected: {
      backgroundColor: withOpacity(theme.colors.accentPrimary, 10),
      color: theme.colors.accentPrimary,
      fontWeight: 500,
    },
    optionDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    optionContent: {
      flex: 1,
    },
    optionLabel: {
      fontSize: '0.875rem',
      color: theme.colors.textPrimary,
    },
    optionDescription: {
      fontSize: '0.75rem',
      color: theme.colors.textSecondary,
      marginTop: '0.125rem',
    },
    optionBadge: {
      padding: '0.125rem 0.375rem',
      backgroundColor: withOpacity(theme.colors.accentPrimary, 15),
      color: theme.colors.accentPrimary,
      borderRadius: '0.25rem',
      fontSize: '0.625rem',
      fontWeight: 600,
    },
    checkIcon: {
      color: theme.colors.accentPrimary,
    },
    error: {
      marginTop: '0.25rem',
      fontSize: '0.75rem',
      color: theme.colors.error,
    },
    emptyState: {
      padding: '2rem 1rem',
      textAlign: 'center' as const,
      color: theme.colors.textSecondary,
      fontSize: '0.875rem',
    },
  };

  const defaultRenderOption = useCallback(
    (option: DropdownOption<T>) => (
      <>
        {option.icon && (
          <option.icon className="w-4 h-4" style={{ color: theme.colors.textSecondary }} />
        )}
        <div style={styles.optionContent}>
          <div style={styles.optionLabel}>{option.label}</div>
          {option.description && <div style={styles.optionDescription}>{option.description}</div>}
        </div>
        {option.badge && <span style={styles.optionBadge}>{option.badge}</span>}
      </>
    ),
    [theme.colors.textSecondary, styles.optionContent, styles.optionLabel, styles.optionDescription, styles.optionBadge]
  );

  const defaultRenderValue = useCallback(
    (option: DropdownOption<T>) => (
      <>
        {option.icon && (
          <option.icon className="w-4 h-4" style={{ color: theme.colors.textSecondary }} />
        )}
        <span>{option.label}</span>
      </>
    ),
    [theme.colors.textSecondary]
  );

  const errorId = label ? `${label.replace(/\s+/g, '-')}-error` : 'dropdown-error';

  return (
    <div ref={combinedRef} style={styles.container} className={className}>
      {label && <label style={styles.label}>{label}</label>}

      <div
        style={{
          ...styles.control,
          ...(isOpen && !disabled ? styles.controlFocused : {}),
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
      >
        <div style={styles.valueContainer}>
          {selectedOptions.length === 0 ? (
            <span style={styles.placeholder}>{placeholder}</span>
          ) : multiSelect ? (
            selectedOptions.map((option) => (
              <div key={String(option.value)} style={styles.multiValue}>
                {renderValue ? renderValue(option) : defaultRenderValue(option)}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(option);
                  }}
                  style={{ display: 'flex', alignItems: 'center', marginLeft: '0.25rem' }}
                  type="button"
                  aria-label={`Remove ${option.label}`}
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
            ))
          ) : (
            <div style={styles.singleValue}>
              {renderValue ? renderValue(selectedOptions[0]) : defaultRenderValue(selectedOptions[0])}
            </div>
          )}
        </div>

        {clearable && selectedOptions.length > 0 && !disabled && (
          <button
            onClick={handleClear}
            style={styles.clearButton}
            type="button"
            aria-label="Clear selection"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}

        <ChevronDownIcon className="w-4 h-4" style={styles.chevron} />
      </div>

      {isOpen && !disabled && (
        <div style={styles.menu} role="listbox">
          {searchable && (
            <div style={styles.search}>
              <div style={{ position: 'relative' }}>
                <MagnifyingGlassIcon className="w-4 h-4" style={styles.searchIcon} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={styles.searchInput}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Search options"
                />
              </div>
            </div>
          )}

          {filteredOptions.length === 0 ? (
            <div style={styles.emptyState}>
              {searchQuery ? `No results for "${searchQuery}"` : 'No options available'}
            </div>
          ) : (
            filteredOptions.map((option, index) => {
              const isSelected = selectedValues.includes(option.value as never);
              const isFocused = index === focusedIndex;

              return (
                <div
                  key={String(option.value)}
                  style={{
                    ...styles.option,
                    ...(isFocused ? styles.optionFocused : {}),
                    ...(isSelected ? styles.optionSelected : {}),
                    ...(option.disabled ? styles.optionDisabled : {}),
                  }}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled}
                >
                  {renderOption ? renderOption(option) : defaultRenderOption(option)}
                  {multiSelect && isSelected && (
                    <CheckIcon className="w-4 h-4" style={styles.checkIcon} />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {error && (
        <div id={errorId} style={styles.error} role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

// Export with forwardRef and generic type support
const DropdownWithRef = forwardRef(DropdownComponent);
DropdownWithRef.displayName = 'Dropdown';

export const Dropdown = DropdownWithRef as <T = string | number>(
  props: DropdownProps<T> & { ref?: React.Ref<HTMLDivElement> }
) => JSX.Element;

export default Dropdown;
