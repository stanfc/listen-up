<script setup lang="ts">
import { computed } from 'vue'
import GameSetup from './components/GameSetup.vue'
import QuickGame from './components/QuickGame.vue'
import { useGameStore } from './stores/gameStore'

const gameStore = useGameStore()
const isGameActive = computed(() => gameStore.isGamePlaying || gameStore.isGameFinished)
</script>

<template>
  <div id="app">
    <GameSetup v-if="!isGameActive" @game-started="() => {}" />
    <QuickGame v-else />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

#app {
  width: 100%;
  min-height: 100vh;
}
</style>
