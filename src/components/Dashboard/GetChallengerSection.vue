<template>
  <section class="section">
    <h3>抽挑戰者</h3>
    <div class="wheel-inner">
      <div class="wheel-controls">
        <button class="wheel-btn" @click="handleDrawFromWheel">開始抽籤</button>
        <button class="wheel-btn" @click="handleResetWheel">開始下一輪!</button>
        <button class="wheel-btn" @click="handleShowRemoveDialog">移除陣亡者</button>
      </div>

      <div class="wheel-display">
        <div v-if="gameStore.wheelPlayers.length === 0" class="no-players">
          輪盤已空，請按上方「開始下一輪!」
        </div>
        <div v-else class="wheel-players">
          <div v-for="player in gameStore.wheelPlayers" :key="player.name" class="wheel-player">
            {{ player.name }}
          </div>
        </div>
      </div>

      <div v-if="gameStore.currentChallenger" class="drawn-result">
        <p><strong>挑戰者：</strong>{{ gameStore.currentChallenger.challenger.name }}</p>
      </div>
    </div>

    <div v-if="showRemoveDialog" class="modal-overlay" @click="handleHideRemoveDialog">
      <div class="modal-content" @click.stop>
        <h4>移除陣亡者</h4>
        <p>選擇要永久移除的玩家：</p>
        <div class="player-list-modal">
          <div v-for="player in gameStore.players" :key="player.name" class="player-item">
            <span>{{ player.name }}</span>
            <button class="remove-btn" @click="handleRemovePlayer(player.name)">移除</button>
          </div>
        </div>
        <div class="modal-actions">
          <button class="cancel-btn" @click="handleHideRemoveDialog">取消</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGameStore } from '../../pinia/store'

const props = defineProps<{
  onRemovePlayer: (playerName: string) => void
}>()

const gameStore = useGameStore()
const showRemoveDialog = ref(false)

onMounted(() => {
  if (!gameStore.wheelInitialized) gameStore.initWheel()
})

function handleDrawFromWheel() {
  if (gameStore.wheelPlayers.length === 0) return
  if (!confirm('是否要開始抽籤？')) return
  const selected = gameStore.drawFromWheel()
  if (selected) gameStore.setChallenger(selected)
}

function handleResetWheel() {
  gameStore.resetWheel()
}

function handleShowRemoveDialog() {
  showRemoveDialog.value = true
}

function handleHideRemoveDialog() {
  showRemoveDialog.value = false
}

function handleRemovePlayer(playerName: string) {
  props.onRemovePlayer(playerName)
  showRemoveDialog.value = false
}
</script>

<style scoped>
.section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.wheel-inner {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1rem;
}

.wheel-controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.wheel-btn {
  padding: 0.75rem 1rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s;
}

.wheel-btn:hover:not(:disabled) {
  background-color: #2980b9;
}

.wheel-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.wheel-display {
  min-height: 200px;
  border: 2px dashed #bdc3c7;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-players {
  text-align: center;
  color: #7f8c8d;
}

.wheel-players {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
}

.wheel-player {
  background: #ecf0f1;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: bold;
  color: #2c3e50;
}

.drawn-result {
  text-align: center;
  padding: 1rem;
  background: #f8fbff;
  border-radius: 8px;
  border: 1px solid #d7e7fb;
}

.drawn-result p {
  margin: 0;
  font-size: 1.2rem;
  color: #2c3e50;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-content h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.player-list-modal {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.player-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #ecf0f1;
}

.player-item:last-child {
  border-bottom: none;
}

.remove-btn {
  padding: 0.25rem 0.5rem;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.remove-btn:hover {
  background: #c0392b;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  background: #95a5a6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.cancel-btn:hover {
  background: #7f8c8d;
}
</style>
