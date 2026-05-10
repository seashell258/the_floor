<template>
  <div class="draw-result">
    <h4>Draw Result</h4>
    <div v-if="result" class="result-info">
      <p><strong>Winner:</strong> {{ result.winner }}</p>
      <p><strong>Reward:</strong> {{ result.reward }}</p>
    </div>
    <div v-else class="no-result">
      No draw result yet
    </div>
  </div>
</template>

<script setup lang="ts">
interface DrawResult {
  winner: string
  reward: 'timer_advantage' | 'protection'
}

defineProps<{
  result: DrawResult | null
}>()
</script>

<style scoped>
.draw-result {
  padding: 1rem;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.draw-result h4 {
  margin-top: 0;
  color: #2c3e50;
}

.result-info {
  padding: 1rem;
  background-color: #f0f7ff;
  border-left: 4px solid #3498db;
  border-radius: 4px;
}

.result-info p {
  margin: 0.5rem 0;
}

.no-result {
  padding: 1rem;
  background-color: #ecf0f1;
  border-radius: 4px;
  text-align: center;
  color: #7f8c8d;
}
</style>
