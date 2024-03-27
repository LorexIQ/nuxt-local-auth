import { defineNuxtPlugin, addRouteMiddleware } from '#app'
import { useLocalAuth, watch } from '#imports'
import { getContext } from './helpers';
import auth from "./middleware/auth";

export default defineNuxtPlugin(async () => {
  const { options, state: { token, meta } } = await getContext();
  const { getMe, checkAndSaveQueryAuth } = useLocalAuth();
  let pendingInterval: NodeJS.Timeout;

  try {
    if (options.token.queryKey) {
      await checkAndSaveQueryAuth();
    }
  } catch (e) { /* empty */ }
  try {
    if (token.value) {
      await getMe();
    }
  } catch (e) { /* empty */ }

  if (options.sessions.refreshEvery) {
    watch(meta, value => {
      clearInterval(pendingInterval);
      if (value) {
        pendingInterval = setInterval(async () => {
          if (meta.value.token) await getMe();
          else clearInterval(pendingInterval);
        }, options.sessions.refreshEvery);
      }
    }, { immediate: true });
  }

  addRouteMiddleware('auth', auth, {
    global: true
  });
});
