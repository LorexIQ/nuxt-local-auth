import type {
  ComputedRef,
  Ref
} from "vue";

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
export interface UseLocalAuthFetchConfig {
  withToken?: boolean;
  body?: UseLocalAuthData;
}

export interface UseLocalAuthReturn extends UseLocalAuthReturnData, UseLocalAuthReturnMethods {}
export interface UseLocalAuthReturnData {
  data: ComputedRef<UseLocalAuthCredentials>;
  meta: Ref<UseLocalAuthSession>;
  token: ComputedRef<string | null>;
}
export interface UseLocalAuthReturnMethods {
  signIn<T extends UseLocalAuthResponse = {}>(data: UseLocalAuthData, config?: UseLocalAuthConfig): Promise<T>;
  signUp<T extends UseLocalAuthResponse = {}>(data: UseLocalAuthData, config?: UseLocalAuthConfig): Promise<T>;
  signOut<T extends UseLocalAuthResponse = {}>(config?: UseLocalAuthConfig): Promise<T>;
  getMe<T extends UseLocalAuthResponse = {}>(): Promise<T>;
  refreshToken<T extends UseLocalAuthResponse = {}>(): Promise<T>;
  refreshTokenWithCheck<T extends UseLocalAuthResponse = {}>(): Promise<T | null>;
  checkAndSaveQueryAuth(): Promise<void>;
}

export interface ModuleOptions {
  /* Path to server. Default: ''
  * Example: 'http://localhost:8000/api/v1' - remote server
  * Example: 'api' - local nuxt server
  * */
  origin: string;
  /* Config Cookie settings and additional options */
  sessions: ModuleOptionsSession;
  /* Main token config */
  token: ModuleOptionsToken;
  /* Refresh token config */
  refreshToken: ModuleOptionsRefreshToken;
  /* Config endpoints to server routes */
  endpoints: ModuleOptionsEndpoints;
  /* Pages redirecting config */
  pages: ModuleOptionsPages;
}
interface ModuleOptionsSession {
  /* Enabled refresh user data every N ms. Default: undefined
  * Example: one getMe request in 5 seconds. value > 5000
  * Example: disable refresh. value > undefined
  * */
  refreshEvery?: number;
  /* Cookie prefix in app storage. Default: localAuth
  * Example: localAuth:token -> {token}
  * */
  cookiePrefix?: string;
}
interface ModuleOptionsToken {
  /* Lifetime token in seconds. Default: 86400
  * number: value in seconds
  * * Example: 1 day > value: 86400
  * string: path to auth expire key
  * * Example #1: { expireIn: 86400 } > value: 'expireIn'
  * * Example #2: { data: { expireIn: 86400 } } > value: 'data/expireIn'
  * */
  lifetime?: number | string;
  /* Path to token data. Default: 'token'
  * Example #1: { token: '...' } > value: 'token'
  * Example #2: { data: { accessToken: '...' } } > value: 'data/accessToken'
  * */
  path: string;
  /* Token type. Default: 'Bearer' */
  type?: string;
  /* Reading the token from the query parameter of the url string. Default: undefined
  * Example #1: https://.../{pages/auth}?token=.... value > 'token'
  * Example #2: reading is disabled. value > undefined
  * */
  queryKey?: string;
}
interface ModuleOptionsRefreshToken {
  /* Enabled refresh sessions in app. Default: false */
  enabled: boolean;
  /* Path to refresh token data. Default: 'refresh'
  * Example #1: { refresh: '...' } > value: 'refresh'
  * Example #2: { data: { refreshToken: '...' } } > value: 'data/refreshToken'
  * */
  path?: string;
  /* Name of key token in body request. Default: 'refresh'
  * Example: { refresh '...' } > value: 'refresh'
  * */
  bodyKey?: string;
  /* Reading the token from the query parameter of the url string. Default: 'refresh'
  * Example #1: https://.../{pages/auth}?refresh=.... value > 'refresh'
  * Example #2: reading is disabled. value > undefined
  * */
  queryKey?: string;
}
interface ModuleOptionsEndpoints {
  /* Auth config. Default:
  * path: 'auth/signIn'
  * method: 'POST'
  * */
  signIn: ModuleOptionsEndpointConfig;
  /* Get authorized user info config. Default:
  * path: 'users/me'
  * method: 'GET'
  * */
  getMe: ModuleOptionsEndpointConfig;
  /* Refresh token config. Default:
  * path: 'auth/refresh
  * method: 'POST'
  * */
  refreshToken?: ModuleOptionsEndpointConfig;
  /* Registration user config. Default: undefined -> disabled */
  signUp?: ModuleOptionsEndpointConfig;
  /* Logout config. Default: undefined -> disabled */
  signOut?: ModuleOptionsEndpointConfig;
}
interface ModuleOptionsPages {
  /* Page for authorization in the system. Default: '/login' */
  auth?: string;
  /* The standard page where to redirect the user after logging in. Default: '/' */
  defaultRedirect?: string;
  /* A page for catching a server shutdown when it is impossible to
  * get session data due to a timeout. Default: undefined
  * Example #1: redirect to '/error'. value > '/error/
  * Example #2: redirect is disabled. value > undefined
  * */
  serverIsDown?: string;
  /* Protecting all pages from guests. Default: false */
  protectAllPages?: boolean
}
interface ModuleOptionsEndpointConfig {
  path: string;
  method: 'POST' | 'GET';
}
