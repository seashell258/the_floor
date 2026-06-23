<template>
  <section class="section">

    <div class="player-list">
      <div
        v-for="player in players"
        :key="player.name"
        class="player-card"
        :class="{
          eliminated: player.eliminated,
          'streak-ready': player.pendingTimeBonuses.length > 0,
          'battle-ready': !!gameStore.currentChallenger && !player.eliminated && !!topAvailableTheme(player) && !isCurrentChallenger(player) && immunePlayerName !== player.name,
          'is-self-challenger': isCurrentChallenger(player),
          'is-immune': immunePlayerName === player.name
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
            <button
              v-for="(bonus, i) in player.pendingTimeBonuses"
              :key="i"
              class="streak-reward-btn"
              :disabled="(gameStore.state.timePropBonus[player.name] ?? 0) > 0"
              @click.stop="applyStreakReward(player, bonus)"
              :title="`連勝獎勵：+${bonus}秒`"
            >
              ⚡ +{{ bonus }}秒
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
          <span class="self-eyebrow">本輪</span>
          <span class="self-big">挑戰者</span>
        </div>
        <div v-else-if="!player.eliminated && topAvailableTheme(player)" class="primary-theme">
          <div class="primary-eyebrow">
            <span class="primary-label">決鬥主題</span>
            <Swords :size="11" class="primary-icon" />
          </div>
          <span class="primary-name">{{ topAvailableTheme(player)!.name }}</span>
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

        <!-- Immune notice -->
        <div v-if="immunePlayerName === player.name" class="immune-notice">
          <Shield :size="11" />
          <span>本輪免疫</span>
        </div>

        <!-- ── Footer: lives dots + eliminated tag ── -->
        <div class="player-footer">
          <div class="lives-dots">
            <span
              v-for="(theme, i) in player.themeStack.items"
              :key="i"
              class="life-dot"
              :class="{
                consumed: theme.isConsumed,
                locked: !theme.isActivated && !theme.isConsumed
              }"
            />
          </div>
          <span v-if="player.eliminated" class="eliminated-tag">已淘汰</span>
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

    <!-- VS Screen + Countdown -->
    <Teleport to="body">
      <div v-if="vsPhase" class="vs-overlay" :class="{ 'countdown-mode': vsPhase === 'countdown' }" @click="handleOverlayClick">
        <div class="vs-scanlines" />

        <Transition name="vs-fade">
          <div v-if="vsPhase === 'vs'" class="vs-inner">
            <div class="vs-progress" />

            <div class="vs-stage">
              <div class="vs-side vs-left">
                <span class="vs-role">挑戰者</span>
                <span class="vs-name vs-name-left">{{ gameStore.currentChallenger?.challenger.name }}</span>
              </div>

              <div class="vs-center-col">
                <span class="vs-mark">VS</span>
                <div class="vs-theme-info">
                  <span class="vs-theme-eyebrow">決鬥主題</span>
                  <span class="vs-theme-name">{{ pendingBattleTheme?.name }}</span>
                </div>
              </div>

              <div class="vs-side vs-right">
                <span class="vs-role">應戰</span>
                <span class="vs-name vs-name-right">{{ pendingBattlePlayer?.name }}</span>
              </div>
            </div>

            <span class="vs-tap-hint">TAP TO BEGIN</span>
          </div>
        </Transition>

        <Transition name="vs-fade">
          <div v-if="vsPhase === 'countdown'" class="countdown-wrap">
            <span class="countdown-num" :key="countdownNum">{{ countdownNum }}</span>
          </div>
        </Transition>
      </div>
    </Teleport>

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

  <!-- ─── Shield confirmation dialog ─── -->
  <Teleport to="body">
    <div v-if="shieldDialogPlayer" class="shield-dialog-overlay">
      <div class="shield-dialog">
        <div class="shield-dialog-icon">
          <Shield :size="60" />
        </div>
        <div class="shield-dialog-name">{{ shieldDialogPlayer.name }}</div>
        <div class="shield-dialog-body">
          <span class="shield-dialog-eyebrow">持有盾牌</span><br>
          要使用盾牌擋下這次挑戰嗎？
        </div>
        <div class="shield-dialog-actions">
          <button class="shield-use-btn" @click="handleShieldUse">
            <Shield :size="15" />使用盾牌
          </button>
          <button class="shield-decline-btn" @click="handleShieldDecline">
            不使用，進入戰鬥
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ─── Shield block animation ─── -->
  <Teleport to="body">
    <div v-if="showShieldBlock" class="shield-block-overlay" :class="{ 'block-fading': shieldBlockFading }">
      <div class="shield-rings">
        <div class="shield-ring sr1" />
        <div class="shield-ring sr2" />
        <div class="shield-ring sr3" />
      </div>
      <div class="shield-particles">
        <div v-for="i in 10" :key="i" class="shield-particle" :style="shieldParticleStyle(i)" />
      </div>
      <div class="shield-block-center">
        <div class="shield-block-icon">
          <Shield :size="110" />
        </div>
        <div class="block-label">擋下！</div>
        <div class="block-name">{{ shieldBlockPlayerName }}</div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useGameStore } from '../../pinia/store'
import { getThemeClass } from '../../utils/themeUtils'
import { Swords, Unlock, Clock, Shield, X } from 'lucide-vue-next'

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

// ─── Shield prop state ───
const immunePlayerName = ref<string | null>(null)
const shieldDialogPlayer = ref<any | null>(null)
const pendingThemeAfterShield = ref<any | null>(null)
const showShieldBlock = ref(false)
const shieldBlockFading = ref(false)
const shieldBlockPlayerName = ref('')

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
  return player.themeStack.items.find((t: any) => themeClass(t, player.name) === '') ?? null
}

// Everything except the primary theme, for the secondary row.
function secondaryThemes(player: any): any[] {
  const top = topAvailableTheme(player)
  return player.themeStack.items.filter((t: any) => t !== top)
}

// ─── VS Screen + Countdown ───

const pendingBattlePlayer = ref<any>(null)
const pendingBattleTheme  = ref<any>(null)
const vsPhase = ref<'vs' | 'countdown' | null>(null)
const countdownNum = ref(3)
let vsAutoTimer: number | null = null
let countdownInterval: ReturnType<typeof setInterval> | null = null

onUnmounted(() => {
  if (vsAutoTimer) clearTimeout(vsAutoTimer)
  if (countdownInterval) clearInterval(countdownInterval)
})

function openVsScreen(player: any, theme: any) {
  pendingBattlePlayer.value = player
  pendingBattleTheme.value  = theme
  vsPhase.value = 'vs'
  vsAutoTimer = window.setTimeout(startCountdown, 4500)
}

function handleOverlayClick() {
  if (vsPhase.value === 'vs') startCountdown()
}

function startCountdown() {
  if (vsAutoTimer) { clearTimeout(vsAutoTimer); vsAutoTimer = null }
  vsPhase.value = 'countdown'
  countdownNum.value = 3
  let n = 3
  countdownInterval = setInterval(() => {
    n--
    if (n <= 0) {
      clearInterval(countdownInterval!); countdownInterval = null
      executeBattle()
    } else {
      countdownNum.value = n
    }
  }, 1000)
}

function executeBattle() {
  const player = pendingBattlePlayer.value
  const theme  = pendingBattleTheme.value
  pendingBattlePlayer.value = null
  pendingBattleTheme.value  = null
  vsPhase.value = null
  immunePlayerName.value = null
  if (player && theme) props.onThemeClick(player, theme)
}

// Tap the whole card → VS screen with top available theme.
function handleCardClick(player: any): void {
  if (player.eliminated) return
  if (immunePlayerName.value === player.name) return
  const top = topAvailableTheme(player)
  if (!top) return
  if (player.prop === 'shield' && !isCurrentChallenger(player) && gameStore.currentChallenger) {
    shieldDialogPlayer.value = player
    pendingThemeAfterShield.value = top
    return
  }
  openVsScreen(player, top)
}

// Individual theme pill click (secondary themes or override).
function handleThemeClick(player: any, theme: any): void {
  const cls = themeClass(theme, player.name)
  if (cls === 'consumed' || cls === 'revival-locked' || cls === 'temp-locked') return
  if (immunePlayerName.value === player.name) return
  if (player.prop === 'shield' && !isCurrentChallenger(player) && gameStore.currentChallenger) {
    shieldDialogPlayer.value = player
    pendingThemeAfterShield.value = theme
    return
  }
  openVsScreen(player, theme)
}

function handleShieldUse() {
  const player = shieldDialogPlayer.value
  if (!player) return
  const name = player.name
  shieldDialogPlayer.value = null
  pendingThemeAfterShield.value = null
  gameStore.consumeProp(name)
  shieldBlockPlayerName.value = name
  showShieldBlock.value = true
  shieldBlockFading.value = false
  setTimeout(() => {
    shieldBlockFading.value = true
    setTimeout(() => {
      showShieldBlock.value = false
      shieldBlockFading.value = false
      immunePlayerName.value = name
    }, 300)
  }, 1700)
}

function handleShieldDecline() {
  const player = shieldDialogPlayer.value
  const theme = pendingThemeAfterShield.value
  shieldDialogPlayer.value = null
  pendingThemeAfterShield.value = null
  if (player && theme) openVsScreen(player, theme)
}

function shieldParticleStyle(i: number) {
  const angle = ((i - 1) / 10) * 360
  const rad = (angle * Math.PI) / 180
  const dist = 110 + ((i * 19) % 55)
  const size = 5 + ((i * 7) % 7)
  const delay = ((i * 0.06) % 0.28)
  return {
    '--tx': `${Math.cos(rad) * dist}px`,
    '--ty': `${Math.sin(rad) * dist}px`,
    width: `${size}px`,
    height: `${size}px`,
    '--delay': `${delay}s`,
  }
}

function handlePropClick(player: any): void {
  if (!player.prop) return
  if (player.prop === 'time') {
    gameStore.applyTimeProp(player.name, 3)
  } else {
    gameStore.consumeProp(player.name)
  }
}

function applyStreakReward(player: any, bonus: number): void {
  gameStore.applyTimeProp(player.name, bonus)
  gameStore.consumePendingBonus(player.name, bonus)
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


/* ─── Player Grid ─── */

.player-list {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1.25rem;
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
  gap: 0.85rem;
  padding: 1.25rem;
  background: var(--bg-surface);
  border-radius: 16px;
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
  font-size: 1.35rem;
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
  flex-direction: column;
  justify-content: center;
  gap: 0.3rem;
  min-height: 90px;
  padding: 1rem 1.15rem;
  background: rgba(25, 233, 255, 0.06);
  border: 1px solid var(--glow-30);
  border-radius: 12px;
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
  align-items: center;
  background: rgba(255, 255, 255, 0.03);
  border-color: transparent;
}

.primary-eyebrow {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

/* ─── Self-Challenger Lock ─── */

.player-card.is-self-challenger {
  border-color: rgba(255, 190, 40, 0.4);
  cursor: default;
}

.self-zone {
  position: relative;
  min-height: 90px;
  border: 1px solid rgba(255, 190, 40, 0.3);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.3rem;
  background: rgba(255, 190, 40, 0.04);
  padding: 1rem 1.15rem;
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

.self-eyebrow {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.6rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(255, 190, 40, 0.5);
}

.self-big {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 1.3rem;
  font-weight: 700;
  color: rgba(255, 190, 40, 0.88);
  line-height: 1.25;
}

.primary-label {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.6rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--glow);
  opacity: 0.5;
}

.primary-name {
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.25;
  word-break: break-word;
}

.primary-name.muted {
  color: var(--text-muted);
  font-weight: 400;
  font-size: 0.88rem;
}

.primary-icon {
  color: var(--glow);
  opacity: 0;
  transition: opacity 0.15s;
}

.battle-ready:hover .primary-icon {
  opacity: 0.65;
}

/* ─── Secondary Themes ─── */

.secondary-themes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.28;
  transition: opacity 0.18s ease;
}

.player-card:hover .secondary-themes {
  opacity: 1;
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
  padding: 0.42rem 0.85rem;
  border-radius: 999px;
  background: var(--glow-10);
  color: var(--glow);
  border: 1px solid var(--glow-30);
  font-size: 0.85rem;
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
  margin-top: auto;
  padding-top: 0.4rem;
}

.lives-dots {
  display: flex;
  gap: 7px;
  align-items: center;
}

.life-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--glow);
  box-shadow: 0 0 6px rgba(25, 233, 255, 0.6);
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.life-dot.consumed {
  background: rgba(255, 255, 255, 0.12);
  box-shadow: none;
}

.life-dot.locked {
  background: transparent;
  border: 1.5px dashed rgba(255, 255, 255, 0.22);
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

/* ─── FABs & Panels ─── */

.streak-reward-btn {
  padding: 0.2rem 0.5rem;
  background: transparent;
  border: 1px solid var(--warn);
  border-radius: 4px;
  color: var(--warn);
  font-size: 0.75rem;
  font-family: 'Chakra Petch', sans-serif;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.streak-reward-btn:hover {
  background: var(--warn);
  color: var(--bg-panel);
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

/* ─── VS Screen ─── */

.vs-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 4, 18, 0.97);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.vs-overlay.countdown-mode {
  cursor: default;
}

.vs-scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent, transparent 3px,
    rgba(0, 0, 0, 0.18) 3px, rgba(0, 0, 0, 0.18) 4px
  );
  pointer-events: none;
  opacity: 0.45;
}

/* Phase transitions */
.vs-fade-enter-active { transition: opacity 0.2s ease; }
.vs-fade-leave-active { transition: opacity 0.12s ease; }
.vs-fade-enter-from,
.vs-fade-leave-to     { opacity: 0; }

/* VS inner layout */
.vs-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.vs-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: 100%;
  background: var(--glow);
  opacity: 0.45;
  transform-origin: left center;
  animation: vs-drain 4.5s linear forwards;
}

@keyframes vs-drain {
  from { transform: scaleX(1); }
  to   { transform: scaleX(0); }
}

.vs-stage {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 2.5rem;
  width: 100%;
  max-width: 880px;
  padding: 0 3.5rem;
}

.vs-side {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.vs-left {
  align-items: flex-end;
  animation: vs-from-left 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.vs-right {
  align-items: flex-start;
  animation: vs-from-right 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.06s both;
}

@keyframes vs-from-left {
  from { opacity: 0; transform: translateX(-80px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes vs-from-right {
  from { opacity: 0; transform: translateX(80px); }
  to   { opacity: 1; transform: translateX(0); }
}

.vs-role {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.65rem;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--text-muted);
  opacity: 0.65;
}

.vs-left .vs-role { color: var(--glow); }

.vs-name {
  font-family: 'Chakra Petch', sans-serif;
  font-size: clamp(2.4rem, 5.5vw, 3.8rem);
  font-weight: 700;
  line-height: 1.1;
  word-break: break-all;
}

.vs-name-left {
  color: var(--glow);
  text-shadow: 0 0 40px rgba(25, 233, 255, 0.45);
  text-align: right;
}

.vs-name-right {
  color: #ffffff;
  text-shadow: 0 0 40px rgba(255, 255, 255, 0.18);
  text-align: left;
}

.vs-center-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.vs-mark {
  font-family: 'Chakra Petch', sans-serif;
  font-size: clamp(3rem, 8vw, 5.5rem);
  font-weight: 900;
  color: transparent;
  -webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.22);
  letter-spacing: 0.06em;
  animation: vs-punch 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.18s both;
}

@keyframes vs-punch {
  from { opacity: 0; transform: scale(2.2); filter: blur(6px); }
  to   { opacity: 1; transform: scale(1);   filter: blur(0); }
}

.vs-theme-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.28rem;
  animation: vs-rise 0.4s ease 0.52s both;
}

@keyframes vs-rise {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

.vs-theme-eyebrow {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.6rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--text-muted);
  opacity: 0.5;
}

.vs-theme-name {
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text);
  text-align: center;
}

.vs-tap-hint {
  position: absolute;
  bottom: 2.5rem;
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.62rem;
  letter-spacing: 0.36em;
  text-transform: uppercase;
  color: var(--glow);
  opacity: 0;
  animation: vs-hint-fade 0.3s ease 1.1s forwards;
}

@keyframes vs-hint-fade {
  to { opacity: 0.38; }
}

/* ─── Countdown ─── */

.countdown-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.countdown-num {
  font-family: 'Chakra Petch', sans-serif;
  font-size: clamp(10rem, 24vw, 18rem);
  font-weight: 900;
  color: #ffffff;
  -webkit-text-stroke: 2px rgba(25, 233, 255, 0.3);
  text-shadow: 0 0 80px rgba(25, 233, 255, 0.28);
  line-height: 1;
  animation: count-slam 0.95s ease forwards;
}

@keyframes count-slam {
  0%   { transform: scale(2.4); opacity: 0; filter: blur(14px); }
  22%  { transform: scale(1);   opacity: 1; filter: blur(0); }
  68%  { transform: scale(1);   opacity: 1; }
  100% { transform: scale(0.72); opacity: 0; filter: blur(4px); }
}

/* ─── Immune State ─── */

.player-card.is-immune {
  border-color: rgba(185, 212, 255, 0.55);
  box-shadow: 0 0 18px rgba(160, 198, 255, 0.16);
  cursor: not-allowed;
  animation: immune-shimmer 2.6s ease-in-out infinite;
}

@keyframes immune-shimmer {
  0%, 100% { box-shadow: 0 0 12px rgba(160, 198, 255, 0.12); border-color: rgba(185, 212, 255, 0.45); }
  50%       { box-shadow: 0 0 28px rgba(160, 198, 255, 0.3), 0 0 55px rgba(160, 198, 255, 0.08); border-color: rgba(185, 212, 255, 0.72); }
}

.immune-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.38rem 0.75rem;
  background: rgba(130, 170, 255, 0.07);
  border: 1px solid rgba(175, 208, 255, 0.22);
  border-radius: 8px;
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(185, 212, 255, 0.72);
}

/* ─── Shield Dialog ─── */

.shield-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 3500;
  background: rgba(0, 4, 20, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(6px);
  animation: shield-overlay-in 0.2s ease-out;
}

@keyframes shield-overlay-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.shield-dialog {
  background: var(--bg-panel);
  border: 1px solid rgba(175, 208, 255, 0.28);
  border-radius: 18px;
  padding: 2.5rem 2rem;
  max-width: 340px;
  width: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
  box-shadow:
    0 0 70px rgba(140, 185, 255, 0.09),
    0 8px 40px rgba(0, 0, 0, 0.65);
  animation: shield-dialog-up 0.36s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes shield-dialog-up {
  from { transform: scale(0.88) translateY(18px); opacity: 0; }
  to   { transform: scale(1) translateY(0); opacity: 1; }
}

.shield-dialog-icon {
  color: rgba(185, 212, 255, 0.92);
  filter: drop-shadow(0 0 18px rgba(155, 198, 255, 0.65));
  animation: shield-icon-breathe 2.2s ease-in-out infinite;
}

@keyframes shield-icon-breathe {
  0%, 100% { filter: drop-shadow(0 0 14px rgba(155, 198, 255, 0.55)); }
  50%       { filter: drop-shadow(0 0 32px rgba(155, 198, 255, 0.95)); }
}

.shield-dialog-name {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 1.85rem;
  font-weight: 700;
  color: rgba(200, 222, 255, 0.96);
  text-align: center;
  letter-spacing: 0.04em;
}

.shield-dialog-body {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.88rem;
  color: var(--text-muted);
  text-align: center;
  letter-spacing: 0.03em;
  line-height: 1.75;
}

.shield-dialog-eyebrow {
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(175, 208, 255, 0.5);
}

.shield-dialog-actions {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  width: 100%;
}

.shield-use-btn {
  width: 100%;
  padding: 0.9rem;
  background: rgba(145, 188, 255, 0.1);
  border: 1.5px solid rgba(175, 210, 255, 0.45);
  border-radius: 10px;
  color: rgba(200, 224, 255, 0.96);
  font-family: 'Chakra Petch', sans-serif;
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.18s, border-color 0.18s, box-shadow 0.18s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.shield-use-btn:hover {
  background: rgba(145, 188, 255, 0.2);
  border-color: rgba(185, 215, 255, 0.75);
  box-shadow: 0 0 22px rgba(145, 188, 255, 0.2);
}

.shield-decline-btn {
  width: 100%;
  padding: 0.72rem;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: var(--text-muted);
  font-family: 'Chakra Petch', sans-serif;
  font-weight: 500;
  font-size: 0.88rem;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.shield-decline-btn:hover {
  color: var(--text);
  border-color: rgba(255, 255, 255, 0.18);
}

/* ─── Shield Block Animation ─── */

.shield-block-overlay {
  position: fixed;
  inset: 0;
  z-index: 4000;
  background: rgba(0, 3, 18, 0.96);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  animation: shield-overlay-in 0.18s ease-out;
}

.shield-block-overlay.block-fading {
  animation: shield-overlay-out 0.3s ease-out forwards;
}

@keyframes shield-overlay-out {
  from { opacity: 1; }
  to   { opacity: 0; }
}

.shield-rings {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.shield-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(165, 202, 255, 0.55);
}

.shield-ring.sr1 { width: 90px;  height: 90px;  animation: shield-ring-expand 0.95s 0.06s ease-out forwards; }
.shield-ring.sr2 { width: 90px;  height: 90px;  animation: shield-ring-expand 1.1s  0.22s ease-out forwards; }
.shield-ring.sr3 { width: 90px;  height: 90px;  animation: shield-ring-expand 1.28s 0.4s  ease-out forwards; }

@keyframes shield-ring-expand {
  from { transform: scale(0.7); opacity: 0.75; }
  to   { transform: scale(4.5); opacity: 0; }
}

.shield-particles {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.shield-particle {
  position: absolute;
  border-radius: 50%;
  background: rgba(175, 208, 255, 0.85);
  box-shadow: 0 0 5px rgba(165, 202, 255, 0.9);
  opacity: 0;
  animation: shield-particle-fly 0.72s var(--delay, 0s) ease-out forwards;
}

@keyframes shield-particle-fly {
  0%   { transform: translate(0, 0) scale(1.2); opacity: 1; }
  55%  { opacity: 0.7; }
  100% { transform: translate(var(--tx, 80px), var(--ty, 0px)) scale(0); opacity: 0; }
}

.shield-block-center {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  text-align: center;
}

.shield-block-icon {
  color: rgba(185, 212, 255, 0.94);
  filter:
    drop-shadow(0 0 22px rgba(150, 195, 255, 0.85))
    drop-shadow(0 0 65px rgba(150, 195, 255, 0.32));
  animation: shield-slam-in 0.48s cubic-bezier(0.18, 1.35, 0.38, 1) forwards;
}

@keyframes shield-slam-in {
  from { transform: scale(0.1) rotate(-18deg); opacity: 0; filter: blur(14px); }
  to   { transform: scale(1) rotate(0deg); opacity: 1; filter: blur(0); }
}

.block-label {
  font-family: 'Chakra Petch', sans-serif;
  font-size: clamp(2.8rem, 9vw, 4.5rem);
  font-weight: 900;
  color: rgba(200, 224, 255, 0.97);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-shadow:
    0 0 26px rgba(165, 202, 255, 0.9),
    0 0 75px rgba(165, 202, 255, 0.32);
  opacity: 0;
  animation: shield-stamp 0.42s 0.28s cubic-bezier(0.18, 1.45, 0.38, 1) forwards;
}

@keyframes shield-stamp {
  from { transform: scale(2); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}

.block-name {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 1.15rem;
  font-weight: 600;
  color: rgba(175, 208, 255, 0.52);
  letter-spacing: 0.12em;
  opacity: 0;
  animation: shield-fade-up 0.3s 0.58s ease-out forwards;
}

@keyframes shield-fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
