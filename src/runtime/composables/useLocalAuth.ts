import type {
  UseLocalAuthData,
  UseLocalAuthConfig,
  UseLocalAuthResponse,
  UseLocalAuthReturn,
  UseLocalAuthReturnData,
  UseLocalAuthReturnMethods
} from '../types';
import { useRouter, useRoute } from '#app';
import { computed } from 'vue';
import { LocalAuthError } from '../errors';
import { fetch, getContext } from '../helpers';
import useLocalAuthState from './useLocalAuthState';

async function signIn<T extends UseLocalAuthResponse = {}>(data: UseLocalAuthData, config?: UseLocalAuthConfig): Promise<T> {
  const { options, state: { saveMeta } } = await getContext();
  const router = useRouter();
  const endpointConfig = options.endpoints.signIn!;

  try {
    const authData = await fetch<T>(endpointConfig, { body: data });

    saveMeta(authData);
    await getMe();
    await router.push(config?.redirectTo ?? options.pages.defaultRedirect!);

    return authData;
  } catch (e: any) {
    if (e.response) throw new LocalAuthError(e, `[${e.statusCode}] > ${JSON.stringify(e.response._data)}`, signIn.name);
    else throw new LocalAuthError(e, e.message);
  }
}
async function signUp<T extends UseLocalAuthResponse = {}>(data: UseLocalAuthData, config?: UseLocalAuthConfig): Promise<T> {
  const { options, state: { saveMeta } } = await getContext();
  const router = useRouter();
  const endpointConfig = options.endpoints.signUp!;

  if (!endpointConfig) throw new LocalAuthError(undefined, 'signUp is disabled. Enable it in endpoints/signUp', signUp.name);

  try {
    const signUpData = await fetch<T>(endpointConfig, { body: data });

    saveMeta(signUpData);
    await getMe();
    await router.push(config?.redirectTo ?? options.pages.defaultRedirect!);

    return signUpData;
  } catch (e: any) {
    if (e.response) throw new LocalAuthError(e, `[${e.statusCode}] > ${JSON.stringify(e.response._data)}`, signUp.name);
    else throw new LocalAuthError(e, e.message);
  }
}
async function signOut<T extends UseLocalAuthResponse = {}>(config?: UseLocalAuthConfig): Promise<T> {
  const { options, state: { clearMeta } } = await getContext();
  const router = useRouter();
  const endpointConfig = options.endpoints.signOut!;

  if (options.endpoints.signOut) {
    try {
      return await fetch<T>(endpointConfig, { withToken: true });
    } catch (e: any) {
      throw new LocalAuthError(e, `[${e.statusCode}] > ${JSON.stringify(e.response._data)}`, signOut.name);
    } finally {
      clearMeta();
      await router.push(config?.redirectTo ?? options.pages.auth!);
    }
  } else {
    clearMeta();
    await router.push(config?.redirectTo ?? options.pages.auth!);
    return {} as T;
  }
}
async function getMe<T extends UseLocalAuthResponse = {}>(): Promise<T> {
  const { options, state: { token, saveSession } } = await getContext();
  const endpointConfig = options.endpoints.getMe!;

  if (!token.value) throw new LocalAuthError(undefined, 'token is null. SignIn first', getMe.name);

  try {
    await refreshTokenWithCheck();
  } catch (e) { /* empty */ }

  try {
    const meData = await fetch<T>(endpointConfig, { withToken: true });

    saveSession(meData);

    return meData;
  } catch (e: any) {
    if (e.statusCode) {
      await signOut();
      throw new LocalAuthError(e, `[${e.statusCode}] > ${JSON.stringify(e.response._data)}`, 'getMe');
    } else {
      throw new LocalAuthError(e, `getMe > ${e.message}`);
    }
  }
}
async function refreshToken<T extends UseLocalAuthResponse = {}>(): Promise<T> {
  const { options, state: { meta, saveMeta } } = await getContext();
  const endpointConfig = options.endpoints.refreshToken!;
  const refreshConfig = options.refreshToken;

  if (refreshConfig.enabled) {
    if (!meta.value.refreshToken) throw new LocalAuthError(undefined, `refreshToken is null`, refreshToken.name);

    try {
      const refreshData = await fetch<T>(endpointConfig, {
        body: {
          [`${refreshConfig.bodyKey}`]: meta.value.refreshToken!
        }
      });

      saveMeta({
        [`${refreshConfig.path}`]: meta.value.refreshToken,
        ...refreshData
      }, true);

      return refreshData;
    } catch (e: any) {
      await signOut();
      throw new LocalAuthError(e, `[${e.statusCode}] > ${JSON.stringify(e.response._data)}`, refreshToken.name);
    }

  } else {
    throw new LocalAuthError(undefined, 'refresh token is disabled. Enable it in refreshToken/enabled', refreshToken.name);
  }
}
async function refreshTokenWithCheck<T extends UseLocalAuthResponse = {}>(): Promise<T | null> {
  const { options: { refreshToken: refreshTokenConfig }, state: { meta } } = await getContext();
  const metaData = meta.value;

  if (!metaData.refreshToken) throw new LocalAuthError(undefined, `refreshToken is null`, refreshTokenWithCheck.name);

  try {
    if (!refreshTokenConfig.enabled) throw Error('refresh token is disabled. Enable it in refreshToken/enabled');
    if (metaData.status !== 'authorized') throw Error('session is not found. Use signIn');
    if (Date.now() < +meta.value.exp! * 1000) return null;

    return await refreshToken<T>();
  } catch (e: any) {
    throw new LocalAuthError(e, `${e.message}`, refreshTokenWithCheck.name);
  }
}
async function checkAndSaveQueryAuth(): Promise<void> {
  const { options, state: { softSaveMeta } } = await getContext();
  const route = useRoute();
  const query = route.query;

  const isTokenReading = options.token.queryKey;
  const isRefreshTokenReading = options.refreshToken.queryKey;

  if (!isTokenReading) throw new LocalAuthError(undefined, 'token is not configure. Set key in token/queryKey', checkAndSaveQueryAuth.name);

  try {
    const token = query[isTokenReading] ?? null;
    const refreshToken = query[isRefreshTokenReading!] ?? null;

    if (token) softSaveMeta(token as string, refreshToken as string | null);
  } catch (e: any) { /* empty */ }
}

export function useLocalAuth(): UseLocalAuthReturn {
  const { data, meta, token, origin } = useLocalAuthState()

  const getters: UseLocalAuthReturnData = {
    data: computed(() => data.value),
    meta,
    origin,
    token
  };

  const actions: UseLocalAuthReturnMethods = {
    signIn,
    signUp,
    signOut,
    getMe,
    refreshToken,
    refreshTokenWithCheck,
    checkAndSaveQueryAuth
  };

  return {
    ...getters,
    ...actions
  };
}
