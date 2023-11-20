import {
  defineNuxtModule,
  addPlugin,
  createResolver,
  addImports,
  addRouteMiddleware
} from '@nuxt/kit'
import defu from "defu";

interface ModuleOptionsEndpointConfig {
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
  /* Path to refresh token data. Default: undefined -> refresh disabled
  * Example #1: { refresh: '...' } > value: 'refresh'
  * Example #2: { data: { refreshToken: '...' } } > value: 'data/refreshToken'
  * Example #3: { } > value: undefined
  * */
  refreshPath?: string;
  /* Token type. Default: 'Bearer'
  * */
  type?: string;
}
interface ModuleOptionsPages {
  /* Page for authorization in the system. Default: '/login'
  * */
  auth?: string;
  /* The standard page where to redirect the user after logging in. Default: '/'
  * */
  defaultRedirect?: string;
}
export interface ModuleOptions {
  /* Path to server. Default: ''
  * Example: 'http://localhost:8000/api/v1' - remote server
  * Example: 'api' - local nuxt server
  * */
  origin: string;
  /* Cookie prefix in app storage. Default: localAuth
  * Example: localAuth:token -> {token}
  * */
  cookiePrefix?: string;
  token: ModuleOptionsToken;
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
    cookiePrefix: 'localAuth',
    token: {
      lifetime: 86400,
      path: 'token',
      refreshPath: undefined,
      type: 'Bearer'
    },
    endpoints: {
      signIn: { path: 'auth/signIn', method: 'POST' },
      getMe: { path: 'users/me', method: 'GET' },
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
