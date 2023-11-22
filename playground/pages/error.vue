<script setup lang="ts">
import {useLocalAuth} from "#imports";

const auth = useLocalAuth();
</script>

<template>
  <div>
    error
    {{auth}}
  </div>
</template>

<style scoped>

</style>
