export type UseLocalAuthData = {
  [name: string]: string;
};
export type UseLocalAuthResponse = {
  [name: string]: any;
};
export type UseLocalAuthCredentials = {
  [name: string]: any;
};
export type UseLocalAuthConfig = {
  redirectTo: string;
};
export type UseLocalAuthStatus =
  | 'authorized'
  | 'unauthorized'
  | 'unknown'
  | 'timeout';

export interface UseLocalAuthSession {
  token: string | null;
  refreshToken: string | null;
  exp: string | null;
  status: UseLocalAuthStatus;
}
