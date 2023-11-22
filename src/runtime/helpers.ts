import type {ModuleOptions} from "../module";
import type {UseLocalAuthFetchConfig, UseLocalAuthResponse} from "./types";
import {callWithNuxt, useNuxtApp, useRuntimeConfig} from "#app";
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
  const { state: { token, origin} } = await getContext();

  return await $fetch(
    `${origin}/${trimStartWithSymbol(endpoint.path, '/')}`,
    {
      method: endpoint.method,
      body: config.body,
      headers: config.withToken ? { 'Authorization': token.value! } : {}
    }
  );
}
