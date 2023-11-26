# Nuxt Local Auth

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

My new Nuxt module for doing amazing things.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)
<!-- - [🏀 Online playground](https://stackblitz.com/github/your-org/my-module?file=playground%2Fapp.vue) -->
<!-- - [📖 &nbsp;Documentation](https://example.com) -->

## Features:
- 📃 REST requests
- 🔑 Login, Registration, Logout, session receipt, refresh token
- 🔧 Flexible system of page protection settings
- ⚡ Server shutdown detection system

## Quick Setup

1. Add `nuxt-local-auth` dependency to your project

```bash
# Using pnpm
pnpm add -D nuxt-local-auth

# Using yarn
yarn add --dev nuxt-local-auth

# Using npm
npm install --save-dev nuxt-local-auth
```

2. Add `nuxt-local-auth` to the `modules` section of `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  modules: [
    'nuxt-local-auth'
  ]
});
```

That's it! You can now use Nuxt Local Auth in your Nuxt app ✨

## Configuration

Default settings of module. See all interfaces [here](#-module-config-interfaces).

```ts
export default defineNuxtConfig({
  localAuth: {
    origin: '',
    sessions: {
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
      serverIsDown: '/error',
      protectAllPages: false,
    }
  }
});
```

## Example

Use `useLocalAuth` to get auth context methods. Return interface see [here](#-uselocalauth-return-interfaces)

```ts
const auth = useLocalAuth();

type SignInResponse = {
    accessToken: string;
};

// You can use type response for all auth methods
auth.signIn<SignInResponse>({
  login: 'admin',
  password: 'admin'
}).then(res => {
    console.log(res.accessToken);
}).catch(e => {
    console.error(e);
});
```

### 🌀 Refresh token

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  localAuth: {
    refreshToken: {
      enabled: true,
      bodyKey: 'refresh'
    },
    endpoints: {
      refreshToken: { path: 'auth/refresh/', method: 'POST' },
    }
  }
});
```

Since to update the token, you need to execute the `{origin}/{endpoints/refreshToken/path}` request by passing the token in its body, you need to specify under which key the token will be transferred. To do this, there is a `bodyKey` parameter in the `refreshToken` section

After enabling refresh tokens, the `refreshToken` and `refreshTokenWithCheck` methods will stop giving an error.

```ts
const { refreshToken, refreshTokenWithCheck } = useLocalAuth();

// Forced update token
await refreshToken();

// Check whether the token is rotten or not, and then update
await refreshTokenWithCheck();
```
How does the `refreshTokenWithCheck` function understand when to update the token? It's simple! In the `token` section, you can find the `lifetime` parameter, which, by default, has a value of `86400` seconds, which is equal to one day, after logging in. You can change this value to set the token lifetime, or specify the path to the value from the authorization response that the server will return.

Example:
- Server response
  ```json
  {
    "accessToken": "...",
    "refreshToken": "...",
    "exp": 123123
  }
  ```
- You need to set the value `lifetime`: `'exp'`

### 🖇️ Auth with url query tokens

To use authorization via the url string, you need to set the value of this key in the `token` section, the `queryKey` key. After that, the mechanism will start working. It is also possible to read the `refresh` token from the query string, the key is set as `refresh` by default, but it will not work without enabling the main `token`.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  localAuth: {
    token: {
      queryKey: 'token'
    },
    refreshToken: {
      enabled: true,
      queryKey: 'refresh'
    },
    pages: {
      auth: 'login'
    }
  }
});
```

The query string will look like this: `{clientOrigin}/{pages/auth}?{token/queryKey}=...&{refreshToken/queryKey}=...`

Work example: `http://localhost:3000/login?token=...&refresh=...`

As a result, an automatic login will be performed. If the refresh token is not passed, the system will also be able to start, but all methods of updating the token will stop working

### 🔒 Page Protecting

Page protection can be organized in two ways: global protection and configuration of a specific page, via definePageMeta

1. Global Protecting
    ```ts
    // nuxt.config.ts
    export default defineNuxtConfig({
      localAuth: {
        pages: {
          auth: 'login',
          protectAllPages: true
        }
      }
    });
    ```

2. definePageMeta
    ```vue
    <!--    pages/login.vue-->
    <script lang="ts" setup>
    // Example #1 - disable middleware
    definePageMeta({
        localAuth: false
    });
    // Example #2 - enable middleware
    definePageMeta({
        localAuth: true
    });
    // Example #3 - authorized users only
    definePageMeta({
        localAuth: {
            authorizedOnly: true
        }
    });
    // Example #4 - unauthorized users only
    definePageMeta({
        localAuth: {
            unauthorizedOnly: true
        }
    });
    // Example #5 - closed page from all 😁
    definePageMeta({
        localAuth: {
            authorizedOnly: true,
            unauthorizedOnly: true
        }
    });
    </script>
    ```
   

### 🔥 Server is disabled

The module has a mechanism for catching long responses, or domain unavailability. In such cases, the module will redirect the user to the error page, which can be set in the `pages` `serverIsDown` section.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  localAuth: {
    pages: {
      serverIsDown: '/error'
    }
  }
});
```

If the server returns an error code, a `logout` will be performed, and the user will be redirected to the page specified in `auth`. After logging in, the user will be directed to `defaultRedirect`, which can be changed for a specific case in the config of the method itself, passing the path in the `redirectTo` key.

## Interfaces

#### ⚡ Module config interfaces

```ts
interface ModuleOptions {
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
```

#### ⚙️ `useLocalAuth` return interfaces

```ts
interface UseLocalAuthReturn extends UseLocalAuthReturnData, UseLocalAuthReturnMethods {}

interface UseLocalAuthReturnData {
  data: ComputedRef<UseLocalAuthCredentials>;
  meta: Ref<UseLocalAuthSession>;
  token: ComputedRef<string | null>;
}

interface UseLocalAuthReturnMethods {
  signIn<T extends UseLocalAuthResponse = {}>(data: UseLocalAuthData, config?: UseLocalAuthConfig): Promise<T>;
  signUp<T extends UseLocalAuthResponse = {}>(data: UseLocalAuthData, config?: UseLocalAuthConfig): Promise<T>;
  signOut<T extends UseLocalAuthResponse = {}>(config?: UseLocalAuthConfig): Promise<T>;
  getMe<T extends UseLocalAuthResponse = {}>(): Promise<T>;
  refreshToken<T extends UseLocalAuthResponse = {}>(): Promise<T>;
  refreshTokenWithCheck<T extends UseLocalAuthResponse = {}>(): Promise<T | null>;
  checkAndSaveQueryAuth(): Promise<void>;
}
```

#### 🔥 Another types

```ts
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
```

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-local-auth/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/nuxt-local-auth

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-local-auth.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://npmjs.com/package/nuxt-local-auth

[license-src]: https://img.shields.io/npm/l/nuxt-local-auth.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/nuxt-local-auth

[nuxt-src]: https://img.shields.io/badge/Nuxt-18181B?logo=nuxt.js
[nuxt-href]: https://nuxt.com
