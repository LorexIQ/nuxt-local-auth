<script setup lang="ts">
import type {NuxtError} from "#app";

interface Props {
  error: NuxtError;
}

const props = defineProps<Props>();
</script>

<template>
  <div>
    ERROR
    {{error.data}}
  </div>
</template>

<style scoped>

</style>
