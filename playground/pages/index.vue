<script setup lang="ts">
const route = useRoute()
const auth = useLocalAuth();

function testSignOut() {
  auth.signOut();
}

definePageMeta({
  localAuth: true
})
</script>

<template>
  <div>
    {{auth}}
    <button @click="testSignOut">testSignOut</button>
  </div>
</template>
