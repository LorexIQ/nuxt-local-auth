import { useRouter, useNuxtApp, callWithNuxt, useRuntimeConfig } from '#app';
import { computed } from 'vue';
import useLocalAuthState from './useLocalAuthState';
import type {ModuleOptions} from "../../module";
import type {
  UseLocalAuthData,
  UseLocalAuthConfig
} from '../types';
import useUtils from "./useUtils";

const { trimStartWithSymbol } = useUtils();

class LocalAuthError extends Error {
  constructor(message: string = '') {
    super(message);
    this.name = 'LocalAuthError';
  }
}

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
// async function refreshToken()

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
    getMe
  };

  return {
    ...getters,
    ...actions
  };
}
