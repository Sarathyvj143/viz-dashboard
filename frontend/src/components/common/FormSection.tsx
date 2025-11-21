import { useTheme } from '../../contexts/ThemeContext';
import { withOpacity } from '../../utils/colorHelpers';

interface FormSectionProps {
  number: number;
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function FormSection({
  number,
  title,
  description,
  children,
}: FormSectionProps) {
  const { theme } = useTheme();

  const styles = {
    container: {
      backgroundColor: theme.colors.bgPrimary,
      borderRadius: '0.75rem',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      borderWidth: '1px',
      borderStyle: 'solid' as const,
      borderColor: theme.colors.borderPrimary,
      overflow: 'hidden' as const,
    },
    header: {
      background: `linear-gradient(to right, ${withOpacity(theme.colors.accentPrimary, 10)}, ${withOpacity(theme.colors.accentSecondary, 10)})`,
      padding: '1.5rem',
      borderBottomWidth: '1px',
      borderBottomStyle: 'solid' as const,
      borderBottomColor: theme.colors.borderPrimary,
    },
    title: {
      fontSize: '1.125rem',
      fontWeight: 600,
      color: theme.colors.textPrimary,
      display: 'flex',
      alignItems: 'center',
    },
    badge: {
      width: '2rem',
      height: '2rem',
      borderRadius: '0.5rem',
      backgroundColor: theme.colors.accentPrimary,
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '0.75rem',
      fontSize: '0.875rem',
      fontWeight: 500,
    },
    description: {
      fontSize: '0.875rem',
      color: theme.colors.textSecondary,
      marginTop: '0.25rem',
      marginLeft: '2.75rem',
    },
    content: {
      padding: '1.5rem',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>
          <span style={styles.badge}>{number}</span>
          {title}
        </h3>
        <p style={styles.description}>{description}</p>
      </div>
      <div style={styles.content} className="space-y-5">
        {children}
      </div>
    </div>
  );
}
