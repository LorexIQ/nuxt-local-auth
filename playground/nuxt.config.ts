export default defineNuxtConfig({
  ssr: false,
  modules: ['../src/module'],
  //modules: ['nuxt-local-auth'],

  localAuth: {
    origin: 'https://catman-dev.atrinix.ru/api/v1/',
    token: {
      lifetime: 5,
      path: 'access'
    },
    sessions: {
      refreshEvery: 5000
    },
    refreshToken: {
      enabled: true
    },
    pages: {
      protectAllPages: true
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
