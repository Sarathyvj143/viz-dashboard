interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'gray' | 'white' | 'blue';
  className?: string;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
};

const colorMap = {
  gray: 'border-gray-900',
  white: 'border-white',
  blue: 'border-blue-600',
};

export default function Spinner({ size = 'md', color = 'gray', className = '' }: SpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full border-b-2 ${sizeMap[size]} ${colorMap[color]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
