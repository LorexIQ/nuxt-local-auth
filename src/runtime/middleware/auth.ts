import { defineNuxtRouteMiddleware, navigateTo, useRuntimeConfig } from '#imports';
import useUtils from "../composables/useUtils";
import { useLocalAuth } from "../composables/useLocalAuth";

type MiddlewareMeta = boolean | {
  unauthorizedOnly?: boolean;
};

declare module '#app/../pages/runtime/composables' {
  interface PageMeta {
    localAuth?: MiddlewareMeta;
  }
}

export default defineNuxtRouteMiddleware(to => {
  const metaAuth = typeof to.meta.localAuth === 'object' ?
    {
      unauthorizedOnly: true,
      ...to.meta.localAuth
    } :
    to.meta.localAuth;

  if (metaAuth === false) return;

  const options = useRuntimeConfig().public.localAuth;
  const { trimStartWithSymbol } = useUtils();
  const { meta } = useLocalAuth();
  const isAuthorized = meta.value.status === 'authorized';
  const isUnauthorizedOnly = typeof metaAuth === 'object' ? metaAuth.unauthorizedOnly : false;

  if (isAuthorized && to.path === options.pages.auth && isUnauthorizedOnly) {
    return navigateTo(`/${trimStartWithSymbol(options.pages.defaultRedirect, '/')}`);
  }

  if (!isAuthorized && to.path !== options.pages.auth) {
    return navigateTo(`/${trimStartWithSymbol(options.pages.auth, '/')}`);
  }
});
