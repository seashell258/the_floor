<template>
  <section class="section">

    <!-- Challenger banner — sticky, appears once a challenger is drawn -->
    <div v-if="gameStore.currentChallenger" class="challenger-banner">
      <span class="cb-eyebrow">挑戰者</span>
      <span class="cb-name">{{ gameStore.currentChallenger.challenger.name }}</span>
      <span class="cb-sub">選擇對手</span>
    </div>
    <div v-else class="no-challenger-hint">尚無挑戰者</div>

    <div class="player-list">
      <div
        v-for="player in players"
        :key="player.name"
        class="player-card"
        :class="{
          eliminated: player.eliminated,
          'streak-ready': player.streakRewardCharges > 0,
          'battle-ready': !!gameStore.currentChallenger && !player.eliminated && !!topAvailableTheme(player) && !isCurrentChallenger(player),
          'is-self-challenger': isCurrentChallenger(player)
        }"
        @click="handleCardClick(player)"
      >
        <!-- ── Header ── -->
        <div class="player-card-header">
          <h4>{{ player.name }}</h4>
          <div class="header-right" @click.stop>
            <button
              v-if="player.prop"
              class="prop-btn"
              @click="handlePropClick(player)"
              :title="player.prop === 'time' ? '使用：時間+3秒' : '使用：盾牌'"
            >
              <Clock v-if="player.prop === 'time'" :size="13" />
              <Shield v-else :size="13" />
            </button>
            <div class="player-badge">
              <span>連勝</span>
              <strong>{{ player.winStreak }}</strong>
            </div>
          </div>
        </div>

        <!-- ── Primary battle zone ── -->
        <div v-if="isCurrentChallenger(player)" class="self-zone">
          <div class="self-bracket tl" /><div class="self-bracket tr" />
          <div class="self-bracket bl" /><div class="self-bracket br" />
          <span class="self-label">本輪挑戰者</span>
        </div>
        <div v-else-if="!player.eliminated && topAvailableTheme(player)" class="primary-theme">
          <span class="primary-label">決鬥主題</span>
          <span class="primary-name">{{ topAvailableTheme(player)!.name }}</span>
          <Swords :size="14" class="primary-icon" />
        </div>
        <div v-else-if="!player.eliminated" class="primary-theme exhausted">
          <span class="primary-name muted">所有主題已消耗</span>
        </div>

        <!-- ── Secondary themes ── -->
        <div v-if="secondaryThemes(player).length > 0" class="secondary-themes" @click.stop>
          <span class="secondary-label">其他</span>
          <div
            v-for="theme in secondaryThemes(player)"
            :key="theme.name"
            class="theme-pill"
            :class="themeClass(theme, player.name)"
            @click.stop="handleThemeClick(player, theme)"
          >
            <span class="theme-name">{{ theme.name }}</span>
            <button
              v-if="!theme.isActivated"
              class="revival-btn"
              @click.stop="openRevivalConfirm(player.name)"
              title="啟用復活題"
            ><Unlock :size="11" /></button>
          </div>
        </div>

        <!-- ── Footer: lives dots + eliminated tag ── -->
        <div class="player-footer">
          <div class="lives-dots">
            <span
              v-for="(theme, i) in player.themeStack.items"
              :key="i"
              class="life-dot"
              :class="{ consumed: theme.isConsumed }"
            />
          </div>
          <span v-if="player.eliminated" class="eliminated-tag">已淘汰</span>
        </div>
      </div>
    </div>

    <!-- 抽連勝獎勵 FAB -->
    <div v-if="!isDrawPanelOpen" class="draw-fab" @click="openDrawPanel">
      <Gift :size="15" /><span>抽連勝獎勵</span>
    </div>

    <!-- 抽連勝獎勵面板 -->
    <div v-else class="draw-panel">
      <div class="host-panel-header">
        <span class="host-panel-title">抽連勝獎勵</span>
        <button class="close-btn" @click="isDrawPanelOpen = false"><X :size="15" /></button>
      </div>
      <div class="host-panel-body">
        <div class="panel-row">
          <label class="panel-label">選擇玩家</label>
          <select v-model="drawSelectedPlayerName" class="panel-select">
            <option v-for="p in gameStore.players" :key="p.name" :value="p.name">
              {{ p.streakRewardCharges > 0 ? '⚡ ' : '' }}{{ p.name }}
            </option>
          </select>
          <p v-if="drawSelectedPlayerName && !selectedPlayerHasCharge" class="no-charge-warning">
            此玩家目前無連勝獎勵可抽
          </p>
        </div>
        <button class="duel-btn" :disabled="!drawSelectedPlayerName" @click="handleDrawReward">
          開始抽獎
        </button>
        <div v-if="gameStore.drawResults" class="draw-result">
          <span class="draw-result-name">{{ gameStore.drawResults.winner }}</span>
          <span class="draw-result-reward">{{ gameStore.drawResults.reward }}</span>
        </div>
      </div>
    </div>

    <!-- 挑戰主持人 FAB -->
    <div v-if="!isPanelOpen" class="host-fab" @click="openPanel">
      <Swords :size="15" /><span>挑戰主持人</span>
    </div>

    <!-- 挑戰主持人面板 -->
    <div v-else class="host-panel">
      <div class="host-panel-header">
        <span class="host-panel-title">挑戰主持人</span>
        <button class="close-btn" @click="isPanelOpen = false"><X :size="15" /></button>
      </div>
      <div class="host-panel-body">
        <div class="panel-row">
          <label class="panel-label">挑戰者</label>
          <select v-model="selectedChallengerName" class="panel-select">
            <option v-for="p in gameStore.activePlayers" :key="p.name" :value="p.name">
              {{ p.name }}
            </option>
          </select>
        </div>
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
        <button
          class="duel-btn"
          :disabled="!selectedChallengerName || !gameStore.state.hostCurrentTheme"
          @click="handleStartDuel"
        >
          開始決鬥
        </button>
      </div>
    </div>

    <!-- Revival confirm modal -->
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
import { Swords, Gift, Unlock, Clock, Shield, X } from 'lucide-vue-next'

const props = defineProps<{
  players: Array<any>
  onThemeClick: (player: any, theme: any) => void
  onStartHostBattle: (challengerName: string) => void
}>()

const gameStore = useGameStore()
const isPanelOpen = ref(false)
const isDrawPanelOpen = ref(false)
const selectedChallengerName = ref('')
const selectedHostThemeKey = ref('')
const revivalConfirmPlayer = ref<string | null>(null)
const drawSelectedPlayerName = ref('')
const rewardOptions: Array<'time' | 'shield'> = ['time', 'shield']

const selectedPlayerHasCharge = computed(() =>
  gameStore.players.find(p => p.name === drawSelectedPlayerName.value)?.streakRewardCharges > 0
)

const selectableKeys = computed(() =>
  gameStore.currentChallenger ? gameStore.selectableThemeKeys : null
)

function themeClass(theme: any, playerName: string): string {
  return getThemeClass(theme, playerName, selectableKeys.value)
}

function isCurrentChallenger(player: any): boolean {
  return gameStore.currentChallenger?.challenger.name === player.name
}

// The first available (non-consumed, non-locked) theme — the primary battle target.
function topAvailableTheme(player: any): any | null {
  const reversed = [...player.themeStack.items].reverse()
  return reversed.find((t: any) => themeClass(t, player.name) === '') ?? null
}

// Everything except the primary theme, for the secondary row.
function secondaryThemes(player: any): any[] {
  const top = topAvailableTheme(player)
  return [...player.themeStack.items].reverse().filter((t: any) => t !== top)
}

// Tap the whole card → start battle with top available theme.
function handleCardClick(player: any): void {
  if (player.eliminated) return
  const top = topAvailableTheme(player)
  if (top) {
    props.onThemeClick(player, top)
  }
}

// Individual theme pill click (secondary themes or override).
function handleThemeClick(player: any, theme: any): void {
  const cls = themeClass(theme, player.name)
  if (cls === 'consumed' || cls === 'revival-locked' || cls === 'temp-locked') return
  props.onThemeClick(player, theme)
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
  isDrawPanelOpen.value = false
  isPanelOpen.value = true
}

function openDrawPanel() {
  if (!drawSelectedPlayerName.value && gameStore.players.length > 0) {
    drawSelectedPlayerName.value = gameStore.players[0].name
  }
  isPanelOpen.value = false
  isDrawPanelOpen.value = true
}

function handleDrawReward() {
  if (!drawSelectedPlayerName.value) return
  const prop = rewardOptions[Math.floor(Math.random() * rewardOptions.length)]
  gameStore.applyProp(drawSelectedPlayerName.value, prop)
  gameStore.recordDrawResult(drawSelectedPlayerName.value, prop === 'time' ? '時間+3秒' : '盾牌')
  gameStore.consumeStreakRewardCharge(drawSelectedPlayerName.value)
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

/* ─── Challenger Banner ─── */

.challenger-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 1rem;
  margin-bottom: 1.25rem;
  background: rgba(25, 233, 255, 0.07);
  border: 1px solid var(--glow);
  border-radius: 8px;
  box-shadow: 0 0 16px var(--glow-10);
  animation: banner-in 0.3s ease both;
}

@keyframes banner-in {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.cb-eyebrow {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.65rem;
  letter-spacing: 0.22em;
  color: var(--glow);
  opacity: 0.6;
  text-transform: uppercase;
  flex-shrink: 0;
}

.cb-name {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--glow);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cb-sub {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  flex-shrink: 0;
}

.no-challenger-hint {
  font-size: 0.82rem;
  color: var(--text-muted);
  font-family: 'Chakra Petch', sans-serif;
  text-align: center;
  padding: 0.5rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

/* ─── Player Grid ─── */

.player-list {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1rem;
}

@media (min-width: 768px) {
  .player-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (min-width: 1024px) {
  .player-list { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

/* ─── Player Card ─── */

.player-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1rem;
  background: var(--bg-surface);
  border-radius: 14px;
  border: 1px solid var(--glow-30);
  transition: opacity 0.18s ease, filter 0.18s ease,
              transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
              border-color 0.18s, box-shadow 0.18s;
  cursor: default;
}

/* ─── Arena Select Spotlight ─── */
@media (min-width: 768px) {
  .player-list:has(.player-card.battle-ready:hover) .player-card {
    opacity: 0.16;
    filter: blur(0.6px);
    transform: scale(0.97);
  }

  .player-list:has(.player-card.battle-ready:hover) .player-card.battle-ready:hover {
    opacity: 1;
    filter: blur(0);
    transform: scale(1.05) translateY(-4px);
    border-color: var(--glow);
    box-shadow: 0 20px 60px rgba(25, 233, 255, 0.22), 0 0 0 1px var(--glow);
    z-index: 2;
  }
}

/* Invite to tap when a challenger is ready */
.player-card.battle-ready {
  cursor: pointer;
  border-color: rgba(25, 233, 255, 0.55);
}

.player-card.battle-ready:hover {
  border-color: var(--glow);
  box-shadow: 0 0 18px var(--glow-10);
}

.player-card.eliminated {
  opacity: 0.45;
  cursor: default;
  border-color: var(--danger);
}

.player-card.streak-ready {
  border-color: var(--warn);
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.2);
  animation: streak-pulse 1.5s ease-in-out infinite;
}

@keyframes streak-pulse {
  0%, 100% { box-shadow: 0 0 8px rgba(245, 158, 11, 0.15); }
  50%       { box-shadow: 0 0 28px rgba(245, 158, 11, 0.45); }
}

/* ─── Card Header ─── */

.player-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.player-card-header h4 {
  margin: 0;
  font-size: 1.15rem;
  font-family: 'Chakra Petch', sans-serif;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.player-badge {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 0.35rem 0.6rem;
  background: rgba(245, 158, 11, 0.12);
  border-radius: 999px;
  flex-shrink: 0;
}

.player-badge span {
  color: var(--warn);
  font-size: 0.62rem;
  font-family: 'Chakra Petch', sans-serif;
  line-height: 1;
}

.player-badge strong {
  color: var(--warn);
  font-size: 0.9rem;
  font-family: 'Chakra Petch', sans-serif;
  line-height: 1.2;
}

/* ─── Primary Battle Zone ─── */

.primary-theme {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 56px;
  padding: 0.75rem 1rem;
  background: rgba(25, 233, 255, 0.06);
  border: 1px solid var(--glow-30);
  border-radius: 10px;
  transition: background 0.2s, border-color 0.2s;
}

.battle-ready .primary-theme {
  background: rgba(25, 233, 255, 0.10);
  border-color: var(--glow);
}

.battle-ready:hover .primary-theme {
  background: rgba(25, 233, 255, 0.15);
}

.primary-theme.exhausted {
  background: rgba(255, 255, 255, 0.03);
  border-color: transparent;
}

/* ─── Self-Challenger Lock ─── */

.player-card.is-self-challenger {
  border-color: rgba(255, 190, 40, 0.4);
  cursor: default;
}

.self-zone {
  position: relative;
  min-height: 56px;
  border: 1px solid rgba(255, 190, 40, 0.3);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 190, 40, 0.04);
  padding: 0.75rem 1rem;
}

.self-bracket {
  position: absolute;
  width: 10px;
  height: 10px;
  opacity: 0.55;
}

.self-bracket.tl { top: 5px;    left: 5px;  border-top:    1.5px solid rgba(255, 190, 40, 0.8); border-left:   1.5px solid rgba(255, 190, 40, 0.8); }
.self-bracket.tr { top: 5px;    right: 5px; border-top:    1.5px solid rgba(255, 190, 40, 0.8); border-right:  1.5px solid rgba(255, 190, 40, 0.8); }
.self-bracket.bl { bottom: 5px; left: 5px;  border-bottom: 1.5px solid rgba(255, 190, 40, 0.8); border-left:   1.5px solid rgba(255, 190, 40, 0.8); }
.self-bracket.br { bottom: 5px; right: 5px; border-bottom: 1.5px solid rgba(255, 190, 40, 0.8); border-right:  1.5px solid rgba(255, 190, 40, 0.8); }

.self-label {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.68rem;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: rgba(255, 190, 40, 0.75);
}

.primary-label {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.6rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--glow);
  opacity: 0.55;
  flex-shrink: 0;
}

.primary-name {
  flex: 1;
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.primary-name.muted {
  color: var(--text-muted);
  font-weight: 400;
  font-size: 0.85rem;
}

.primary-icon {
  color: var(--glow);
  opacity: 0;
  flex-shrink: 0;
  transition: opacity 0.15s;
}

.battle-ready:hover .primary-icon {
  opacity: 0.7;
}

/* ─── Secondary Themes ─── */

.secondary-themes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.secondary-label {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  opacity: 0.5;
  flex-shrink: 0;
  text-transform: uppercase;
}

.theme-pill {
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: var(--glow-10);
  color: var(--glow);
  border: 1px solid var(--glow-30);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
}

.theme-pill:hover {
  background: var(--glow-30);
}

.theme-pill.consumed {
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-muted);
  border-color: transparent;
  cursor: default;
  text-decoration: line-through;
  opacity: 0.5;
}

.theme-pill.consumed:hover {
  background: rgba(255, 255, 255, 0.04);
}

.theme-pill.temp-locked {
  background: rgba(245, 158, 11, 0.08);
  color: var(--warn);
  border-color: rgba(245, 158, 11, 0.25);
  cursor: not-allowed;
  opacity: 0.6;
}

.theme-pill.temp-locked:hover {
  background: rgba(245, 158, 11, 0.08);
}

.theme-pill.revival-locked {
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-muted);
  border-color: transparent;
  cursor: not-allowed;
  opacity: 0.5;
}

.theme-pill.revival-locked:hover {
  background: rgba(255, 255, 255, 0.04);
}

.theme-name {
  line-height: 1;
}

.revival-btn {
  background: none;
  border: 1px solid var(--glow-30);
  border-radius: 4px;
  cursor: pointer;
  padding: 0.1rem 0.25rem;
  line-height: 1;
  color: var(--text-muted);
  transition: border-color 0.15s, color 0.15s;
  flex-shrink: 0;
}

.revival-btn:hover {
  border-color: var(--glow);
  color: var(--glow);
}

/* ─── Prop (inline in header) ─── */

.prop-btn {
  background: none;
  border: 1.5px solid var(--glow-30);
  border-radius: 6px;
  padding: 0.22rem 0.45rem;
  cursor: pointer;
  color: var(--glow);
  transition: border-color 0.15s, background 0.15s;
  line-height: 1;
  display: flex;
  align-items: center;
}

.prop-btn:hover {
  border-color: var(--glow);
  background: var(--glow-10);
}

/* ─── Footer: lives dots ─── */

.player-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.1rem;
}

.lives-dots {
  display: flex;
  gap: 5px;
  align-items: center;
}

.life-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--glow);
  box-shadow: 0 0 5px rgba(25, 233, 255, 0.55);
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.life-dot.consumed {
  background: rgba(255, 255, 255, 0.12);
  box-shadow: none;
}

.eliminated-tag {
  font-size: 0.72rem;
  font-weight: 700;
  font-family: 'Chakra Petch', sans-serif;
  color: var(--danger);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* ─── FABs & Panels (unchanged) ─── */

.draw-fab {
  position: fixed;
  bottom: 4.5rem;
  left: 1.5rem;
  z-index: 100;
  padding: 0.6rem 1.1rem;
  background: var(--warn);
  color: var(--bg-panel);
  border-radius: 999px;
  font-weight: 700;
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
  transition: background 0.2s, transform 0.15s;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.draw-fab:hover {
  background: #f59e0b;
  transform: translateY(-2px);
}

.draw-panel {
  position: fixed;
  bottom: 4.5rem;
  left: 1.5rem;
  width: min(340px, calc(100% - 2.5rem));
  background: var(--bg-panel);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 14px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  z-index: 10;
}

.draw-result {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: var(--bg-surface);
  border-radius: 8px;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.draw-result-name {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-family: 'Chakra Petch', sans-serif;
}

.draw-result-reward {
  font-weight: 700;
  color: var(--warn);
  font-family: 'Chakra Petch', sans-serif;
}

.no-charge-warning {
  margin: 0;
  font-size: 0.8rem;
  color: var(--warn);
  font-family: 'Chakra Petch', sans-serif;
}

.host-fab {
  position: fixed;
  bottom: 1.5rem;
  left: 1.5rem;
  z-index: 100;
  padding: 0.6rem 1.1rem;
  background: var(--glow);
  color: var(--bg-panel);
  border-radius: 999px;
  font-weight: 700;
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 0 4px 16px var(--glow-30);
  transition: background 0.2s, transform 0.15s;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.host-fab:hover {
  background: var(--glow-bright);
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
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  transition: color 0.15s;
  display: flex;
  align-items: center;
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
  color: var(--bg-panel);
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
  background: var(--glow-bright);
}

.duel-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ─── Revival modal ─── */

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
  color: var(--bg-panel);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Chakra Petch', sans-serif;
  font-weight: 700;
}

.confirm-btn:hover {
  background: var(--glow-bright);
}
</style>
