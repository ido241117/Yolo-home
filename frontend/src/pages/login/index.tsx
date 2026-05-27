import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { login } from '@/apis';
import { Icon } from '@/components';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
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
    <main className="min-h-screen bg-background text-on-surface flex items-center justify-center p-6">
      <div className="w-full max-w-[440px]">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center mb-4 shadow-xl">
            <Icon name="meeting_room" size={28} className="text-white" />
          </div>
          <h1 className="text-headline-lg text-center">Rental Smart Room</h1>
          <p className="text-body-md text-on-surface-variant text-center mt-2">IoT Management Interface</p>
        </div>

        <section className="bg-surface-container border border-outline-variant p-8 rounded-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary-container" />
          <form
            className="space-y-5"
            onSubmit={event => {
              event.preventDefault();
              loginMutation.mutate({ username, password });
            }}
          >
            <label className="space-y-2 block">
              <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Username</span>
              <div className="relative">
                <Icon name="person" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  className="form-input pl-11 py-3"
                  value={username}
                  onChange={event => setUsername(event.target.value)}
                  autoComplete="username"
                />
              </div>
            </label>

            <label className="space-y-2 block">
              <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Password</span>
              <div className="relative">
                <Icon name="lock" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  className="form-input pl-11 py-3"
                  type="password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </label>

            {loginMutation.isError && (
              <div className="bg-error-container/20 border border-error/40 text-error px-4 py-3 rounded-lg text-body-md">
                Login failed. Check username and password.
              </div>
            )}

            <button className="btn-primary w-full py-4 text-headline-sm flex items-center justify-center gap-2" disabled={loginMutation.isPending}>
              <span>{loginMutation.isPending ? 'Signing in...' : 'Secure Access'}</span>
              <Icon name="arrow_forward" size={18} />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-outline-variant/30 text-center">
            <p className="text-label-md text-on-surface-variant">Demo: owner / owner123</p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default LoginPage;
