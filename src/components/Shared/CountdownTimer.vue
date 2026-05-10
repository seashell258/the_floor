<template>
  <div class="countdown-timer">
    <div class="timer-display">{{ timeRemaining }}s</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  timeRemaining: number
}>()
</script>

<style scoped>
.countdown-timer {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.timer-display {
  font-size: 3rem;
  font-weight: bold;
  color: #e74c3c;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
