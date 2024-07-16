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
      path: 'token',
      queryKey: 'token'
    },
    sessions: {
      refreshEvery: 5000
    },
    pages: {
      protectAllPages: true,
      handleIsServerDown: true
    },
    endpoints: {
      signIn: { path: '/auth/authentication', method: 'POST' },
      signUp: { path: '/auth/reg', method: 'POST' },
      getMe: { path: 'user/me', method: 'GET' },
      refreshToken: { path: '/auth/refresh/', method: 'POST' }
    }
  },

  devtools: { enabled: true }
})
