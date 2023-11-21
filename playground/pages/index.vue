<script setup lang="ts">
const auth = useLocalAuth();

definePageMeta({
  localAuth: true
})
</script>

<template>
  <div>
    {{auth}}
    <button @click="() => auth.signOut()">testSignOut</button>
    <button @click="() => auth.refreshTokenWithCheck()">testRefreshToken</button>
  </div>
</template>
