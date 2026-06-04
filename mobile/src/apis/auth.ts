import { apiPost, apiPostVoid, setAccessToken } from './http';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    name: string;
    role: string;
    isGlobalAdmin: boolean;
  };
}

export async function login(username: string, password: string) {
  const response = await apiPost<LoginResponse>('/auth/login', { username, password });
  setAccessToken(response.accessToken);
  return response;
}

export function logout() {
  setAccessToken(undefined);
}

export async function changePassword(currentPassword: string, newPassword: string) {
  await apiPostVoid('/auth/change-password', { currentPassword, newPassword });
}

export type AuthUser = LoginResponse['user'];
