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
  background: var(--bg-panel);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--glow);
  box-shadow: 0 0 20px var(--glow-10);
}

.section h3 {
  margin: 0 0 1rem 0;
  color: var(--text);
  font-family: 'Chakra Petch', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.draw-inner {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.label {
  font-weight: bold;
  color: var(--text-muted);
  font-family: 'Chakra Petch', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 0.85rem;
}

.player-select {
  width: 100%;
  padding: 0.95rem 1rem;
  border: 1px solid rgba(25, 233, 255, 0.25);
  border-radius: 8px;
  font-size: 1rem;
  color: var(--text);
  background: var(--bg-surface);
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
}

.draw-btn {
  margin: 1rem 0;
  padding: 0.75rem 1rem;
  width: 100%;
  background: var(--glow);
  color: var(--bg-panel);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-family: 'Chakra Petch', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  transition: background 0.2s;
}

.draw-btn:hover {
  background: var(--glow-bright);
}

.draw-result {
  padding: 1rem;
  background: var(--bg-surface);
  border-radius: 8px;
  border: 1px solid var(--glow-30);
  color: var(--text);
}

.draw-result strong {
  color: var(--glow);
}

.no-result {
  padding: 1rem;
  background: var(--bg-surface);
  border-radius: 4px;
  text-align: center;
  color: var(--text-muted);
}
</style>
