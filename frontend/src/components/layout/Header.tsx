interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-gray-900 truncate sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-500 truncate">{subtitle}</p>}
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
