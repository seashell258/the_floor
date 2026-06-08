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

.player-list {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1rem;
}

.player-card {
  padding: 1rem;
  background-color: var(--bg-surface);
  border-radius: 14px;
  border: 1px solid var(--glow-30);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.player-card:hover {
  transform: translateY(-2px);
  border-color: var(--glow);
}

.player-card.eliminated {
  opacity: 0.5;
  border-color: var(--danger);
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
  color: var(--text);
  font-size: 1.15rem;
  font-family: 'Chakra Petch', sans-serif;
}

.player-meta {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.player-badge {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 0.55rem 0.85rem;
  background: rgba(245, 158, 11, 0.15);
  border-radius: 999px;
}

.player-badge span {
  color: var(--warn);
  font-size: 0.8rem;
  font-family: 'Chakra Petch', sans-serif;
}

.player-badge strong {
  color: var(--warn);
  font-size: 1rem;
  font-family: 'Chakra Petch', sans-serif;
}

.theme-list {
  display: grid;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.theme-pill {
  padding: 0.75rem 0.9rem;
  border-radius: 999px;
  background: var(--glow-10);
  color: var(--glow);
  border: 1px solid var(--glow-30);
  font-weight: 700;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
}

.theme-pill:hover {
  transform: translateY(-1px);
  background: var(--glow-30);
}

.theme-pill.consumed {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  border-color: transparent;
  cursor: default;
}

.theme-pill.consumed:hover {
  transform: none;
  background: rgba(255, 255, 255, 0.05);
}

.theme-name {
  flex: 1;
  text-align: center;
}

.theme-pill.temp-locked {
  background: rgba(245, 158, 11, 0.12);
  color: var(--warn);
  border-color: rgba(245, 158, 11, 0.3);
  cursor: not-allowed;
  opacity: 0.75;
}

.theme-pill.temp-locked:hover {
  transform: none;
  background: rgba(245, 158, 11, 0.12);
}

.theme-pill.revival-locked {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  border-color: transparent;
  cursor: not-allowed;
}

.theme-pill.revival-locked:hover {
  transform: none;
  background: rgba(255, 255, 255, 0.05);
}

.revival-btn {
  background: none;
  border: 1px solid var(--glow-30);
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.1rem 0.3rem;
  flex-shrink: 0;
  line-height: 1;
  color: var(--text-muted);
  transition: border-color 0.15s, color 0.15s;
}

.revival-btn:hover {
  border-color: var(--glow);
  color: var(--glow);
}

.prop-area {
  margin-bottom: 0.75rem;
  display: flex;
  gap: 0.5rem;
}

.prop-btn {
  font-size: 1.5rem;
  background: none;
  border: 2px solid var(--glow-30);
  border-radius: 8px;
  padding: 0.25rem 0.6rem;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  line-height: 1;
}

.prop-btn:hover {
  border-color: var(--glow);
  background: var(--glow-10);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal-content {
  background: var(--bg-panel);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--glow-30);
  max-width: 360px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.modal-content h4 {
  margin: 0 0 0.75rem 0;
  color: var(--text);
  font-family: 'Chakra Petch', sans-serif;
}

.modal-content p {
  margin: 0 0 1.25rem 0;
  color: var(--text-muted);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  background: var(--bg-surface);
  color: var(--text-muted);
  border: 1px solid rgba(25, 233, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Chakra Petch', sans-serif;
  transition: color 0.15s;
}

.cancel-btn:hover {
  color: var(--text);
}

.confirm-btn {
  padding: 0.5rem 1rem;
  background: var(--glow);
  color: #000d2b;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Chakra Petch', sans-serif;
  font-weight: 700;
}

.confirm-btn:hover {
  background: #3df5ff;
}

.status-indicator {
  display: inline-block;
  padding: 0.35rem 0.7rem;
  background: rgba(255, 255, 255, 0.05);
  color: var(--danger);
  border-radius: 5px;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: 'Chakra Petch', sans-serif;
}

.status-indicator.active {
  background: var(--glow-10);
  color: var(--glow);
  border: 1px solid var(--glow-30);
}

.host-fab {
  position: fixed;
  bottom: 1.5rem;
  left: 1.5rem;
  z-index: 100;
  padding: 0.6rem 1.1rem;
  background: var(--glow);
  color: #000d2b;
  border-radius: 999px;
  font-weight: 700;
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 0 4px 16px var(--glow-30);
  transition: background 0.2s, transform 0.15s;
  user-select: none;
}

.host-fab:hover {
  background: #3df5ff;
  transform: translateY(-2px);
}

.host-panel {
  position: fixed;
  bottom: 1.5rem;
  left: 1.5rem;
  width: min(340px, calc(100% - 2.5rem));
  background: var(--bg-panel);
  border: 1px solid var(--glow-30);
  border-radius: 14px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  z-index: 10;
}

.host-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid rgba(25, 233, 255, 0.1);
}

.host-panel-title {
  font-weight: 700;
  color: var(--glow);
  font-size: 0.95rem;
  font-family: 'Chakra Petch', sans-serif;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1rem;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  transition: color 0.15s;
}

.close-btn:hover {
  color: var(--text);
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
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-family: 'Chakra Petch', sans-serif;
}

.panel-select {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid rgba(25, 233, 255, 0.25);
  border-radius: 8px;
  font-size: 0.95rem;
  color: var(--text);
  background: var(--bg-surface);
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
}

.current-theme-hint {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.duel-btn {
  width: 100%;
  padding: 0.75rem;
  background: var(--glow);
  color: #000d2b;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.95rem;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  transition: background 0.2s;
}

.duel-btn:hover:not(:disabled) {
  background: #3df5ff;
}

.duel-btn:disabled {
  opacity: 0.35;
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
