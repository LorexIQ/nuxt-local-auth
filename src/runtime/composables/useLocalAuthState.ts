import type { ModuleOptions } from "../../module";
import {computed, watch} from "vue";
import type { Ref } from "vue";
import { useCookie, useState } from "#app";
import useUtils from "../composables/useUtils";

const { trimWithSymbol } = useUtils();

export default function () {
  const options = useRuntimeConfig().public.localAuth as ModuleOptions;

  const sessionData = useState<UseLocalAuthCredentials>('localAuth:Credentials', () => ({}));
  const cookieData = useState('localAuth:Cookie', () => useCookie<UseLocalAuthSession | null>('localAuth', { default: () => null }));
  const sessionMetaInfo: Ref<UseLocalAuthSession> = useState('localAuth:Meta', () => ({
    token: null,
    refreshToken: null,
    lastSessionUpdate: null,
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
          value.lastSessionUpdate = decodeCookie.lastSessionUpdate;
          value.status = decodeCookie.status;
        }
      } catch (e) {}
    }
  }, { immediate: true }));

  const token = computed(() => sessionMetaInfo.value.token ? `${options.token.type} ${sessionMetaInfo.value.token}`.trim() : null);
  const origin = trimWithSymbol(options.origin, '/');

  function clearSession(): void {
    sessionMetaInfo.value = {
      token: null,
      refreshToken: null,
      lastSessionUpdate: null,
      status: 'unauthorized'
    };

    for (const key of Object.keys(sessionData.value)) {
      delete sessionData.value[key];
    }
  }
  function saveSession(data: UseLocalAuthResponse): void {
    clearSession();

    const parsedToken = options.token.path
      .split('/')
      .reduce((accum, current) => accum = accum[current], data) as unknown as string | undefined;

    if (!parsedToken) throw new Error('error parse auth token. Check current token/path');
    sessionMetaInfo.value.token = parsedToken as string;

    if (options.token.refreshPath) {
      const parsedRefreshToken = options.token.refreshPath
        .split('/')
        .reduce((accum, current) => accum = accum[current], data) as unknown as string | undefined;
      if (!parsedToken) throw new Error('error parse refresh token. Check current token/refreshPath');
      sessionMetaInfo.value.refreshToken = parsedRefreshToken as string;
    }

    sessionMetaInfo.value.lastSessionUpdate = `${Math.round(Date.now() / 1000)}`;
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
