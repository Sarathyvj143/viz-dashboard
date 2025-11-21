import { useTheme } from '../../contexts/ThemeContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  const { theme } = useTheme();

  return (
    <div
      className="border-b px-4 py-4 sm:px-6"
      style={{
        backgroundColor: theme.colors.bgSecondary,
        borderColor: theme.colors.borderPrimary,
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1
            className="text-xl font-bold truncate sm:text-2xl"
            style={{ color: theme.colors.textPrimary }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="mt-1 text-sm truncate"
              style={{ color: theme.colors.textSecondary }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0 sm:gap-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
