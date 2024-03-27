import type { Ref } from "vue";
import type {
  ModuleOptions,
  UseLocalAuthResponse,
  UseLocalAuthCredentials,
  UseLocalAuthSession
} from '../types';
import useUtils from "../composables/useUtils";
import { computed, watch } from "vue";
import { useCookie, useState, useRuntimeConfig } from "#app";

const { trimEndWithSymbol } = useUtils();

export default function () {
  const options = useRuntimeConfig().public.localAuth as ModuleOptions;

  const sessionData = useState<UseLocalAuthCredentials>('localAuth:Credentials', () => ({}));
  let cookieData = useState('localAuth:Cookie', () => useCookie<UseLocalAuthSession | null>(options.sessions.cookiePrefix!, { default: () => null }));
  const sessionMetaInfo: Ref<UseLocalAuthSession> = useState('localAuth:Meta', () => ({
    token: null,
    refreshToken: null,
    exp: null,
    status: 'unknown'
  }));

  useState('localAuth:CookieWatcher', () => watch(sessionMetaInfo, (value, oldValue) => {
    if (oldValue) {
      cookieData = useCookie<UseLocalAuthSession | null>(options.sessions.cookiePrefix!, {
        default: () => null,
        maxAge: value.exp! - Math.round(Date.now() / 1000)
      });
      cookieData.value = value.token ? value : null;
    } else {
      try {
        if (cookieData.value) {
          const decodeCookie = cookieData.value;

          value.token = decodeCookie.token;
          value.refreshToken = decodeCookie.refreshToken;
          value.exp = decodeCookie.exp;
          value.status = decodeCookie.status;
        }
      } catch (e) { /* empty */ }
    }
  }, { immediate: true }));

  const token = computed(() => sessionMetaInfo.value.token ? `${options.token.type} ${sessionMetaInfo.value.token}`.trim() : null);
  const origin = trimEndWithSymbol(options.origin, '/');

  function parseValueWithPath<T = string>(data: UseLocalAuthResponse, path: string): T | undefined {
    return path
      .split('/')
      .reduce((accum, current) => {
        if (!accum) return undefined;
        accum = accum[current];
        return accum;
      }, data as UseLocalAuthResponse | undefined) as T | undefined;
  }

  function softClearMeta(): void {
    sessionMetaInfo.value = {
      token: null,
      refreshToken: null,
      exp: null,
      status: sessionMetaInfo.value.status
    };
  }
  function clearMeta(): void {
    sessionMetaInfo.value = {
      token: null,
      refreshToken: null,
      exp: null,
      status: 'unauthorized'
    };

    clearSession();
  }
  function softSaveMeta(token: string, refreshToken: string | null): void {
    clearMeta();

    sessionMetaInfo.value.token = token;
    sessionMetaInfo.value.refreshToken = refreshToken;
    sessionMetaInfo.value.exp = Math.round(Date.now() / 1000) + (options.token.lifetime as number);
  }
  function saveMeta(data: UseLocalAuthResponse, metaUpdate: boolean = false): void {
    metaUpdate ? softClearMeta() : clearMeta();
    let parsedRefreshToken: string | undefined,
      parsedLifetime: number | undefined;

    const parsedToken = parseValueWithPath(data, options.token.path);
    if (!parsedToken) throw new Error('error parse auth token. Check current token/path');

    if (options.refreshToken.enabled) {
      parsedRefreshToken = parseValueWithPath(data, options.refreshToken.path!);
      if (!parsedRefreshToken) throw new Error('error parse refresh token. Check current token/refreshPath');
    }

    const lifetime = options.token.lifetime as string | number;
    if (typeof lifetime === 'string') {
      parsedLifetime = parseValueWithPath<number>(data, lifetime);
      if (!parsedLifetime) throw new Error('error parse lifetime token. Check current token/lifetime');
    } else {
      parsedLifetime = Math.round(Date.now() / 1000) + lifetime;
    }

    sessionMetaInfo.value.token = parsedToken as string;
    sessionMetaInfo.value.refreshToken = parsedRefreshToken as string;
    sessionMetaInfo.value.exp = parsedLifetime;
  }
  function clearSession(): void {
    sessionMetaInfo.value.status = 'unauthorized';

    for (const key of Object.keys(sessionData.value)) {
      delete sessionData.value[key];
    }
  }
  function saveSession(data: UseLocalAuthCredentials): void {
    clearSession();
    let parsedData: UseLocalAuthCredentials | undefined;

    if (options.sessions.path) {
      parsedData = parseValueWithPath(data, options.sessions.path);
      if (!parsedData) throw new Error('error parse session data. Check current session/path');
    } else {
      parsedData = data;
    }

    Object.assign(sessionData.value, parsedData);
    sessionMetaInfo.value.status = 'authorized';
  }

  const getters = {
    data: sessionData,
    meta: sessionMetaInfo,
    token,
    origin
  };
  const actions = {
    clearMeta,
    softClearMeta,
    saveMeta,
    softSaveMeta,
    saveSession,
    clearSession
  };

  return {
    ...getters,
    ...actions
  };
}
