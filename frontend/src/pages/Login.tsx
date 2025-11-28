import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { XCircleIcon } from '@heroicons/react/24/solid';
import { useAuthStore } from '../store/authStore';
import { loginSchema, LoginFormData } from '../utils/validators';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { ThemedIcon } from '../utils/iconColors';
import { useTheme } from '../contexts/ThemeContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated, clearError } = useAuthStore();
  const { theme } = useTheme();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/dashboards', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    try {
      await login(data);
      navigate('/dashboards');
    } catch (err) {
      setError('root', {
        message: 'Invalid username or password. Please try again.',
      });
    }
  };

  if (isLoading && !errors.root) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: theme.isDark
            ? `linear-gradient(to bottom right, ${theme.colors.bgSecondary}, ${theme.colors.bgTertiary})`
            : `linear-gradient(to bottom right, ${theme.colors.accentPrimary}08, ${theme.colors.accentSecondary}08, ${theme.colors.accentPrimary}0d)`
        }}
      >
        <div className="text-lg animate-pulse" style={{ color: theme.colors.textSecondary }}>Checking authentication...</div>
      </div>
    );
  }

  return (
    <main
      className="min-h-screen relative overflow-hidden"
      style={{
        background: theme.isDark
          ? `linear-gradient(to bottom right, ${theme.colors.bgSecondary}, ${theme.colors.bgTertiary})`
          : `linear-gradient(to bottom right, ${theme.colors.accentPrimary}08, ${theme.colors.accentSecondary}08, ${theme.colors.accentPrimary}0d)`
      }}
    >
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 left-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl animate-blob"
          style={{ backgroundColor: theme.colors.accentPrimary, opacity: 0.2 }}
        ></div>
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"
          style={{ backgroundColor: theme.colors.accentSecondary, opacity: 0.2 }}
        ></div>
        <div
          className="absolute bottom-0 left-1/2 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"
          style={{ backgroundColor: theme.colors.accentPrimary, opacity: 0.15 }}
        ></div>
      </div>

      {/* Main Content */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg">
          {/* Animated Card */}
          <div
            className="rounded-2xl shadow-2xl p-8 transform transition-all duration-500 hover:scale-[1.02] animate-fade-in-up"
            style={{
              backgroundColor: `${theme.colors.bgSecondary}cc`,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
          >
            {/* Logo/Icon Animation */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center transform transition-transform duration-500 hover:rotate-[360deg] shadow-lg"
                  style={{
                    background: `linear-gradient(to bottom right, ${theme.colors.accentPrimary}, ${theme.colors.accentSecondary})`
                  }}
                >
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                {/* Animated Ring */}
                <div
                  className="absolute inset-0 rounded-2xl border-4 animate-ping opacity-20"
                  style={{ borderColor: theme.colors.accentPrimary }}
                ></div>
              </div>
            </div>

            {/* Title */}
            <h1
              className="text-3xl font-bold text-center mb-2 bg-clip-text text-transparent animate-fade-in"
              style={{
                backgroundImage: `linear-gradient(to right, ${theme.colors.accentPrimary}, ${theme.colors.accentSecondary})`
              }}
            >
              Visualization Platform
            </h1>
            <p
              className="text-center mb-8 animate-fade-in animation-delay-200"
              style={{ color: theme.colors.textSecondary }}
            >
              Sign in to access your dashboards
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" aria-label="Login form">
              {errors.root && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="p-4 rounded-xl animate-shake"
                  style={{
                    backgroundColor: theme.colors.bgTertiary,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: theme.colors.error
                  }}
                >
                  <div className="flex items-center">
                    <ThemedIcon Icon={XCircleIcon} variant="error" className="w-5 h-5 mr-2" />
                    <p className="text-sm" style={{ color: theme.colors.error }}>{errors.root.message}</p>
                  </div>
                </div>
              )}

              <div className="animate-fade-in animation-delay-300">
                <Input
                  label="Username"
                  id="username"
                  type="text"
                  error={errors.username?.message}
                  autoComplete="username"
                  placeholder="Enter your username"
                  disabled={isLoading}
                  aria-invalid={errors.username ? 'true' : 'false'}
                  aria-describedby={errors.username ? 'username-error' : undefined}
                  {...register('username')}
                />
              </div>

              <div className="animate-fade-in animation-delay-400">
                <Input
                  label="Password"
                  id="password"
                  type="password"
                  error={errors.password?.message}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  disabled={isLoading}
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password')}
                />
              </div>

              <div className="animate-fade-in animation-delay-500">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full relative overflow-hidden group disabled:cursor-not-allowed transform transition-all duration-300 hover:shadow-xl"
                  style={isLoading ? {
                    backgroundColor: `${theme.colors.accentPrimary}66`,
                    cursor: 'not-allowed'
                  } : undefined}
                >
                  {/* Background gradient FIRST for proper z-index layering */}
                  <div
                    className="absolute inset-0 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left -z-10"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${theme.colors.accentPrimary}, ${theme.colors.accentSecondary}, ${theme.colors.accentPrimary})`
                    }}
                  ></div>

                  {/* Content with proper stacking */}
                  <span className="relative z-10 flex items-center justify-center">
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Logging in...
                      </>
                    ) : (
                      <>
                        Login
                        <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </span>
                </Button>
              </div>
            </form>

            {/* Footer Links */}
            <div className="mt-8 text-center space-y-3 animate-fade-in animation-delay-600">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Password reset feature coming soon. Please contact an administrator.');
                }}
                className="text-sm inline-flex items-center transition-colors group"
                style={{ color: theme.colors.accentPrimary }}
                onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.accentSecondary}
                onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.accentPrimary}
              >
                <svg className="w-4 h-4 mr-1 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Forgot your password?
              </a>

              {import.meta.env.DEV && (
                <div
                  className="mt-4 p-4 rounded-xl animate-pulse-slow"
                  style={{
                    background: `linear-gradient(to right, ${theme.colors.warning}15, ${theme.colors.warning}20)`,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: `${theme.colors.warning}66`
                  }}
                >
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      style={{ color: theme.colors.warning }}
                    >
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p
                        className="text-sm font-semibold mb-1"
                        style={{ color: theme.colors.textPrimary }}
                      >
                        Development Mode
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: theme.colors.textSecondary }}
                      >
                        Check terminal for admin credentials
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Text */}
          <p
            className="text-center mt-6 text-sm animate-fade-in animation-delay-700"
            style={{ color: theme.colors.textSecondary }}
          >
            Secure authentication powered by JWT
          </p>
        </div>
      </div>
    </main>
  );
}
