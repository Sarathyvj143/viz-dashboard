interface FormSectionProps {
  number: number;
  title: string;
  description: string;
  children: React.ReactNode;
  colorScheme?: 'blue' | 'purple' | 'green' | 'orange' | 'indigo';
}

const colorSchemes = {
  blue: { gradient: 'from-blue-50 to-indigo-50', badge: 'bg-blue-500' },
  purple: { gradient: 'from-purple-50 to-pink-50', badge: 'bg-purple-500' },
  green: { gradient: 'from-green-50 to-emerald-50', badge: 'bg-green-500' },
  orange: { gradient: 'from-orange-50 to-amber-50', badge: 'bg-orange-500' },
  indigo: { gradient: 'from-indigo-50 to-purple-50', badge: 'bg-indigo-500' },
};

export default function FormSection({
  number,
  title,
  description,
  children,
  colorScheme = 'blue'
}: FormSectionProps) {
  const colors = colorSchemes[colorScheme];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className={`bg-gradient-to-r ${colors.gradient} px-6 py-4 border-b border-gray-200`}>
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className={`w-8 h-8 rounded-lg ${colors.badge} text-white flex items-center justify-center mr-3 text-sm`}>
            {number}
          </span>
          {title}
        </h3>
        <p className="text-sm text-gray-600 mt-1 ml-11">{description}</p>
      </div>
      <div className="p-6 space-y-5">
        {children}
      </div>
    </div>
  );
}
