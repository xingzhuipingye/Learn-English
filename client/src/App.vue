<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div id="app-shell">
    <RouterView />
  </div>
</template>

<style>
#app-shell {
  width: 100%;
  max-width: 1126px;
  margin: 0 auto;
  min-height: 100svh;
  box-sizing: border-box;
  border-inline: 1px solid var(--border);
}
</style>
