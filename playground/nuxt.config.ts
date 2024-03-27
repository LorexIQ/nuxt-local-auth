const env = {
  serverOrigin: process.env.SERVER_ORIGIN ?? '/'
};

export default defineNuxtConfig({
  ssr: false,
  modules: ['../src/module'],
  //modules: ['nuxt-local-auth'],

  runtimeConfig: {
    public: {
      ...env
    }
  },

  localAuth: {
    origin: env.serverOrigin,
    token: {
      lifetime: 60 * 60 * 24,
      path: 'access',
      queryKey: 'token'
    },
    sessions: {
      refreshEvery: 5000
    },
    refreshToken: {
      enabled: true
    },
    pages: {
      protectAllPages: true,
      serverIsDown: undefined
    },
    endpoints: {
      signIn: { path: '/auth/', method: 'POST' },
      signUp: { path: '/auth/reg', method: 'POST' },
      getMe: { path: 'users/me/', method: 'GET' },
      refreshToken: { path: '/auth/refresh/', method: 'POST' }
    }
  },

  devtools: { enabled: true }
})
