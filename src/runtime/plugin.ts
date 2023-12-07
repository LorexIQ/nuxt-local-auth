import { defineNuxtPlugin, addRouteMiddleware } from 'nuxt/app'
import { getContext } from './helpers';
import auth from "./middleware/auth";
import {useLocalAuth} from "./composables/useLocalAuth";
import {watch} from "vue";

export default defineNuxtPlugin(async () => {
  const { options, state: { token, meta } } = await getContext();
  const { getMe, checkAndSaveQueryAuth } = useLocalAuth();
  let pendingInterval: NodeJS.Timeout;

  try {
    if (options.token.queryKey) await checkAndSaveQueryAuth();
  } catch (e) {}
  try {
    if (token.value) await getMe();
  } catch (e) {
    console.error(e);
  }

  // eslint-disable-next-line
  if (!!options.sessions.refreshEvery) {
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
