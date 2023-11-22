import {
  defineNuxtModule,
  addPlugin,
  createResolver,
  addImports,
  addRouteMiddleware
} from '@nuxt/kit'
import defu from "defu";

export interface ModuleOptionsEndpointConfig {
  path: string;
  method: 'POST' | 'GET';
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
  /* Registration user config. Default: undefined -> disabled
  * */
  signUp?: ModuleOptionsEndpointConfig;
  /* Logout config. Default: undefined -> disabled
  * */
  signOut?: ModuleOptionsEndpointConfig;
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
  /* Token type. Default: 'Bearer'
  * */
  type?: string;
}
interface ModuleOptionsRefreshToken {
  /* Enabled refresh sessions in app. Default: false
  * */
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
interface ModuleOptionsPages {
  /* Page for authorization in the system. Default: '/login'
  * */
  auth?: string;
  /* The standard page where to redirect the user after logging in. Default: '/'
  * */
  defaultRedirect?: string;
  /* A page for catching a server shutdown when it is impossible to
  * get session data due to a timeout. Default: '/error'
  * */
  serverIsDown?: string;
}
export interface ModuleOptions {
  /* Path to server. Default: ''
  * Example: 'http://localhost:8000/api/v1' - remote server
  * Example: 'api' - local nuxt server
  * */
  origin: string;
  sessions: ModuleOptionsSession;
  token: ModuleOptionsToken;
  refreshToken: ModuleOptionsRefreshToken;
  endpoints: ModuleOptionsEndpoints;
  pages: ModuleOptionsPages;
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-local-auth',
    configKey: 'localAuth'
  },
  defaults: {
    origin: '',
    sessions: {
      refreshEvery: undefined,
      cookiePrefix: 'localAuth',
    },
    token: {
      lifetime: 86400,
      path: 'token',
      type: 'Bearer'
    },
    refreshToken: {
      enabled: false,
      path: 'refresh',
      bodyKey: 'refresh'
    },
    endpoints: {
      signIn: { path: 'auth/signIn', method: 'POST' },
      getMe: { path: 'users/me', method: 'GET' },
      refreshToken: { path: 'auth/refresh', method: 'POST' },
      signUp: undefined,
      signOut: undefined
    },
    pages: {
      auth: '/login',
      defaultRedirect: '/'
    }
  },
  setup (options, nuxt) {
    const resolver = createResolver(import.meta.url);
    nuxt.options.runtimeConfig.public.localAuth = defu(
      nuxt.options.runtimeConfig.public.localAuth,
      options
    );

    addRouteMiddleware({
      name: 'auth',
      path: resolver.resolve('runtime/middleware/auth')
    });
    addImports({
      name: 'useLocalAuth',
      from: resolver.resolve('runtime/composables/useLocalAuth')
    });
    addPlugin(resolver.resolve('./runtime/plugin'));
  }
})
