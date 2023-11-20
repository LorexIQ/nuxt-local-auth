type UseLocalAuthData = {
  [name: string]: string;
};
type UseLocalAuthResponse = {
  [name: string]: any;
};
type UseLocalAuthCredentials = {
  [name: string]: any;
};
type UseLocalAuthConfig = {
  redirectTo: string;
};
type UseLocalAuthStatus =
  | 'authorized'
  | 'unauthorized'
  | 'unknown'
  | 'timeout';

interface UseLocalAuthSession {
  token: string | null;
  refreshToken: string | null;
  lastSessionUpdate: string | null;
  status: UseLocalAuthStatus;
}
