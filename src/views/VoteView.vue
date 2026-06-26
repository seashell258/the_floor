<template>
  <div class="vote-page">
    <div class="tab-navigation">
      <button
        type="button"
        class="tab-button"
        :class="{ active: activeTab === 'vote' }"
        @click="activeTab = 'vote'"
      >
        投票
      </button>
      <button
        type="button"
        class="tab-button"
        :class="{ active: activeTab === 'status' }"
        @click="activeTab = 'status'"
      >
        玩家狀態
      </button>
    </div>

    <div class="vote-container">
      <section v-if="activeTab === 'vote'" class="section">
        <h3>投票</h3>

        <div v-if="gameStore.currentBattle" class="vote-timer" :class="{ urgent: voteSecondsLeft <= 3 && voteOpen, closed: !voteOpen }">
          <div class="vote-timer-track">
            <div class="vote-timer-fill" :style="{ width: (voteSecondsLeft / 10 * 100) + '%' }"></div>
          </div>
          <div class="vote-timer-display">
            <template v-if="voteOpen">
              <span class="vote-timer-number">{{ voteSecondsLeft }}</span>
              <span class="vote-timer-unit">SEC</span>
            </template>
            <span v-else class="vote-timer-closed">CLOSED</span>
          </div>
        </div>

        <div v-if="gameStore.currentBattle" class="vote-buttons">
          <button
            @click="vote(1)"
            class="vote-btn"
            :class="{ 'voted': hasVotedFor(1) }"
            :disabled="hasVoted || !voteOpen"
          >
            <Check v-if="hasVotedFor(1)" :size="16" style="margin-right:0.3rem;vertical-align:middle" />Vote for {{ gameStore.currentBattle?.player1Name }}
          </button>
          <button
            @click="vote(2)"
            class="vote-btn"
            :class="{ 'voted': hasVotedFor(2) }"
            :disabled="hasVoted || !voteOpen"
          >
            <Check v-if="hasVotedFor(2)" :size="16" style="margin-right:0.3rem;vertical-align:middle" />Vote for {{ gameStore.currentBattle?.player2Name }}
          </button>
        </div>

        <div v-if="!gameStore.currentBattle" class="voting-disabled">
          暫無對決
        </div>
        <div v-if="hasVoted && gameStore.currentBattle" class="voted-message">
          <Check :size="16" style="vertical-align:middle;margin-right:0.35rem" />投票成功
        </div>

        <div v-if="gameStore.currentBattle" class="section vote-stats">
          <h3>即時票數統計</h3>
          <div v-if="gameStore.voteResults" class="vote-results">
            <div class="result-item">
              <span class="player-name">{{ gameStore.voteResults.player1 }}</span>
              <div class="result-bar">
                <div class="bar-fill" :style="{ width: getVotePercentage(1) + '%' }"></div>
              </div>
              <span class="vote-number">{{ gameStore.voteResults.votes1 }}</span>
              <div v-if="gameStore.voteResults.voters1.length > 0" class="voters-list">
                <span class="voters-label">投票者：</span>
                <span class="voters-names">{{ gameStore.voteResults.voters1.join('、') }}</span>
              </div>
            </div>
            <div class="result-item">
              <span class="player-name">{{ gameStore.voteResults.player2 }}</span>
              <div class="result-bar">
                <div class="bar-fill" :style="{ width: getVotePercentage(2) + '%' }"></div>
              </div>
              <span class="vote-number">{{ gameStore.voteResults.votes2 }}</span>
              <div v-if="gameStore.voteResults.voters2.length > 0" class="voters-list">
                <span class="voters-label">投票者：</span>
                <span class="voters-names">{{ gameStore.voteResults.voters2.join('、') }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-if="activeTab === 'status'" class="section">
        <h3>玩家狀態</h3>
        <div class="player-list">
          <div v-for="player in gameStore.players" :key="player.name" class="player-card" :class="{ eliminated: player.eliminated }">
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
                :class="getThemeClass(theme, player.name, selectableKeys)"
              >
                {{ theme.name }}
              </div>
            </div>

            <div v-if="player.prop" class="prop-area">
              <span class="prop-icon" :title="player.prop === 'time' ? '時間+3秒' : '盾牌'">
                <Clock v-if="player.prop === 'time'" :size="20" />
                <Shield v-else :size="20" />
              </span>
            </div>

            <div class="status-badge" :class="{ active: !player.eliminated }">
              {{ player.eliminated ? '已淘汰' : '存活' }}
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- ⚔ Host themes trigger — fixed bottom-left, visible on both tabs -->
    <button
      v-if="gameStore.hostThemes.length > 0"
      type="button"
      class="host-themes-btn"
      :class="{ 'is-open': hostPanelOpen }"
      @click="hostPanelOpen = !hostPanelOpen"
    >
      <Swords :size="14" class="host-btn-sword" />
      <span class="host-btn-label">主持人</span>
      <span class="host-btn-chip">
        <span class="chip-avail">{{ hostAvailableCount }}</span><span class="chip-sep">/</span><span class="chip-total">{{ gameStore.hostThemes.length }}</span>
      </span>
    </button>

    <!-- HOST THEMES BOTTOM SHEET
         Mobile-first. Slides up from bottom with CSS keyframe animation.
         Overlay fades via Vue Transition (name="host-overlay").
         Each row: index number + theme name + status badge.
         Available themes: cyan glow badge "可挑戰". Consumed: 38% opacity + strikethrough + muted badge. -->
    <Teleport to="body">
      <Transition name="host-overlay">
        <div
          v-if="hostPanelOpen"
          class="host-panel-overlay"
          @click.self="hostPanelOpen = false"
        >
          <div class="host-panel">
            <div class="host-panel-handle"></div>
            <div class="host-panel-header">
              <div class="host-panel-header-title">
                <Swords :size="13" />
                <span>主持人主題</span>
              </div>
              <div class="host-panel-header-stat">
                <span class="stat-avail">{{ hostAvailableCount }}</span>
                <span class="stat-sep"> / </span>
                <span class="stat-total">{{ gameStore.hostThemes.length }}</span>
                <span class="stat-unit"> 可用</span>
              </div>
            </div>
            <div class="host-theme-rows">
              <div
                v-for="(theme, idx) in gameStore.hostThemes"
                :key="theme.name"
                class="host-theme-row"
                :class="{ consumed: theme.isConsumed }"
              >
                <span class="row-index">{{ String(idx + 1).padStart(2, '0') }}</span>
                <span class="row-name">{{ theme.name }}</span>
                <span class="row-status">{{ theme.isConsumed ? '已消耗' : '可挑戰' }}</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="settlement-fade">
        <div
          v-if="showSettlement"
          class="settlement-overlay"
          :class="settlementCorrect ? 'settlement-correct' : 'settlement-wrong'"
        >
          <div class="settlement-content">
            <div class="settlement-verdict">{{ settlementCorrect ? '猜對了！' : '猜錯了' }}</div>
            <div class="settlement-winner">{{ settlementWinnerName }} 勝利</div>
            <div v-if="settlementCorrect" class="settlement-count">
              總計投對 {{ currentVoterCorrect }} 次
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { useGameStore } from '../pinia/store'
import { getThemeClass } from '../utils/themeUtils'
import { socket } from '../socket'
import { Check, Clock, Shield, Swords } from 'lucide-vue-next'

const gameStore = useGameStore()
const activeTab = ref<'vote' | 'status'>('vote')
const hostPanelOpen = ref(false)
const hostAvailableCount = computed(() => gameStore.hostThemes.filter(t => !t.isConsumed).length)

const showSettlement = ref(false)
const settlementCorrect = ref(false)
const settlementWinnerName = ref('')
const showProphecy = ref(false)
const prophesyShown = ref(false)
let settlementTimer: number | null = null

const currentVoterCorrect = computed(() => {
  const name = gameStore.currentVoter?.name
  return name ? (gameStore.players.find(p => p.name === name)?.correct ?? 0) : 0
})

function checkProphecy() {
  if (prophesyShown.value) return
  if (currentVoterCorrect.value === 5) {
    showProphecy.value = true
    prophesyShown.value = true
  }
}

watch(() => gameStore.battleWinner, (winner) => {
  if (!winner || !gameStore.currentBattle) return
  if (!hasVoted.value) return
  if (settlementTimer !== null) { clearTimeout(settlementTimer); settlementTimer = null }

  const myVote = hasVotedFor(1) ? 1 : 2
  settlementCorrect.value =
    (myVote === 1 && winner === gameStore.currentBattle.player1Name) ||
    (myVote === 2 && winner === gameStore.currentBattle.player2Name)
  settlementWinnerName.value = winner
  showSettlement.value = true

  settlementTimer = window.setTimeout(() => {
    showSettlement.value = false
    settlementTimer = null
    checkProphecy()
  }, 4000)
})

const VOTE_WINDOW_MS = 10000
const now = ref(Date.now())
let countdownInterval: number | null = null

watch(() => gameStore.currentBattle, (battle) => {
  if (battle) {
    countdownInterval = window.setInterval(() => {
      now.value = Date.now()
      if (voteSecondsLeft.value === 0 && countdownInterval !== null) {
        clearInterval(countdownInterval)
        countdownInterval = null
      }
    }, 200)
    showSettlement.value = false
    if (settlementTimer !== null) { clearTimeout(settlementTimer); settlementTimer = null }
  } else {
    if (countdownInterval !== null) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }
  }
}, { immediate: true })

onUnmounted(() => {
  if (countdownInterval !== null) clearInterval(countdownInterval)
  if (settlementTimer !== null) clearTimeout(settlementTimer)
})

const voteSecondsLeft = computed(() => {
  const startedAt = gameStore.battleStartedAt
  if (!startedAt) return 0
  return Math.max(0, Math.ceil((startedAt + VOTE_WINDOW_MS - now.value) / 1000))
})

const voteOpen = computed(() => voteSecondsLeft.value > 0)

const selectableKeys = computed(() =>
  gameStore.currentChallenger ? gameStore.selectableThemeKeys : null
)

function vote(playerChoice: number) {
  const voterName = gameStore.currentVoter?.name
  if (!voterName || !gameStore.voteResults) return
  if (hasVoted.value) return
  if (!voteOpen.value) return

  gameStore.recordVote(playerChoice, voterName)
  socket.emit('recordVote', { playerChoice, voterName })
}

function hasVotedFor(playerNum: number): boolean {
  const voterName = gameStore.currentVoter?.name
  if (!voterName || !gameStore.voteResults) return false
  
  if (playerNum === 1) {
    return gameStore.voteResults.voters1.includes(voterName)
  } else if (playerNum === 2) {
    return gameStore.voteResults.voters2.includes(voterName)
  }
  return false
}

const hasVoted = computed(() => hasVotedFor(1) || hasVotedFor(2))

function getVotePercentage(playerNum: number): number {
  const votes1 = gameStore.voteResults?.votes1 || 0
  const votes2 = gameStore.voteResults?.votes2 || 0
  const total = votes1 + votes2
  
  if (total === 0) return 0
  
  if (playerNum === 1) {
    return (votes1 / total) * 100
  } else {
    return (votes2 / total) * 100
  }
}
</script>

<style scoped>
.vote-page {
  width: 100%;
  max-width: 100%;
}

.tab-navigation {
  display: flex;
  gap: 0;
  margin-bottom: 1.5rem;
  border-radius: 10px;
  overflow: hidden;
  background: var(--bg-panel);
  border: 1px solid rgba(25, 233, 255, 0.2);
}

.tab-button {
  flex: 1;
  padding: 1rem 0;
  text-align: center;
  border: none;
  background: transparent;
  font-weight: bold;
  font-family: 'Chakra Petch', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.25s ease;
  border-bottom: 2px solid transparent;
}

.tab-button.active {
  color: var(--glow);
  background: var(--glow-10);
  border-bottom-color: var(--glow);
}

.tab-button:hover {
  color: var(--text);
  background: rgba(25, 233, 255, 0.05);
}

.vote-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section {
  background: var(--bg-panel);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--glow-30);
}

.section h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: var(--text);
  font-size: 1.1rem;
  font-family: 'Chakra Petch', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-bottom: 2px solid var(--glow);
  padding-bottom: 0.75rem;
}

.vote-stats {
  background: var(--bg-surface);
  border-color: rgba(25, 233, 255, 0.12);
}

.vote-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.vote-btn {
  padding: 1.2rem 1rem;
  background: var(--glow);
  color: var(--bg-panel);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  transition: all 0.2s;
  font-size: 1rem;
  touch-action: manipulation;
}

.vote-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.vote-btn:hover:not(:disabled):not(.voted) {
  background: var(--glow-bright);
}

.vote-btn.voted {
  background: var(--glow-10);
  border: 2px solid var(--glow);
  color: var(--glow);
}

.vote-btn:disabled:not(.voted) {
  background: var(--bg-surface);
  color: var(--text-muted);
  cursor: not-allowed;
  opacity: 0.4;
}

.voting-disabled {
  padding: 1.5rem 1rem;
  background: var(--bg-surface);
  border-radius: 6px;
  text-align: center;
  color: var(--text-muted);
  font-size: 1rem;
}

.voted-message {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--glow-10);
  color: var(--glow);
  border: 1px solid var(--glow-30);
  border-radius: 6px;
  text-align: center;
  font-weight: bold;
  font-family: 'Chakra Petch', sans-serif;
}

.vote-results {
  padding: 0;
}

.result-item {
  margin-bottom: 1.5rem;
}

.result-item:last-child {
  margin-bottom: 0;
}

.player-name {
  display: block;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: var(--text);
  font-size: 1rem;
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
}

.result-bar {
  height: 40px;
  background: var(--bg-surface);
  border-radius: 6px;
  overflow: hidden;
  margin: 0.75rem 0;
}

.bar-fill {
  height: 100%;
  background: var(--glow);
  box-shadow: 0 0 8px var(--glow-30);
  transition: width 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bg-panel);
  font-weight: bold;
  font-size: 0.9rem;
  min-width: 30px;
}

.vote-number {
  display: block;
  font-size: 0.95rem;
  color: var(--text);
  font-weight: bold;
  font-family: 'Chakra Petch', sans-serif;
}

.voters-list {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-surface);
  border-radius: 4px;
  font-size: 0.85rem;
  border-left: 3px solid var(--glow);
}

.voters-label {
  color: var(--text-muted);
  font-weight: bold;
  display: block;
  margin-bottom: 0.3rem;
  font-family: 'Chakra Petch', sans-serif;
}

.voters-names {
  color: var(--text);
  word-break: break-word;
}

.player-list {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1rem;
}

.player-card {
  padding: 1rem;
  background: var(--bg-surface);
  border-radius: 14px;
  border: 1px solid var(--glow-30);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.player-card:hover {
  transform: translateY(-2px);
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
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
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
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
}

.theme-pill.consumed {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  border-color: transparent;
}

.theme-pill.temp-locked {
  background: rgba(245, 158, 11, 0.12);
  color: var(--warn);
  border-color: rgba(245, 158, 11, 0.3);
  opacity: 0.75;
}

.theme-pill.revival-locked {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  border-color: transparent;
}

.prop-area {
  margin-bottom: 0.75rem;
}

.prop-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.status-badge {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  background: rgba(255, 255, 255, 0.05);
  color: var(--danger);
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: bold;
  font-family: 'Chakra Petch', sans-serif;
}

.status-badge.active {
  background: var(--glow-10);
  color: var(--glow);
  border: 1px solid var(--glow-30);
}

.vote-timer {
  margin-bottom: 1.25rem;
  padding: 0.9rem 1rem 0.75rem;
  background: var(--bg-surface);
  border: 1px solid var(--glow-30);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  transition: border-color 0.35s ease, opacity 0.35s ease;
}

.vote-timer.urgent {
  border-color: rgba(239, 68, 68, 0.45);
  animation: timer-pulse 0.75s ease-in-out infinite;
}

.vote-timer.closed {
  border-color: rgba(255, 255, 255, 0.07);
  opacity: 0.5;
}

.vote-timer-track {
  height: 4px;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 999px;
  overflow: hidden;
}

.vote-timer-fill {
  height: 100%;
  background: var(--glow);
  border-radius: 999px;
  box-shadow: 0 0 6px var(--glow-30);
  transition: width 0.22s linear, background 0.35s ease, box-shadow 0.35s ease;
}

.vote-timer.urgent .vote-timer-fill {
  background: var(--danger);
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.45);
}

.vote-timer-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.35rem;
}

.vote-timer-number {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 2.6rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--glow);
  transition: color 0.35s ease;
}

.vote-timer.urgent .vote-timer-number {
  color: var(--danger);
  animation: number-throb 0.75s ease-in-out infinite;
}

.vote-timer-unit {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.22em;
  color: var(--text-muted);
  text-transform: uppercase;
  padding-bottom: 0.35rem;
}

.vote-timer-closed {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.25em;
  color: var(--text-muted);
  text-transform: uppercase;
  padding: 0.5rem 0;
}

@keyframes timer-pulse {
  0%, 100% { box-shadow: none; }
  50% { box-shadow: 0 0 14px rgba(239, 68, 68, 0.2); }
}

@keyframes number-throb {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}

@media (min-width: 768px) {
  .vote-container {
    gap: 2rem;
  }
  .section {
    padding: 2rem;
  }
  .result-bar {
    height: 50px;
  }
  .player-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .player-list {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

/* ── Host themes floating trigger ── */
.host-themes-btn {
  position: fixed;
  /* respect iPhone home bar */
  bottom: calc(1.25rem + env(safe-area-inset-bottom, 0px));
  left: 1rem;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  /* min-height: 44px — iOS minimum touch target */
  min-height: 44px;
  padding: 0 1rem 0 0.85rem;
  background: rgba(0, 13, 43, 0.88);
  border: 1px solid rgba(25, 233, 255, 0.28);
  border-radius: 999px;
  color: rgba(226, 244, 248, 0.72);
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  cursor: pointer;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.4);
  transition: border-color 0.2s, color 0.2s, box-shadow 0.2s, background 0.2s;
  -webkit-tap-highlight-color: transparent;
  /* prevent text selection on repeated taps */
  user-select: none;
}

.host-btn-sword {
  opacity: 0.6;
  flex-shrink: 0;
  transition: opacity 0.2s;
}

.host-btn-label {
  letter-spacing: 0.06em;
}

.host-btn-chip {
  display: flex;
  align-items: baseline;
  gap: 0.05rem;
  padding: 0.2rem 0.5rem;
  background: rgba(25, 233, 255, 0.1);
  border: 1px solid rgba(25, 233, 255, 0.2);
  border-radius: 999px;
  /* 0.78rem ≈ 12.5px — readable on mobile */
  font-size: 0.78rem;
  line-height: 1;
}

.chip-avail {
  color: var(--glow);
  font-weight: 700;
}

.chip-sep,
.chip-total {
  color: var(--text-muted);
}

/* open state always applies (not hover-dependent) */
.host-themes-btn.is-open {
  border-color: rgba(25, 233, 255, 0.55);
  color: var(--text);
  background: rgba(25, 233, 255, 0.07);
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.4), 0 0 16px rgba(25, 233, 255, 0.12);
}

.host-themes-btn.is-open .host-btn-sword {
  opacity: 1;
}

/* hover only on devices that support it (not mobile touch) */
@media (hover: hover) and (pointer: fine) {
  .host-themes-btn:hover {
    border-color: rgba(25, 233, 255, 0.55);
    color: var(--text);
    background: rgba(25, 233, 255, 0.07);
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.4), 0 0 16px rgba(25, 233, 255, 0.12);
  }
  .host-themes-btn:hover .host-btn-sword {
    opacity: 1;
  }
}

/* ── Overlay fade transition ── */
.host-overlay-enter-active {
  transition: opacity 0.2s ease;
}
.host-overlay-leave-active {
  transition: opacity 0.15s ease;
}
.host-overlay-enter-from,
.host-overlay-leave-to {
  opacity: 0;
}

/* ── Overlay backdrop ── */
.host-panel-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 5, 20, 0.65);
  z-index: 200;
  display: flex;
  align-items: flex-end;
}

/* ── Bottom sheet panel ── */
.host-panel {
  width: 100%;
  background: var(--bg-panel);
  border-top: 1px solid rgba(25, 233, 255, 0.18);
  border-radius: 18px 18px 0 0;
  /* 60vh gives room to see the content without covering whole screen on phone */
  max-height: 60vh;
  overflow-y: auto;
  /* always leave breathing room above the iPhone home bar */
  padding-bottom: max(env(safe-area-inset-bottom, 0px), 1rem);
  /* smooth momentum scroll on iOS */
  -webkit-overflow-scrolling: touch;
  animation: host-panel-up 0.32s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes host-panel-up {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

.host-panel-handle {
  width: 36px;
  height: 3px;
  background: rgba(226, 244, 248, 0.14);
  border-radius: 999px;
  margin: 0.75rem auto 0;
}

/* ── Panel header ── */
.host-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1.25rem 0.75rem;
  border-bottom: 1px solid rgba(25, 233, 255, 0.1);
}

.host-panel-header-title {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--text);
  font-family: 'Chakra Petch', sans-serif;
  /* 0.9rem ≈ 14.4px — comfortable mobile read */
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.host-panel-header-title svg {
  color: var(--glow);
  opacity: 0.8;
}

.host-panel-header-stat {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.8rem;
}

.stat-avail {
  color: var(--glow);
  font-weight: 700;
  font-size: 1rem;
}

.stat-sep,
.stat-unit {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.stat-total {
  color: var(--text-muted);
}

/* ── Theme rows ── */
.host-theme-rows {
  padding: 0.35rem 0 0.35rem;
}

.host-theme-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  /* 0.9rem top/bottom → min ~52px row height — comfortable scan on phone */
  padding: 0.9rem 1.25rem;
  transition: background 0.15s;
}

.host-theme-row:not(:last-child) {
  border-bottom: 1px solid rgba(25, 233, 255, 0.06);
}

.host-theme-row:not(.consumed):active {
  background: rgba(25, 233, 255, 0.04);
}

.row-index {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: rgba(25, 233, 255, 0.55);
  flex-shrink: 0;
  width: 1.6rem;
}

.host-theme-row.consumed .row-index {
  color: rgba(226, 244, 248, 0.2);
}

.row-name {
  flex: 1;
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
  /* 1rem ≈ 16px — primary readable text size for mobile */
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  letter-spacing: 0.02em;
}

.row-status {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.28rem 0.6rem;
  border-radius: 4px;
  flex-shrink: 0;
}

.host-theme-row:not(.consumed) .row-status {
  color: var(--glow);
  background: rgba(25, 233, 255, 0.1);
  border: 1px solid rgba(25, 233, 255, 0.22);
}

/* Consumed state */
.host-theme-row.consumed {
  opacity: 0.35;
}

.host-theme-row.consumed .row-name {
  text-decoration: line-through;
  text-decoration-color: rgba(226, 244, 248, 0.25);
}

.host-theme-row.consumed .row-status {
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
}

/* ── Settlement overlay ── */
.settlement-overlay {
  position: fixed;
  inset: 0;
  z-index: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.settlement-correct {
  background: rgba(0, 13, 43, 0.92);
  border-top: 3px solid var(--glow);
  box-shadow: inset 0 0 60px rgba(25, 233, 255, 0.08);
}

.settlement-wrong {
  background: rgba(20, 0, 0, 0.92);
  border-top: 3px solid var(--danger);
  box-shadow: inset 0 0 60px rgba(255, 70, 85, 0.08);
}

.settlement-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
}

.settlement-verdict {
  font-family: 'Chakra Petch', sans-serif;
  font-size: clamp(3rem, 15vw, 5rem);
  font-weight: 700;
  line-height: 1;
}

.settlement-correct .settlement-verdict {
  color: var(--glow);
  text-shadow: 0 0 30px var(--glow), 0 0 60px rgba(25, 233, 255, 0.3);
}

.settlement-wrong .settlement-verdict {
  color: var(--danger);
  text-shadow: 0 0 30px var(--danger);
}

.settlement-winner {
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
  font-size: 1.2rem;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.settlement-count {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 1rem;
  color: var(--glow);
  opacity: 0.75;
  letter-spacing: 0.06em;
}

.settlement-fade-enter-active {
  transition: opacity 0.3s ease;
}
.settlement-fade-leave-active {
  transition: opacity 0.6s ease;
}
.settlement-fade-enter-from,
.settlement-fade-leave-to {
  opacity: 0;
}
</style>
