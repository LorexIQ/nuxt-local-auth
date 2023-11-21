import type { ModuleOptions } from "../../module";
import {computed, watch} from "vue";
import type { Ref } from "vue";
import type {
  UseLocalAuthResponse,
  UseLocalAuthCredentials,
  UseLocalAuthSession
} from '../types';
import { useCookie, useState, useRuntimeConfig } from "#app";
import useUtils from "../composables/useUtils";

const { trimWithSymbol } = useUtils();

export default function () {
  const options = useRuntimeConfig().public.localAuth as ModuleOptions;

  const sessionData = useState<UseLocalAuthCredentials>('localAuth:Credentials', () => ({}));
  const cookieData = useState('localAuth:Cookie', () => useCookie<UseLocalAuthSession | null>('localAuth', { default: () => null }));
  const sessionMetaInfo: Ref<UseLocalAuthSession> = useState('localAuth:Meta', () => ({
    token: null,
    refreshToken: null,
    exp: null,
    status: 'unknown'
  }));

  useState('localAuth:CookieWatcher', () => watch(sessionMetaInfo, (value, oldValue) => {
    if (oldValue) {
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
      } catch (e) {}
    }
  }, { immediate: true }));

  const token = computed(() => sessionMetaInfo.value.token ? `${options.token.type} ${sessionMetaInfo.value.token}`.trim() : null);
  const origin = trimWithSymbol(options.origin, '/');

  function softClearSession(): void {
    sessionMetaInfo.value = {
      token: null,
      refreshToken: null,
      exp: null,
      status: sessionMetaInfo.value.status
    };
  }
  function clearSession(): void {
    sessionMetaInfo.value = {
      token: null,
      refreshToken: null,
      exp: null,
      status: 'unauthorized'
    };

    for (const key of Object.keys(sessionData.value)) {
      delete sessionData.value[key];
    }
  }
  function saveSession(data: UseLocalAuthResponse, metaUpdate: boolean = false): void {
    function parseValueWithPath(data: UseLocalAuthResponse, path: string): string | undefined {
      return path
          .split('/')
          .reduce((accum, current) => {
            if (!accum) return undefined;
            accum = accum[current];
            return accum;
          }, data as UseLocalAuthResponse | undefined) as string | undefined;
    }

    metaUpdate ? softClearSession() : clearSession();
    let parsedToken, parsedRefreshToken, parsedLifetime;

    parsedToken = parseValueWithPath(data, options.token.path);
    if (!parsedToken) throw new Error('error parse auth token. Check current token/path');

    if (options.refreshToken.enabled) {
      parsedRefreshToken = parseValueWithPath(data, options.refreshToken.path!);
      if (!parsedToken) throw new Error('error parse refresh token. Check current token/refreshPath');
    }

    const lifetime = options.token.lifetime as string | number;
    if (typeof options.token.lifetime === 'string') {
      parsedLifetime = parseValueWithPath(data, options.token.lifetime!);
      if (!parsedLifetime) throw new Error('error parse lifetime token. Check current token/lifetime');
    } else {
      parsedLifetime = `${Math.round(Date.now() / 1000) + (lifetime as number)}`;
    }

    sessionMetaInfo.value.token = parsedToken as string;
    sessionMetaInfo.value.refreshToken = parsedRefreshToken as string;
    sessionMetaInfo.value.exp = `${parsedLifetime}`;
  }

  const getters = {
    data: sessionData,
    meta: sessionMetaInfo,
    token,
    origin
  };
  const actions = {
    clearSession,
    saveSession
  };

  return {
    ...getters,
    ...actions
  };
}
