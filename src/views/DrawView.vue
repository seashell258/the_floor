<template>
  <div class="draw-page">
    <div class="page-header">
      <h2>抽連勝獎勵</h2>
      <button class="back-btn" @click="goBack">回主畫面</button>
    </div>

    <section class="section">
      <label for="player-select" class="label">選擇玩家</label>
      <select id="player-select" v-model="selectedPlayerName" class="player-select">
        <option v-for="player in gameStore.players" :key="player.name" :value="player.name">
          {{ player.name }}
        </option>
      </select>
    </section>

    <section class="section">
      <h3>抽籤結果</h3>
      <p class="description">按下「開始抽獎」，隨機選一個連勝獎勵。</p>
      <button class="draw-btn" @click="drawReward">開始抽獎</button>
      <div v-if="result" class="draw-result">
        <p><strong>玩家：</strong>{{ selectedPlayerDisplay }}</p>
        <p><strong>抽中獎勵：</strong>{{ result }}</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../pinia/store'

const router = useRouter()
const gameStore = useGameStore()
const rewardOptions = [
  '對方秒數-3秒',
  '拒絕一次對戰邀請'
]
const selectedPlayerName = ref(gameStore.players[0]?.name || '')
const result = ref<string | null>(null)

const selectedPlayerDisplay = computed(() => {
  const player = gameStore.players.find(p => p.name === selectedPlayerName.value)
  return player ? player.name : 'Unknown'
})

function drawReward() {
  const reward = rewardOptions[Math.floor(Math.random() * rewardOptions.length)]
  const player = gameStore.players.find(p => p.name === selectedPlayerName.value)
  if (!player) return

  gameStore.applyWinReward(player.name, reward)
  gameStore.recordDrawResult(player.name, reward)
  result.value = reward
}

function goBack() {
  router.push('/dashboard')
}
</script>

<style scoped>
.draw-page {
  width: 100%;
}

h2 {
  margin: 0;
  color: #2c3e50;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.back-btn {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 10px;
  background: #95a5a6;
  color: white;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s ease;
}

.back-btn:hover {
  background: #7f8c8d;
}

.section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: bold;
  color: #34495e;
}

.player-select {
  width: 100%;
  padding: 1rem;
  border: 1px solid #dce1e7;
  border-radius: 8px;
  font-size: 1rem;
}

.draw-btn {
  width: 100%;
  padding: 1rem;
  margin-top: 1rem;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: bold;
  color: white;
  background: #3498db;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.draw-btn:hover {
  background: #2980b9;
}

.draw-btn:active {
  transform: scale(0.98);
}

.draw-result {
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 8px;
  background: #f8fbff;
  border: 1px solid #d7e7fb;
}

.draw-result p {
  margin: 0.5rem 0;
  color: #2c3e50;
}

.description {
  color: #7f8c8d;
  margin-bottom: 1rem;
}
</style>
