import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { login } from '@/apis';
import { Icon } from '@/components';
import { useTheme } from '@/contexts/theme-context';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const [username, setUsername] = useState('owner');
  const [password, setPassword] = useState('owner123');
  const existingToken = localStorage.getItem('access_token') ?? localStorage.getItem('accessToken');
  const from = typeof location.state === 'object' && location.state && 'from' in location.state
    ? String(location.state.from)
    : '/';

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: data => {
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate(from, { replace: true });
    },
  });

  if (existingToken) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="login-page">
      <button
        type="button"
        className="login-theme-toggle"
        onClick={toggleTheme}
        aria-label={isDark ? 'Chuyển Light Mode' : 'Chuyển Dark Mode'}
      >
        <Icon name={isDark ? 'light_mode' : 'dark_mode'} size={18} />
        <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
      </button>

      <div className="login-shell">
        <div className="login-brand">
          <div className="login-brand-mark">
            <Icon name="meeting_room" size={28} />
          </div>
          <h1 className="login-title">Rental Smart Room</h1>
          <p className="login-subtitle">IoT Management Interface</p>
        </div>

        <section className="login-card">
          <div className="login-card-accent" />
          <form
            onSubmit={event => {
              event.preventDefault();
              loginMutation.mutate({ username, password });
            }}
          >
            <label className="login-field">
              <span className="login-label">Username</span>
              <input
                className="form-input py-3"
                value={username}
                onChange={event => setUsername(event.target.value)}
                autoComplete="username"
              />
            </label>

            <label className="login-field">
              <span className="login-label">Password</span>
              <input
                className="form-input py-3"
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </label>

            {loginMutation.isError && (
              <div className="login-error">
                Login failed. Check username and password.
              </div>
            )}

            <button
              className="btn-primary w-full py-4 text-headline-sm flex items-center justify-center gap-2 mt-5"
              disabled={loginMutation.isPending}
            >
              <span>{loginMutation.isPending ? 'Signing in...' : 'Secure Access'}</span>
              <Icon name="arrow_forward" size={18} />
            </button>
          </form>

          <div className="login-demo">
            Demo: owner / owner123
          </div>
        </section>
      </div>
    </main>
  );
}

export default LoginPage;
