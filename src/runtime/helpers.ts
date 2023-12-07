import type {
  ModuleOptions,
  UseLocalAuthFetchConfig,
  UseLocalAuthResponse
} from "./types";
import {
  callWithNuxt,
  useNuxtApp,
  useRuntimeConfig,
  navigateTo
} from "#app";
import useLocalAuthState from "./composables/useLocalAuthState";
import useUtils from "./composables/useUtils";

const { trimStartWithSymbol } = useUtils();

export async function getContext() {
  const nuxt = useNuxtApp();
  const options = (await callWithNuxt(nuxt, useRuntimeConfig)).public.localAuth as ModuleOptions;
  const state = await callWithNuxt(nuxt, useLocalAuthState);

  return {
    options,
    state
  };
}
export async function fetch<T extends UseLocalAuthResponse>(
  endpoint: ModuleOptions['endpoints']['signIn'],
  _config: UseLocalAuthFetchConfig
): Promise<T> {
  const config: UseLocalAuthFetchConfig = {
    withToken: false,
    ..._config,
  }
  const { options, state: { token, origin, meta} } = await getContext();

  try {
    return await $fetch(
      `${origin}/${trimStartWithSymbol(endpoint.path, '/')}`,
      {
        method: endpoint.method,
        body: config.body,
        headers: config.withToken ? { 'Authorization': token.value! } : {}
      }
    );
  } catch (e: any) {
    console.log(options)
    if (!e.statusCode && options.pages.serverIsDown) {
      meta.value.status = 'timeout';
      navigateTo(options.pages.serverIsDown);
    }
    throw e;
  }
}
