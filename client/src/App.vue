<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div id="app-shell">
    <RouterView v-slot="{ Component }">
      <component :is="Component" class="page-fill" />
    </RouterView>
  </div>
</template>

<style>
#app-shell {
  width: 100%;
  max-width: 1126px;
  margin: 0 auto;
  min-height: 100dvh;
  min-height: 100svh;
  box-sizing: border-box;
  border-inline: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex: 1 0 auto;
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.page-fill {
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  #app-shell {
    max-width: none;
    border-inline: none;
  }
}
</style>
