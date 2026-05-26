<template>
  <section class="section">
    <h3>玩家狀態</h3>
    <div class="player-list">
      <div v-for="player in players" :key="player.name" class="player-card" :class="{ eliminated: player.eliminated }">
        <div class="player-card-header">
          <div>
            <h4>{{ player.name }}</h4>
            <p class="player-meta">剩餘命數：{{ player.themeStack.items.filter((t: any) => !t.isConsumed).length }}</p>
          </div>
          <div class="player-badge">
            <span>連勝</span>
            <strong>{{ player.winStreak }}</strong>
          </div>
        </div>

        <div class="theme-list">
          <div
            v-for="theme in [...player.themeStack.items].reverse()"
            :key="theme.name"
            class="theme-pill"
            :class="themeClass(theme, player.name)"
            @click="handleThemeClick(player, theme)">
            <span class="theme-name">{{ theme.name }}</span>
            <button
              v-if="!theme.isActivated"
              class="revival-btn"
              @click.stop="openRevivalConfirm(player.name)"
              title="啟用復活題"
            >🔓</button>
          </div>
        </div>

        <div v-if="player.prop" class="prop-area">
          <button
            class="prop-btn"
            @click="handlePropClick(player)"
            :title="player.prop === 'time' ? '使用：時間+3秒' : '使用：盾牌'"
          >{{ propLabel(player.prop) }}</button>
        </div>
        <div class="status-indicator" :class="{ active: !player.eliminated }">
          {{ player.eliminated ? '已淘汰' : '存活' }}
        </div>
      </div>
    </div>

    <!-- 挑戰主持人 FAB -->
    <div v-if="!isPanelOpen" class="host-fab" @click="openPanel">
      ⚔️ 挑戰主持人
    </div>

    <!-- 展開面板 -->
    <div v-else class="host-panel">
      <div class="host-panel-header">
        <span class="host-panel-title">挑戰主持人</span>
        <button class="close-btn" @click="isPanelOpen = false">✕</button>
      </div>

      <div class="host-panel-body">
        <!-- 1. 指定挑戰者 -->
        <div class="panel-row">
          <label class="panel-label">挑戰者</label>
          <select v-model="selectedChallengerName" class="panel-select">
            <option v-for="p in gameStore.activePlayers" :key="p.name" :value="p.name">
              {{ p.name }}
            </option>
          </select>
        </div>

        <!-- 2. 主持人當前主題 -->
        <div class="panel-row">
          <label class="panel-label">主持人主題</label>
          <select v-model="selectedHostThemeKey" @change="onHostThemeChange" class="panel-select">
            <option value="" disabled>請選擇主題</option>
            <option v-for="t in gameStore.hostThemes" :key="t.name" :value="t.name">
              {{ t.name }}（{{ t.photos.length }} 張）
            </option>
          </select>
          <span v-if="gameStore.state.hostCurrentTheme" class="current-theme-hint">
            目前：{{ gameStore.state.hostCurrentTheme.name }}（{{ gameStore.state.hostCurrentTheme.photos.length }} 張）
          </span>
        </div>

        <!-- 3. 開始決鬥 -->
        <button
          class="duel-btn"
          :disabled="!selectedChallengerName || !gameStore.state.hostCurrentTheme"
          @click="handleStartDuel"
        >
          開始決鬥
        </button>
      </div>
    </div>

    <!-- Revival activation confirm modal -->
    <div v-if="revivalConfirmPlayer" class="modal-overlay" @click.self="revivalConfirmPlayer = null">
      <div class="modal-content">
        <h4>啟用復活題？</h4>
        <p>確認啟用 <strong>{{ revivalConfirmPlayer }}</strong> 的第四主題嗎？</p>
        <div class="modal-actions">
          <button class="cancel-btn" @click="revivalConfirmPlayer = null">取消</button>
          <button class="confirm-btn" @click="confirmRevival">確認啟用</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '../../pinia/store'
import { getThemeClass } from '../../utils/themeUtils'

const props = defineProps<{
  players: Array<any>
  onThemeClick: (player: any, theme: any) => void
  onStartHostBattle: (challengerName: string) => void
}>()

const gameStore = useGameStore()
const isPanelOpen = ref(false)
const selectedChallengerName = ref('')
const selectedHostThemeKey = ref('')
const revivalConfirmPlayer = ref<string | null>(null)

const selectableKeys = computed(() =>
  gameStore.currentChallenger ? gameStore.selectableThemeKeys : null
)

function themeClass(theme: any, playerName: string): string {
  return getThemeClass(theme, playerName, selectableKeys.value)
}

function handleThemeClick(player: any, theme: any): void {
  const cls = themeClass(theme, player.name)
  if (cls === 'consumed' || cls === 'revival-locked' || cls === 'temp-locked') return
  props.onThemeClick(player, theme)
}

function propLabel(prop: 'time' | 'shield'): string {
  return prop === 'time' ? '⏱' : '🛡'
}

function handlePropClick(player: any): void {
  if (!player.prop) return
  if (player.prop === 'time') {
    gameStore.applyTimeProp(player.name)
  } else {
    gameStore.consumeProp(player.name)
  }
}

function openRevivalConfirm(playerName: string): void {
  revivalConfirmPlayer.value = playerName
}

function confirmRevival(): void {
  if (revivalConfirmPlayer.value) {
    gameStore.activateRevivalTheme(revivalConfirmPlayer.value)
    revivalConfirmPlayer.value = null
  }
}

function openPanel() {
  if (!selectedChallengerName.value && gameStore.activePlayers.length > 0) {
    selectedChallengerName.value = gameStore.activePlayers[0].name
  }
  if (!selectedHostThemeKey.value && gameStore.state.hostCurrentTheme) {
    selectedHostThemeKey.value = gameStore.state.hostCurrentTheme.name
  }
  isPanelOpen.value = true
}

function onHostThemeChange() {
  const found = gameStore.hostThemes.find(t => t.name === selectedHostThemeKey.value)
  gameStore.setHostCurrentTheme(found ?? null)
}

function handleStartDuel() {
  if (!selectedChallengerName.value || !gameStore.state.hostCurrentTheme) return
  props.onStartHostBattle(selectedChallengerName.value)
  isPanelOpen.value = false
}
</script>

<style scoped>
.section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  border-color: #e74c3c;
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
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.theme-pill:hover {
  transform: translateY(-1px);
  background: #d97706;
}

.theme-pill.consumed {
  background: #cbd5e1;
  color: #475569;
}

.theme-name {
  flex: 1;
  text-align: center;
}

/* Temporarily locked: not the top theme, or challenger's own themes */
.theme-pill.temp-locked {
  background: #fde68a;
  color: #92400e;
  cursor: not-allowed;
  opacity: 0.75;
}

.theme-pill.temp-locked:hover {
  transform: none;
  background: #fde68a;
}

/* Revival theme not yet activated */
.theme-pill.revival-locked {
  background: #cbd5e1;
  color: #475569;
  cursor: not-allowed;
}

.theme-pill.revival-locked:hover {
  transform: none;
  background: #cbd5e1;
}

.revival-btn {
  background: none;
  border: 1px solid #94a3b8;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.1rem 0.3rem;
  flex-shrink: 0;
  line-height: 1;
}

.revival-btn:hover {
  background: #e2e8f0;
}

/* Prop display area */
.prop-area {
  margin-bottom: 0.75rem;
  display: flex;
  gap: 0.5rem;
}

.prop-btn {
  font-size: 1.5rem;
  background: none;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.25rem 0.6rem;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  line-height: 1;
}

.prop-btn:hover {
  border-color: #f59e0b;
  background: #fffbeb;
}

/* Confirm modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal-content {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  max-width: 360px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-content h4 {
  margin: 0 0 0.75rem 0;
  color: #1f2937;
}

.modal-content p {
  margin: 0 0 1.25rem 0;
  color: #374151;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  background: #e5e7eb;
  color: #374151;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.cancel-btn:hover {
  background: #d1d5db;
}

.confirm-btn {
  padding: 0.5rem 1rem;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.confirm-btn:hover {
  background: #6d28d9;
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

/* FAB */
.host-fab {
  position: fixed;
  bottom: 1.5rem;
  left: 1.5rem;
  z-index: 100;
  padding: 0.6rem 1.1rem;
  background: #7c3aed;
  color: white;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.35);
  transition: background 0.2s, transform 0.15s;
  user-select: none;
}

.host-fab:hover {
  background: #6d28d9;
  transform: translateY(-2px);
}

/* Expanded panel */
.host-panel {
  position: fixed;
  bottom: 1.5rem;
  left: 1.5rem;
  width: min(340px, calc(100% - 2.5rem));
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  z-index: 10;
}

.host-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.host-panel-title {
  font-weight: 700;
  color: #7c3aed;
  font-size: 0.95rem;
}

.close-btn {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  transition: color 0.15s;
}

.close-btn:hover {
  color: #374151;
}

.host-panel-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.panel-row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.panel-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.panel-select {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #1f2937;
  background: #f9fafb;
}

.current-theme-hint {
  font-size: 0.8rem;
  color: #7c3aed;
}

.duel-btn {
  width: 100%;
  padding: 0.75rem;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s;
}

.duel-btn:hover:not(:disabled) {
  background: #6d28d9;
}

.duel-btn:disabled {
  background: #c4b5fd;
  cursor: not-allowed;
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
</style>
