<template>
  <section class="section">
    <h3>抽連勝獎勵</h3>
    <div class="draw-inner">
      <label for="player-select" class="label">選擇玩家</label>
      <select
        id="player-select"
        :value="selectedPlayerName"
        @change="handleChange"
        class="player-select"
      >
        <option v-for="player in players" :key="player.name" :value="player.name">
          {{ player.name }}
        </option>
      </select>

      <button class="draw-btn" @click="onDrawReward">開始抽獎</button>

      <div v-if="drawResults" class="draw-result">
        <p><strong>玩家：</strong>{{ drawResults.winner }}</p>
        <p><strong>抽中獎勵：</strong>{{ drawResults.reward }}</p>
      </div>
      <div v-else class="no-result">
        No draw result yet
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{
  players: Array<any>
  selectedPlayerName: string
  onSelectedPlayerChange: (value: string) => void
  onDrawReward: () => void
  drawResults: Record<string, any> | null
}>()

const { players, selectedPlayerName, onSelectedPlayerChange, onDrawReward, drawResults } = props

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  onSelectedPlayerChange(target.value)
}
</script>

<style scoped>
.section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.draw-inner {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.label {
  font-weight: bold;
  color: #34495e;
}

.player-select {
  width: 100%;
  padding: 0.95rem 1rem;
  border: 1px solid #dce1e7;
  border-radius: 8px;
  font-size: 1rem;
  color: #2c3e50;
}

.draw-btn {
  margin: 1rem 0;
  padding: 0.75rem 1rem;
  width: 100%;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s;
}

.draw-btn:hover {
  background-color: #2980b9;
}

.draw-result {
  padding: 1rem;
  background: #f8fbff;
  border-radius: 8px;
  border: 1px solid #d7e7fb;
}

.no-result {
  padding: 1rem;
  background-color: #ecf0f1;
  border-radius: 4px;
  text-align: center;
  color: #7f8c8d;
}
</style>
