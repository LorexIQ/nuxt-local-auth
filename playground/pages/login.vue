<script setup lang="ts">
const auth = useLocalAuth();

function testAuth() {
  auth
    .signIn({
      username: 'ao_admin',
      password: 'ao_admin'
    })
    .then(res => console.log(res))
    .catch(e => console.error('Error', e))
}

definePageMeta({
  localAuth: {
    unauthorizedOnly: true
  }
})
</script>

<template>
  <div>
    LOGIN

    {{auth}}
    <div>
      <button @click="testAuth">AUTH</button>
    </div>
  </div>
</template>

<style scoped>

</style>
