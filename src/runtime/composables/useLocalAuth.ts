import { useRouter, useNuxtApp, callWithNuxt, useRuntimeConfig } from '#app';
import { computed } from 'vue';
import useLocalAuthState from './useLocalAuthState';
import { LocalAuthError } from '../errors';
import type {ModuleOptions} from "../../module";
import type {
  UseLocalAuthData,
  UseLocalAuthConfig
} from '../types';
import useUtils from "./useUtils";

const { trimStartWithSymbol } = useUtils();

async function getContext() {
  const nuxt = useNuxtApp();
  const options = (await callWithNuxt(nuxt, useRuntimeConfig)).public.localAuth as ModuleOptions;
  const state = await callWithNuxt(nuxt, useLocalAuthState);

  return {
    options,
    state
  };
}

async function signIn<T = void>(data: UseLocalAuthData, config?: UseLocalAuthConfig): Promise<T> {
  const { options, state: { origin, saveSession } } = await getContext();
  const router = useRouter();
  const endpointConfig = options.endpoints.signIn!;

  try {
    const authData = await $fetch(
      `${origin}/${trimStartWithSymbol(endpointConfig.path, '/')}`,
      {
        method: endpointConfig.method,
        body: data
      }
    );

    saveSession(authData);
    await getMe();
    await router.push(config?.redirectTo ?? options.pages.defaultRedirect!);

    return authData;
  } catch (e: any) {
    if (e.response) throw new LocalAuthError(`signIn > [${e.statusCode}] > ${JSON.stringify(e.response._data)}`);
    else throw new LocalAuthError(e.message);
  }
}
async function signOut(config?: UseLocalAuthConfig): Promise<void> {
  const { options, state: { origin, clearSession } } = await getContext();
  const router = useRouter();
  const endpointConfig = options.endpoints.signOut!;

  if (options.endpoints.signOut) {
    try {
      await $fetch(
        `${origin}/${trimStartWithSymbol(endpointConfig.path, '/')}`,
        {
          method: endpointConfig.method
        }
      );
    } catch (e: any) {
      throw new LocalAuthError(`signOut > [${e.statusCode}] > ${JSON.stringify(e.response._data)}`);
    } finally {
      clearSession();
      await router.push(config?.redirectTo ?? options.pages.auth!);
    }
  } else {
    clearSession();
    await router.push(config?.redirectTo ?? options.pages.auth!);
  }
}
async function getMe<T>(): Promise<T> {
  const { options, state: { token, origin, data, meta } } = await getContext();
  const endpointConfig = options.endpoints.getMe!;

  if (!token.value) throw new LocalAuthError('getMe > token is null. logout...');

  try {
    const meData = await $fetch(
      `${origin}/${trimStartWithSymbol(endpointConfig.path, '/')}`,
      {
        method: endpointConfig.method,
        headers: {
          'Authorization': token.value
        }
      }
    );

    Object.assign(data.value, meData);
    meta.value.status = 'authorized';

    return meData;
  } catch (e: any) {
    throw new LocalAuthError(`getMe > [${e.statusCode}] > ${JSON.stringify(e.response._data)}`);
  }
}
async function refreshToken<T>(): Promise<T> {
  const { options, state: { origin, meta, saveSession, clearSession } } = await getContext();
  const endpointConfig = options.endpoints.refreshToken!;
  const refreshConfig = options.refreshToken;

  if (refreshConfig.enabled) {
    try {
      const refreshData = await $fetch(
        `${origin}/${trimStartWithSymbol(endpointConfig.path, '/')}`,
        {
          method: endpointConfig.method,
          body: {
            [`${refreshConfig.bodyKey}`]: meta.value.refreshToken
          }
        }
      );

      saveSession({
        [`${refreshConfig.path}`]: meta.value.refreshToken,
        ...refreshData
      }, true);

      return refreshData;
    } catch (e: any) {
      throw new LocalAuthError(`refreshToken > [${e.statusCode}] > ${JSON.stringify(e.response._data)}`);
    }

  } else {
    throw new LocalAuthError('refreshToken > refresh token is disabled. Enable it in refreshToken/enabled');
  }
}
async function refreshTokenWithCheck<T>(): Promise<T | null> {
  const {
    options: {
      refreshToken: refreshTokenConfig,
      token: tokenConfig
    },
    state: {
      meta
    }
  } = await getContext();
  const metaData = meta.value;

  try {
    if (!refreshTokenConfig.enabled) throw Error('refresh token is disabled. Enable it in refreshToken/enabled');
    if (metaData.status !== 'authorized') throw Error('session is not found. Use signIn');
    if (Date.now() < +meta.value.exp! * 1000) return null;

    return await refreshToken();
  } catch (e: any) {
    throw new LocalAuthError(`refreshTokenWithCheck > ${e.message}`);
  }
}

export function useLocalAuth() {
  const { data, meta, token } = useLocalAuthState()

  const getters = {
    data: computed(() => data.value),
    meta,
    token
  };

  const actions = {
    signIn,
    signOut,
    getMe,
    refreshToken,
    refreshTokenWithCheck
  };

  return {
    ...getters,
    ...actions
  };
}
