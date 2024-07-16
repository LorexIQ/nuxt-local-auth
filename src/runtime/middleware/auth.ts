import { defineNuxtRouteMiddleware, navigateTo, createError } from '#imports';
import useUtils from "../composables/useUtils";
import { getContext } from "../helpers";

export type MiddlewareMeta = boolean | {
  unauthorizedOnly?: boolean;
  authorizedOnly?: boolean;
};

declare module '#app/../pages/runtime/composables' {
  export interface PageMeta {
    localAuth?: MiddlewareMeta;
  }
}

export default defineNuxtRouteMiddleware(async to => {
  const { options, state: { meta} } = await getContext();
  const { trimStartWithSymbol } = useUtils();

  const metaAuth = typeof to.meta.localAuth === 'object' ?
    {
      unauthorizedOnly: false,
      authorizedOnly: false,
      ...to.meta.localAuth
    } :
    to.meta.localAuth;

  if (
    !metaAuth &&
    !options.pages.protectAllPages
  ) return;
  if (metaAuth === false) return;

  const isAuthorized = meta.value.status === 'authorized';
  const isTimeout = meta.value.status === 'timeout';
  const isUnauthorizedOnly = typeof metaAuth === 'object' ? metaAuth.unauthorizedOnly : false;
  const isAuthorizedOnly = typeof metaAuth === 'object' ? metaAuth.authorizedOnly : false;

  if (isTimeout && options.pages.handleIsServerDown) {
    throw createError({
      statusCode: 504,
      statusMessage: 'ERR_CONNECTION_TIMED_OUT',
      data: {
        description: 'Ошибка соединения с сервером, возможно он обслуживается. Попробуйте ещё раз позже'
      }
    });
  }
  if (isAuthorized && to.path !== options.pages.defaultRedirect && isUnauthorizedOnly) {
    return navigateTo(`/${trimStartWithSymbol(options.pages.defaultRedirect!, '/')}`);
  }
  if (!isAuthorized && to.path !== options.pages.defaultRedirect && isAuthorizedOnly) {
    return navigateTo(`/${trimStartWithSymbol(options.pages.defaultRedirect!, '/')}`);
  }
  if (!isAuthorized && to.path !== options.pages.auth && !isUnauthorizedOnly) {
    return navigateTo(`/${trimStartWithSymbol(options.pages.auth!, '/')}`);
  }
});
