export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

/**
 * Backend response for /auth/login, /auth/register and /auth/refresh.
 *
 * Current backend returns:
 * {
 *   "token": "<access-token>"
 * }
 *
 * accessToken is kept optional only as a defensive compatibility fallback
 * while older frontend code is being migrated.
 */
export interface AuthResponse {
  token: string;
  accessToken?: string;
}

export interface TokenPayload {
  sub: string;
  userId?: number;
  role?: string;
  roles?: string[];
  exp: number;
  iat?: number;
}
