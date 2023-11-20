export default defineNuxtConfig({
  ssr: false,
  //modules: ['../src/module'],
  modules: ['../dist/module'],

  localAuth: {
    origin: 'https://catman-dev.atrinix.ru/api/v1/',
    token: {
      path: 'access',
      refreshPath: 'refresh',
    },
    endpoints: {
      signIn: { path: '/auth/', method: 'POST' },
      getMe: { path: 'users/me/', method: 'GET' },
    }
  },

  devtools: { enabled: true }
})
