<template>
  <div class="dashboard">
    <h2>秦翼 the floor 知識王大賽!</h2>

    <div class="dashboard-header">
      <button :class="{ active: activeTab === 'battle' }" @click="activeTab = 'battle'">開始對戰</button>
      <button :class="{ active: activeTab === 'players' }" @click="activeTab = 'players'">玩家狀態</button>
      <button :class="{ active: activeTab === 'draw' }" @click="activeTab = 'draw'">抽連勝獎勵</button>
      <button :class="{ active: activeTab === 'wheel' }" @click="activeTab = 'wheel'">抽挑戰者</button>
    </div>

    <div class="dashboard-content">
      <BattleSection
        v-if="activeTab === 'battle'"
        :battleInfo="gameStore.currentBattle"
        :voteResults="gameStore.voteResults"
        :selectedThemeName="selectedThemeName"
        :selectedThemePhotos="selectedThemePhotos"
        :currentPhotoIndex="currentPhotoIndex"
        :onNextPhoto="nextPhoto"
        :onStartDemo="startDemo"
      />

      <PlayersSection
        v-if="activeTab === 'players'"
        :players="gameStore.players"
        :onThemeClick="handleThemeClick"
      />

      <DrawSection
        v-if="activeTab === 'draw'"
        :players="gameStore.players"
        :selectedPlayerName="drawSelectedPlayerName"
        :onSelectedPlayerChange="updateDrawSelectedPlayerName"
        :onDrawReward="drawReward"
        :drawResults="gameStore.drawResults"
      />

      <WheelSection
        v-if="activeTab === 'wheel'"
        :wheelPlayers="gameStore.wheelPlayers"
        :drawnPlayer="drawnPlayer"
        :showRemoveDialog="showRemoveDialog"
        :onDrawFromWheel="drawFromWheel"
        :onResetWheel="resetWheel"
        :onShowRemoveDialog="openRemoveDialog"
        :onHideRemoveDialog="closeRemoveDialog"
        :onRemovePlayer="permanentlyRemovePlayer"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '../pinia/store'
import BattleSection from '../components/Dashboard/BattleSection.vue'
import PlayersSection from '../components/Dashboard/PlayersSection.vue'
import DrawSection from '../components/Dashboard/DrawSection.vue'
import WheelSection from '../components/Dashboard/WheelSection.vue'

const gameStore = useGameStore()
const activeTab = ref<'battle' | 'players' | 'draw' | 'wheel'>('battle')
const drawSelectedPlayerName = ref(gameStore.players[0]?.name || '')
const rewardOptions = ['對方秒數-3秒', '拒絕一次對戰邀請']
const showRemoveDialog = ref(false)
const drawnPlayer = ref<any>(null)

const selectedThemePhotos = ref<string[]>([])
const currentPhotoIndex = ref(0)
const selectedThemeName = ref('')
const selectedBattlePlayerName = ref('')
const opponentName = '對手'

function startDemo() {
  gameStore.startBattle('Player 1', 'Player 2', 'https://via.placeholder.com/300x200?text=Demo+Image')
  gameStore.recordVote(1, '冠維')
  gameStore.recordVote(1, '海螺')
  gameStore.recordVote(1, '大貓貓')
  gameStore.recordVote(2, '小王')
  gameStore.recordVote(2, '漁夫')
}

function handleThemeClick(player: any, theme: any) {
  selectedThemeName.value = theme.name
  selectedBattlePlayerName.value = player.name
  selectedThemePhotos.value = theme.photos ?? []
  currentPhotoIndex.value = 0

  if (selectedThemePhotos.value.length > 0) {
    gameStore.startBattle(player.name, opponentName, selectedThemePhotos.value[0])
  }

  activeTab.value = 'battle'
}

function nextPhoto() {
  if (currentPhotoIndex.value >= selectedThemePhotos.value.length - 1) return
  currentPhotoIndex.value += 1
  const nextImage = selectedThemePhotos.value[currentPhotoIndex.value]
  if (nextImage) {
    gameStore.startBattle(selectedBattlePlayerName.value || 'Player', opponentName, nextImage)
  }
}

function drawReward() {
  if (!confirm('是否要開始抽獎？')) return

  const reward = rewardOptions[Math.floor(Math.random() * rewardOptions.length)]
  const player = gameStore.players.find(p => p.name === drawSelectedPlayerName.value)
  if (!player) return

  gameStore.applyWinReward(player.name, reward)
  gameStore.recordDrawResult(player.name, reward)
}

function resetWheel() {
  gameStore.resetWheel()
  drawnPlayer.value = null
}

function drawFromWheel() {
  if (!confirm('是否要開始抽籤？')) return
  drawnPlayer.value = gameStore.drawFromWheel()
}

function updateDrawSelectedPlayerName(name: string) {
  drawSelectedPlayerName.value = name
}

function openRemoveDialog() {
  showRemoveDialog.value = true
}

function closeRemoveDialog() {
  showRemoveDialog.value = false
}

function permanentlyRemovePlayer(playerName: string) {
  gameStore.permanentlyRemovePlayer(playerName)
  showRemoveDialog.value = false
}
</script>

<style scoped>
.dashboard {
  width: 100%;
}

h2 {
  margin-bottom: 2rem;
  color: #2c3e50;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dashboard-header {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.dashboard-header button {
  padding: 0.9rem 1.2rem;
  border: none;
  border-radius: 999px;
  background: #ecf0f1;
  color: #34495e;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.dashboard-header button.active,
.dashboard-header button:hover {
  background: #3498db;
  color: white;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.player-list {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1rem;
}

.player-card {
  padding: 1rem;
  background-color: #ffffff;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.player-card:hover {
  transform: translateY(-2px);
}

.player-card.eliminated {
  opacity: 0.55;
  filter: grayscale(0.35);
}

.player-card-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.player-card-header h4 {
  margin: 0 0 0.35rem 0;
  color: #1f2937;
  font-size: 1.15rem;
}

.player-meta {
  margin: 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.player-badge {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 0.55rem 0.85rem;
  background: rgba(245, 166, 35, 0.15);
  border-radius: 999px;
}

.player-badge span {
  color: #b45309;
  font-size: 0.8rem;
}

.player-badge strong {
  color: #c2410c;
  font-size: 1rem;
}

.theme-list {
  display: grid;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.theme-pill {
  padding: 0.75rem 0.9rem;
  border-radius: 999px;
  background: #f59e0b;
  color: white;
  font-weight: 700;
  text-align: center;
}

.theme-pill.consumed {
  background: #cbd5e1;
  color: #475569;
}

.player-reward {
  margin: 0 0 0.75rem 0;
  color: #334155;
  font-size: 0.95rem;
}

.status-indicator {
  display: inline-block;
  padding: 0.35rem 0.7rem;
  background-color: #ecf0f1;
  color: #7f8c8d;
  border-radius: 5px;
  font-size: 0.85rem;
  font-weight: 700;
}

.status-indicator.active {
  background-color: #d5f4e6;
  color: #166534;
}

@media (min-width: 768px) {
  .player-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .player-list {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.battle-section {
  min-height: 720px;
  display: flex;
  flex-direction: column;
}

.battle-stage {
  flex: 1;
  display: flex;
  align-items: stretch;
}

.battle-card,
.no-battle.large {
  width: 100%;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.battle-card {
  overflow: hidden;
}

.battle-meta {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.battle-meta .label {
  display: block;
  color: #7f8c8d;
  font-size: 0.85rem;
}

.battle-image {
  width: 100%;
  height: calc(100% - 90px);
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.battle-bottom {
  display: flex;
  justify-content: flex-end;
  font-weight: bold;
  color: #2c3e50;
}

.answer-panel {
  margin-top: 1.5rem;
  border-radius: 12px;
  background: #f7fbff;
  border: 1px solid #d7e7fb;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  min-height: 220px;
}

.answer-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.answer-side {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.answer-side.right {
  align-items: flex-end;
}

.answer-player {
  font-weight: bold;
  color: #2c3e50;
}

.answer-votes {
  font-size: 0.95rem;
  color: #34495e;
}

.answer-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: white;
  border-radius: 10px;
  color: #7f8c8d;
  text-align: center;
}

.answer-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.next-btn {
  padding: 0.8rem 1.2rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}

.next-btn:hover {
  background: #2980b9;
}

.no-battle.large {
  min-height: 100%;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.no-battle.large button {
  margin-top: 1rem;
}

.no-result {
  padding: 1rem;
  background-color: #ecf0f1;
  border-radius: 4px;
  text-align: center;
  color: #7f8c8d;
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

.draw-btn,
.draw-page-btn {
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

.draw-btn:hover,
.draw-page-btn:hover {
  background-color: #2980b9;
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
