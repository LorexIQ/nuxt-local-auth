import { defineNuxtPlugin, addRouteMiddleware } from '#app'
import { useLocalAuth } from '#imports'
import auth from "./middleware/auth";

export default defineNuxtPlugin(async () => {
  const { token, getMe } = useLocalAuth()

  try {
    if (token.value) await getMe();
  } catch (e) {}

  addRouteMiddleware('auth', auth, {
    global: true
  });
});
