import type {ModuleOptions} from "./runtime/types";
import {
  defineNuxtModule,
  addPlugin,
  createResolver,
  addImports,
  addRouteMiddleware
} from '@nuxt/kit'
import defu from "defu";

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-local-auth',
    configKey: 'localAuth'
  },
  defaults: {
    origin: '',
    sessions: {
      path: undefined,
      refreshEvery: undefined,
      cookiePrefix: 'localAuth',
    },
    token: {
      lifetime: 86400,
      path: 'token',
      type: 'Bearer',
      queryKey: undefined,
    },
    refreshToken: {
      enabled: false,
      path: 'refresh',
      bodyKey: 'refresh',
      queryKey: 'refresh'
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
      defaultRedirect: '/',
      serverIsDown: undefined,
      protectAllPages: false,
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
