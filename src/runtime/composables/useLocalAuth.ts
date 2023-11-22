import type {
  UseLocalAuthData,
  UseLocalAuthConfig,
  UseLocalAuthResponse
} from '../types';
import { useRouter } from '#app';
import { computed } from 'vue';
import { LocalAuthError } from '../errors';
import { fetch, getContext } from '../helpers';
import useLocalAuthState from './useLocalAuthState';

async function signIn<T extends UseLocalAuthResponse = {}>(data: UseLocalAuthData, config?: UseLocalAuthConfig): Promise<T> {
  const { options, state: { saveSession } } = await getContext();
  const router = useRouter();
  const endpointConfig = options.endpoints.signIn!;

  try {
    const authData = await fetch<T>(endpointConfig, { body: data });

    saveSession(authData);
    await getMe();
    await router.push(config?.redirectTo ?? options.pages.defaultRedirect!);

    return authData;
  } catch (e: any) {
    if (e.response) throw new LocalAuthError(`signIn > [${e.statusCode}] > ${JSON.stringify(e.response._data)}`);
    else throw new LocalAuthError(e.message);
  }
}
async function signOut<T extends UseLocalAuthResponse = {}>(config?: UseLocalAuthConfig): Promise<T> {
  const { options, state: { clearSession } } = await getContext();
  const router = useRouter();
  const endpointConfig = options.endpoints.signOut!;

  if (options.endpoints.signOut) {
    try {
      return await fetch<T>(endpointConfig, { withToken: true });
    } catch (e: any) {
      throw new LocalAuthError(`signOut > [${e.statusCode}] > ${JSON.stringify(e.response._data)}`);
    } finally {
      clearSession();
      await router.push(config?.redirectTo ?? options.pages.auth!);
    }
  } else {
    clearSession();
    await router.push(config?.redirectTo ?? options.pages.auth!);
    return {} as T;
  }
}
async function getMe<T extends UseLocalAuthResponse = {}>(): Promise<T> {
  const { options, state: { token, data, meta } } = await getContext();
  const endpointConfig = options.endpoints.getMe!;

  if (!token.value) throw new LocalAuthError('getMe > token is null. SignIn first');

  try {
    const meData = await fetch<T>(endpointConfig, { withToken: true });

    Object.assign(data.value, meData);
    meta.value.status = 'authorized';

    return meData;
  } catch (e: any) {
    if (e.statusCode) {
      await signOut();
      throw new LocalAuthError(`getMe > [${e.statusCode}] > ${JSON.stringify(e.response._data)}`);
    } else {
      throw new LocalAuthError(`getMe > ${e.message}`);
    }
  }
}
async function refreshToken<T extends UseLocalAuthResponse = {}>(): Promise<T> {
  const { options, state: { meta, saveSession } } = await getContext();
  const endpointConfig = options.endpoints.refreshToken!;
  const refreshConfig = options.refreshToken;

  if (refreshConfig.enabled) {
    try {
      const refreshData = await fetch<T>(endpointConfig, {
        body: {
          [`${refreshConfig.bodyKey}`]: meta.value.refreshToken!
        }
      });

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
async function refreshTokenWithCheck<T extends UseLocalAuthResponse = {}>(): Promise<T | null> {
  const { options: { refreshToken: refreshTokenConfig }, state: { meta } } = await getContext();
  const metaData = meta.value;

  try {
    if (!refreshTokenConfig.enabled) throw Error('refresh token is disabled. Enable it in refreshToken/enabled');
    if (metaData.status !== 'authorized') throw Error('session is not found. Use signIn');
    if (Date.now() < +meta.value.exp! * 1000) return null;

    return await refreshToken<T>();
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
