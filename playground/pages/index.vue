<script setup lang="ts">
const auth = useLocalAuth();

definePageMeta({
  localAuth: true
})
</script>

<template>
  <div>
    <div>
      {{auth}}
    </div>
    <button @click="() => auth.signOut()">testSignOut</button>
    <button @click="() => auth.refreshToken()">testRefreshToken</button>
    <button @click="() => auth.refreshTokenWithCheck()">testRefreshWithCheckToken</button>
  </div>
</template>
