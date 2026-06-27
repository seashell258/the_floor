<template>
  <section class="section battle-section" :class="borderFlashClass">
    <button class="mute-btn" @click="toggleMute" :title="isMuted ? '取消靜音' : '靜音'">
      <VolumeX v-if="isMuted" :size="16" />
      <Volume2 v-else :size="16" />
    </button>
    <div class="battle-row">
      <div class="vote-bar">
        <div class="vote-col">
          <span class="vote-count">{{ voteResults?.votes1 ?? 0 }}</span>
          <div class="vote-track">
            <div class="vote-fill p1-fill" :style="{ height: getVotePercent(1) + '%' }"></div>
          </div>
          <span class="vote-name">{{ voteResults?.player1 || 'P1' }}</span>
        </div>
        <div class="vote-col">
          <span class="vote-count">{{ voteResults?.votes2 ?? 0 }}</span>
          <div class="vote-track">
            <div class="vote-fill p2-fill" :style="{ height: getVotePercent(2) + '%' }"></div>
          </div>
          <span class="vote-name">{{ voteResults?.player2 || 'P2' }}</span>
        </div>
      </div>
      <div class="battle-main">
        <div class="battle-stage">
          <div v-if="battleInfo" class="battle-card">
            <div class="battle-meta">
              <div>
                <span class="label">對戰者</span>
                <strong>{{ battleInfo.player1Name }}</strong>
                <div :class="['timer', { active: currentTimerPlayer === battleInfo.player1Name && isTimerRunning }]">
                  {{ challengerTimer }}s
                </div>
              </div>
              <div v-if="selectedThemeName" class="theme-meta">
                <span class="label">主題</span>
                <strong>{{ selectedThemeName }}</strong>
              </div>
              <div>
                <span class="label">VS</span>
                <strong>{{ battleInfo.player2Name }}</strong>
                <div :class="['timer', { active: currentTimerPlayer === battleInfo.player2Name && isTimerRunning }]">
                  {{ defenderTimer }}s
                </div>
              </div>
            </div>
            <img :src="currentPhotoSrc" :alt="currentPhoto" class="battle-image" @error="onPhotoError">
          </div>

          <div v-else class="no-battle large">
            尚無對戰
          </div>
        </div>

        <Transition name="warning-fade">
          <div v-if="showEndWarning" class="endgame-warning" :class="{ critical: isCritical }">
            <div class="endgame-dots">
              <span
                v-for="i in 7"
                :key="i"
                class="endgame-dot"
                :class="{ active: i <= remainingQuestions }"
              />
            </div>
            <div class="endgame-ticker">
              <span class="endgame-suffix">最後</span>
              <span class="endgame-number" :key="remainingQuestions">{{ remainingQuestions }}</span>
              <span class="endgame-suffix">題</span>
            </div>
            <div class="endgame-note">題目用完後 · 以<strong>剩餘秒數</strong>決勝</div>
          </div>
        </Transition>

        <div v-if="battleWinner && battleInfo && !showCeremony" class="result-panel">
          <div class="winner-announcement">
            <template v-if="isHostBattle">
              <template v-if="battleWinner === '主持人'">主持人勝利，{{ hostBattlePlayerName }}解鎖失敗</template>
              <template v-else>{{ hostBattlePlayerName }}勝利，多解鎖一個可用主題!</template>
            </template>
            <template v-else>{{ battleWinner }} 勝利！</template>
          </div>
          <div v-if="!isHostBattle" class="result-detail">
            <span class="loser-name">
              {{ battleWinner === battleInfo.player1Name ? battleInfo.player2Name : battleInfo.player1Name }}
              的第一順位主題已消耗
            </span>
          </div>
          <div v-if="isHostBattle" class="host-remaining">
            <span v-for="t in gameStore.hostThemes" :key="t.name" class="host-remaining-dot" :class="{ consumed: t.isConsumed }" :title="t.name" />
            <span class="host-remaining-label">剩 {{ hostThemesRemaining }}</span>
          </div>
          <button class="end-battle-btn" @click="endBattle">結束對戰</button>
        </div>
        <div v-else class="answer-panel">
          <div class="answer-body">
            <p v-if="showAnswer">{{ currentAnswer || selectedThemeAnswers[currentPhotoIndex] || '暫無答案' }}</p>
            <p v-else></p>
          </div>
        </div>
      </div>

      <div class="battle-controls">
        <button
          class="skip-btn"
          :class="{ danger: skipBtnDanger }"
          @click="skipQuestion"
          :disabled="isNextDisabled"
        >{{ skipBtnLabel }}</button>
        <button class="next-btn" @click="nextQuestion" :disabled="isNextDisabled">下一題</button>
      </div>
    </div>
  </section>

  <Teleport to="body">
    <div
      v-if="showContinueDialog"
      class="continue-overlay"
      @click.self="confirmRestart"
    >
      <div class="continue-dialog">
        <p class="continue-question"> <strong>{{ pendingWinnerName }}</strong> 要繼續挑戰？</p>
        <div class="continue-actions">
          <button type="button" class="continue-btn primary" @click="confirmContinue">繼續挑戰</button>
          <button type="button" class="continue-btn secondary" @click="confirmRestart">見好就收</button>
        </div>
      </div>
    </div>
  </Teleport>

  <WinnerCeremony
    v-if="battleWinner && showCeremony"
    :winner="battleWinner!"
    :is-streak="ceremonyIsStreak"
    :bonuses="currentBattleBonuses"
    @dismissed="onCeremonyDismissed"
  />

  <Teleport to="body">
    <div
      v-if="showUnlockOverlay"
      class="unlock-overlay"
      :class="{ 'unlock-fading': unlockFading }"
      @click="dismissUnlockOverlay"
    >
      <div class="unlock-rings">
        <div class="unlock-ring ur1" />
        <div class="unlock-ring ur2" />
        <div class="unlock-ring ur3" />
      </div>
      <div class="unlock-sparks">
        <div v-for="i in 12" :key="i" class="unlock-spark" :style="unlockSparkStyle(i)" />
      </div>
      <div class="unlock-center">
        <div class="unlock-icon">
          <Unlock :size="88" />
        </div>
        <div class="unlock-headline">主題解鎖！</div>
        <div class="unlock-theme-name">{{ unlockThemeName }}</div>
        <div class="unlock-sub">{{ unlockPlayerName }} 擊敗主持人</div>
      </div>
      <div class="unlock-tap-hint">點擊繼續</div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { useGameStore } from '../../pinia/store'
import { socket } from '../../socket'
import { Volume2, VolumeX, Unlock } from 'lucide-vue-next'
import {
  isMuted, toggleMute,
  startBattleMusic, stopBattleMusic,
  playNextSFX, playSkipSFX, playWinnerSFX
} from '../../composables/useAudio'
import WinnerCeremony from './WinnerCeremony.vue'

const emit = defineEmits<{ (e: 'battle-ended'): void }>()

const gameStore = useGameStore()

const props = defineProps<{
  selectedThemeName: string
  selectedThemePhotos: string[]
  selectedThemeAnswers: string[]
}>()

const selectedThemeName = computed(() => props.selectedThemeName)
const selectedThemePhotos = computed(() => props.selectedThemePhotos)
const selectedThemeAnswers = computed(() => props.selectedThemeAnswers)

const battleInfo = computed(() => gameStore.currentBattle)
const voteResults = computed(() => gameStore.voteResults)
const challengerTimer = computed(() => gameStore.challengerTimer)
const defenderTimer = computed(() => gameStore.defenderTimer)
const currentTimerPlayer = computed(() => gameStore.currentTimerPlayer)
const isTimerRunning = computed(() => gameStore.isTimerRunning)
const battleWinner = computed(() => gameStore.battleWinner)
const isHostBattle = computed(() =>
  battleInfo.value?.player1Name === '主持人' || battleInfo.value?.player2Name === '主持人'
)
const hostBattlePlayerName = computed(() => {
  if (!battleInfo.value) return ''
  return battleInfo.value.player1Name === '主持人' ? battleInfo.value.player2Name : battleInfo.value.player1Name
})
const hostThemesRemaining = computed(() => gameStore.hostThemes.filter(t => !t.isConsumed).length)

function getVotePercent(playerNum: 1 | 2): number {
  const v1 = voteResults.value?.votes1 ?? 0
  const v2 = voteResults.value?.votes2 ?? 0
  const total = v1 + v2
  if (total === 0) return 0
  return playerNum === 1 ? (v1 / total) * 100 : (v2 / total) * 100
}

const borderFlash = ref<'idle' | 'next' | 'skip'>('idle')
const borderFlashClass = computed(() => ({
  'flash-next': borderFlash.value === 'next',
  'flash-skip': borderFlash.value === 'skip',
}))

const currentPhotoIndex = ref(0)
const showAnswer = ref(false)
const showContinueDialog = ref(false)
const pendingWinnerName = ref('')
const showCeremony = ref(false)
const hasSkippedOnce = ref(false)

interface BonusReward {
  seconds: number
  reason: string
  type: 'streak' | 'elimination'
}
const currentBattleBonuses = ref<BonusReward[]>([])

// ─── Unlock overlay ───
const showUnlockOverlay = ref(false)
const unlockFading = ref(false)
const unlockPlayerName = ref('')
const unlockThemeName = ref('')
let unlockAutoTimer: number | null = null
let pendingHostBattleEnd = false
const skipBtnLabel = computed(() => hasSkippedOnce.value ? '再次跳過' : '跳過')
const skipBtnDanger = computed(() => hasSkippedOnce.value)
const ceremonyIsStreak = computed(() => {
  if (!battleWinner.value || isHostBattle.value) return false
  const winner = gameStore.players.find(p => p.name === battleWinner.value)
  return (winner?.winStreak ?? 0) >= 2
})

const PHOTO_FORMATS = ['avif', 'webp', 'jpg', 'png', 'jpeg']
const photoFormatIndex = ref(0)
const currentPhoto = computed(() => selectedThemePhotos.value[currentPhotoIndex.value] ?? '')
const currentPhotoSrc = computed(() => `${currentPhoto.value}.${PHOTO_FORMATS[photoFormatIndex.value]}`)

function onPhotoError() {
  if (photoFormatIndex.value < PHOTO_FORMATS.length - 1) {
    photoFormatIndex.value++
  }
}

watch(currentPhoto, () => {
  photoFormatIndex.value = 0
})
const currentAnswer = ref('')

watch(
  selectedThemePhotos,
  () => {
    currentPhotoIndex.value = 0
    showAnswer.value = false
    currentAnswer.value = ''
  },
  { immediate: true }
)

const skipQuestion = () => {
  if (selectedThemePhotos.value.length === 0 || showAnswer.value) return

  gameStore.penalizeTimer(3)

  if (gameStore.battleWinner) return

  playSkipSFX()
  borderFlash.value = 'skip'
  currentAnswer.value = selectedThemeAnswers.value[currentPhotoIndex.value] ?? '暫無答案'
  showAnswer.value = true
  gameStore.pauseTimer()

  const wasFirstSkip = !hasSkippedOnce.value

  setTimeout(() => {
    const wasLast = currentPhotoIndex.value >= selectedThemePhotos.value.length - 1
    if (!wasLast) currentPhotoIndex.value += 1
    showAnswer.value = false
    currentAnswer.value = ''
    borderFlash.value = 'idle'

    if (wasLast) {
      hasSkippedOnce.value = false
      resolveByTimer()
    } else if (wasFirstSkip) {
      // 1st skip: same player continues, flag set
      hasSkippedOnce.value = true
      gameStore.startTimer(gameStore.currentTimerPlayer || '')
    } else {
      // 2nd consecutive skip: transfer answering rights
      hasSkippedOnce.value = false
      gameStore.switchTimer()
      gameStore.startTimer(gameStore.currentTimerPlayer || '')
    }
  }, 800)
}

const nextQuestion = () => {
  if (selectedThemePhotos.value.length === 0 || showAnswer.value) return

  playNextSFX()
  borderFlash.value = 'next'
  currentAnswer.value = selectedThemeAnswers.value[currentPhotoIndex.value] ?? '暫無答案'
  showAnswer.value = true
  gameStore.pauseTimer()

  setTimeout(() => {
    const wasLast = currentPhotoIndex.value >= selectedThemePhotos.value.length - 1
    if (!wasLast) currentPhotoIndex.value += 1
    showAnswer.value = false
    currentAnswer.value = ''
    borderFlash.value = 'idle'
    if (wasLast) {
      resolveByTimer()
    } else {
      hasSkippedOnce.value = false
      gameStore.switchTimer()
      gameStore.startTimer(gameStore.currentTimerPlayer || '')
    }
  }, 800)
}

function resolveByTimer() {
  const battle = gameStore.currentBattle
  if (!battle) return
  const winnerName = gameStore.challengerTimer >= gameStore.defenderTimer
    ? battle.player1Name
    : battle.player2Name
  gameStore.processBattleResult(winnerName)
}

const isNextDisabled = computed(
  () => selectedThemePhotos.value.length === 0 || showAnswer.value
)

const remainingQuestions = computed(() => {
  const total = selectedThemePhotos.value.length
  if (total === 0) return 0
  return total - currentPhotoIndex.value
})
const showEndWarning = computed(() =>
  remainingQuestions.value > 0 &&
  remainingQuestions.value <= 7 &&
  !!battleInfo.value &&
  !battleWinner.value
)
const isCritical = computed(() => remainingQuestions.value <= 3)

watch(battleInfo, (info) => {
  if (info) startBattleMusic()
}, { immediate: true })

watch(battleWinner, (winner) => {
  if (!winner) return
  stopBattleMusic()

  // Infer bonuses earned this battle (player-vs-player only)
  const bonuses: BonusReward[] = []
  if (!isHostBattle.value) {
    const battle = gameStore.currentBattle
    const winnerPlayer = gameStore.players.find(p => p.name === winner)
    if (battle && winnerPlayer) {
      const loserName = winner === battle.player1Name ? battle.player2Name : battle.player1Name
      const loserPlayer = gameStore.players.find(p => p.name === loserName)
      if (winnerPlayer.winStreak === 2) bonuses.push({ seconds: 3, reason: '2連勝', type: 'streak' })
      if (winnerPlayer.winStreak === 4) bonuses.push({ seconds: 7, reason: '4連勝', type: 'streak' })
      if (loserPlayer?.eliminated) bonuses.push({ seconds: 5, reason: '擊倒對手', type: 'elimination' })
    }
  }
  currentBattleBonuses.value = bonuses

  if (!ceremonyIsStreak.value) {
    playWinnerSFX()
  }
  showCeremony.value = true
  socket.emit('pushVoteState', {
    currentBattle: gameStore.currentBattle,
    voteResults: gameStore.voteResults,
    battleWinner: winner,
    battleStartedAt: gameStore.battleStartedAt,
    playersSnapshot: gameStore.players.map(p => ({
      name: p.name,
      eliminated: p.eliminated,
      winStreak: p.winStreak,
      prop: p.prop,
      correct: p.correct,
      themeItems: p.themeStack.items.map(t => ({
        name: t.name,
        isConsumed: t.isConsumed,
        isActivated: t.isActivated,
        capturedFrom: t.capturedFrom
      }))
    })),
    hostThemesSnapshot: gameStore.hostThemes.map(t => ({
      name: t.name,
      isConsumed: t.isConsumed
    }))
  })
})

function doFinishHostBattleEnd() {
  gameStore.clearChallenger()
  emit('battle-ended')
}

function dismissUnlockOverlay() {
  if (!showUnlockOverlay.value) return
  if (unlockAutoTimer) { clearTimeout(unlockAutoTimer); unlockAutoTimer = null }
  unlockFading.value = true
  setTimeout(() => {
    showUnlockOverlay.value = false
    unlockFading.value = false
    if (pendingHostBattleEnd) {
      pendingHostBattleEnd = false
      doFinishHostBattleEnd()
    }
  }, 380)
}

function endBattle() {
  const winnerName = gameStore.battleWinner ?? ''
  pendingWinnerName.value = winnerName
  hasSkippedOnce.value = false
  stopBattleMusic()
  const wasHostBattle = isHostBattle.value
  let didUnlock = false

  // Auto-unlock revival theme: player beat the host, no manual step needed
  if (wasHostBattle && winnerName && winnerName !== '主持人') {
    gameStore.activateRevivalTheme(winnerName)
    const unlocked = gameStore.justUnlockedTheme
    if (unlocked) {
      didUnlock = true
      unlockPlayerName.value = unlocked.playerName
      unlockThemeName.value = unlocked.themeName
    }
  }

  gameStore.resetBattle()
  socket.emit('pushVoteState', {
    currentBattle: gameStore.currentBattle,
    voteResults: gameStore.voteResults,
    battleWinner: gameStore.battleWinner,
    battleStartedAt: gameStore.battleStartedAt,
    playersSnapshot: gameStore.players.map(p => ({
      name: p.name,
      eliminated: p.eliminated,
      winStreak: p.winStreak,
      prop: p.prop,
      correct: p.correct,
      themeItems: p.themeStack.items.map(t => ({
        name: t.name,
        isConsumed: t.isConsumed,
        isActivated: t.isActivated,
        capturedFrom: t.capturedFrom
      }))
    })),
    hostThemesSnapshot: gameStore.hostThemes.map(t => ({
      name: t.name,
      isConsumed: t.isConsumed
    }))
  })
  if (wasHostBattle) {
    if (didUnlock) {
      showUnlockOverlay.value = true
      unlockFading.value = false
      pendingHostBattleEnd = true
      unlockAutoTimer = window.setTimeout(dismissUnlockOverlay, 3400)
    } else {
      doFinishHostBattleEnd()
    }
  } else {
    showContinueDialog.value = true
  }
}

function confirmContinue() {
  showContinueDialog.value = false
  const winnerPlayer = gameStore.players.find(p => p.name === pendingWinnerName.value)
  if (winnerPlayer) gameStore.setChallenger(winnerPlayer)
  gameStore.removeFromWheel(pendingWinnerName.value)
  pendingWinnerName.value = ''
  emit('battle-ended')
}

function confirmRestart() {
  showContinueDialog.value = false
  gameStore.removeFromWheel(pendingWinnerName.value)
  gameStore.resetWinStreak(pendingWinnerName.value)
  pendingWinnerName.value = ''
  gameStore.clearChallenger()
  emit('battle-ended')
}

function onCeremonyDismissed() {
  showCeremony.value = false
  currentBattleBonuses.value = []
}

function unlockSparkStyle(i: number) {
  const angle = ((i - 1) / 12) * 360
  const rad = (angle * Math.PI) / 180
  const dist = 120 + ((i * 23) % 65)
  const size = 5 + ((i * 9) % 8)
  const delay = ((i * 0.055) % 0.3)
  return {
    '--tx': `${Math.cos(rad) * dist}px`,
    '--ty': `${Math.sin(rad) * dist}px`,
    width: `${size}px`,
    height: `${size}px`,
    '--delay': `${delay}s`,
  }
}

onUnmounted(() => {
  stopBattleMusic()
  if (unlockAutoTimer) clearTimeout(unlockAutoTimer)
})
</script>

<style scoped>
.section {
  background: var(--bg-panel);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--glow);
  box-shadow: 0 0 20px var(--glow-10);
  transition: box-shadow 0.55s ease, border-color 0.55s ease;
}

.section.flash-next {
  transition: box-shadow 0.07s ease, border-color 0.07s ease;
  border-color: var(--glow-bright);
  box-shadow:
    0 0 10px var(--glow),
    0 0 32px var(--glow),
    0 0 72px var(--glow-30),
    inset 0 0 24px rgba(25, 233, 255, 0.06);
}

.section.flash-skip {
  transition: box-shadow 0.07s ease, border-color 0.07s ease;
  border-color: var(--danger);
  box-shadow:
    0 0 10px var(--danger),
    0 0 32px var(--danger),
    0 0 72px rgba(255, 70, 85, 0.35),
    inset 0 0 24px rgba(255, 70, 85, 0.06);
}

.battle-section {
  height: calc(100dvh - 8rem);
  display: flex;
  flex-direction: column;
  position: relative;
}

.mute-btn {
  position: fixed;
  top: 0.7rem;
  right: 1rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--text-muted);
  opacity: 0.35;
  padding: 0.25rem 0.4rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: color 0.15s, border-color 0.15s, opacity 0.15s;
  z-index: 500;
}

.mute-btn:hover {
  color: var(--glow);
  border-color: var(--glow-30);
  opacity: 1;
}

.battle-row {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  flex: 1;
  align-items: stretch;
  min-height: 0;
}

.battle-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.battle-stage {
  flex: 1;
  display: flex;
  align-items: stretch;
  margin-bottom: 1rem;
  min-height: 0;
}

.battle-card,
.no-battle.large {
  width: 100%;
  border-radius: 12px;
  background: var(--bg-panel);
  border: 1px solid var(--glow-30);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.battle-card {
  overflow: hidden;
  min-height: 0;
  justify-content: flex-start;
}

.battle-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.battle-meta > div {
  flex: 1 1 0;
  min-width: 0;
  text-align: center;
}

.theme-meta {
  text-align: center;
}

.battle-meta .label {
  display: block;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-family: 'Chakra Petch', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.battle-meta strong {
  color: var(--text);
  font-family: 'Chakra Petch', sans-serif;
}

.theme-meta strong {
  color: var(--glow);
}

.timer {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: var(--bg-surface);
  border-radius: 8px;
  font-weight: bold;
  color: var(--text-muted);
  text-align: center;
  font-family: 'Chakra Petch', sans-serif;
  font-size: 1.4rem;
  transition: all 0.3s ease;
}

.timer.active {
  background: var(--glow-10);
  color: var(--glow);
  box-shadow: 0 0 16px var(--glow);
  animation: glow-pulse 1s ease-in-out infinite;
}

.battle-image {
  flex: 1;
  min-height: 0;
  width: 100%;
  object-fit: contain;
  border-radius: 12px;
  display: block;
}

.answer-panel {
  border-radius: 12px;
  background: var(--bg-surface);
  border: 1px solid rgba(25, 233, 255, 0.15);
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.answer-body {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  min-height: 90px;
  background: var(--bg-panel);
  border-radius: 10px;
  color: var(--text);
  text-align: center;
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
}

.battle-controls {
  width: 88px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
}

.skip-btn {
  width: 100%;
  padding: 1rem 0.5rem;
  background: var(--warn);
  color: var(--bg-panel);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-family: 'Chakra Petch', sans-serif;
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-align: center;
}

.skip-btn:disabled {
  background: var(--bg-surface);
  color: var(--text-muted);
  cursor: not-allowed;
}

.skip-btn:hover:not(:disabled) {
  opacity: 0.85;
}

.skip-btn.danger {
  background: var(--danger);
}

.skip-btn.danger:hover:not(:disabled) {
  opacity: 0.85;
}

.next-btn {
  width: 100%;
  padding: 1rem 0.5rem;
  background: var(--glow);
  color: var(--bg-panel);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-family: 'Chakra Petch', sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-align: center;
}

.next-btn:disabled {
  background: var(--bg-surface);
  color: var(--text-muted);
  cursor: not-allowed;
}

.next-btn:hover:not(:disabled) {
  background: var(--glow-bright);
}

.no-battle.large {
  min-height: 100%;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-muted);
}

.result-panel {
  border-radius: 12px;
  background: var(--bg-surface);
  border: 2px solid var(--glow);
  box-shadow: 0 0 24px var(--glow-30);
  padding: 1rem;
  text-align: center;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  animation: fade-slide-up 0.3s ease-out;
}

.winner-announcement {
  font-size: 1.4rem;
  font-weight: bold;
  color: var(--glow);
  text-shadow: 0 0 16px var(--glow-30);
  font-family: 'Chakra Petch', sans-serif;
  text-transform: uppercase;
}

.result-detail {
  font-size: 0.95rem;
  color: var(--text-muted);
}

.loser-name {
  font-weight: 600;
  color: var(--text);
}

.end-battle-btn {
  padding: 0.7rem 1.8rem;
  background: transparent;
  color: var(--glow);
  border: 1px solid var(--glow);
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  transition: background 0.2s;
}

.end-battle-btn:hover {
  background: var(--glow-10);
}

.vote-bar {
  width: 120px;
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: stretch;
  margin-left: -0.35rem;
}

.vote-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.vote-count {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.9rem;
  font-weight: bold;
  color: var(--text);
  line-height: 1;
}

.vote-track {
  flex: 1;
  width: 100%;
  background: var(--bg-surface);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.vote-fill {
  width: 100%;
  border-radius: 4px;
  transition: height 0.4s ease;
}

.p1-fill {
  background: var(--glow);
  box-shadow: 0 0 8px var(--glow-30);
}

.p2-fill {
  background: var(--warn);
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.3);
}

.vote-name {
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
  font-size: 1.4rem;
  color: var(--text-muted);
  writing-mode: vertical-lr;
  text-orientation: mixed;
  text-align: center;
  line-height: 1;
  height: 120px;
  width: 1.4rem;
  overflow: hidden;
  text-overflow: ellipsis;
  align-self: center;
}

/* Continue-challenge confirmation dialog */
.continue-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  z-index: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.continue-dialog {
  background: var(--bg-panel);
  border: 1px solid var(--glow);
  border-radius: 12px;
  padding: 2rem 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  min-width: 280px;
  box-shadow: 0 0 40px var(--glow-30);
}

.continue-question {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text);
  font-family: 'Chakra Petch', sans-serif;
  text-align: center;
  letter-spacing: 0.04em;
}

.continue-question strong {
  color: var(--glow);
}

.continue-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.continue-btn {
  padding: 0.65rem 1.4rem;
  border-radius: 8px;
  font-family: 'Chakra Petch', sans-serif;
  font-weight: 600;
  font-size: 0.9rem;
  letter-spacing: 0.06em;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.continue-btn.primary {
  background: var(--glow);
  color: var(--bg-panel);
  border-color: var(--glow);
}

.continue-btn.primary:hover {
  background: var(--glow-bright, var(--glow));
  border-color: var(--glow-bright, var(--glow));
}

.continue-btn.secondary {
  background: transparent;
  color: var(--text-muted);
  border-color: var(--glow-30);
}

.continue-btn.secondary:hover {
  color: var(--text);
  border-color: var(--glow);
}

/* Endgame warning */
.endgame-warning {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.55rem 1rem;
  margin: 0.35rem 0;
  background: rgba(245, 158, 11, 0.07);
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 8px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.endgame-warning::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--warn);
  border-radius: 8px 0 0 8px;
}

.endgame-warning.critical {
  background: rgba(255, 70, 85, 0.07);
  border-color: rgba(255, 70, 85, 0.35);
  animation: critical-pulse 1.2s ease-in-out infinite;
}

.endgame-warning.critical::before {
  background: var(--danger);
}

@keyframes critical-pulse {
  0%, 100% { box-shadow: none; }
  50% { box-shadow: 0 0 16px rgba(255, 70, 85, 0.22), 0 0 32px rgba(255, 70, 85, 0.08); }
}

.endgame-dots {
  display: flex;
  gap: 5px;
  align-items: center;
  flex-shrink: 0;
}

.endgame-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 1px solid rgba(245, 158, 11, 0.25);
  background: transparent;
  transition: background 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
}

.endgame-dot.active {
  background: var(--warn);
  border-color: var(--warn);
  box-shadow: 0 0 6px rgba(245, 158, 11, 0.55);
}

.critical .endgame-dot {
  border-color: rgba(255, 70, 85, 0.25);
}

.critical .endgame-dot.active {
  background: var(--danger);
  border-color: var(--danger);
  box-shadow: 0 0 6px rgba(255, 70, 85, 0.55);
}

.endgame-ticker {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
  flex-shrink: 0;
}

.endgame-suffix {
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
  font-size: 0.78rem;
  color: var(--warn);
  font-weight: 600;
  letter-spacing: 0.04em;
}

.critical .endgame-suffix {
  color: var(--danger);
}

.endgame-number {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--warn);
  line-height: 1;
  display: inline-block;
  animation: endgame-pop 0.32s ease-out;
}

.critical .endgame-number {
  color: var(--danger);
}

@keyframes endgame-pop {
  0%   { transform: scale(1.5); opacity: 0.3; }
  60%  { transform: scale(0.92); }
  100% { transform: scale(1);   opacity: 1; }
}

.endgame-note {
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
  font-size: 0.75rem;
  color: rgba(245, 158, 11, 0.65);
  letter-spacing: 0.03em;
  flex: 1;
}

.endgame-note strong {
  color: var(--warn);
  font-weight: 700;
}

.critical .endgame-note {
  color: rgba(255, 70, 85, 0.65);
}

.critical .endgame-note strong {
  color: var(--danger);
}

/* Transition */
.warning-fade-enter-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.warning-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.warning-fade-enter-from,
.warning-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ─── Host remaining themes indicator ─── */

.host-remaining {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.host-remaining-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--glow);
  box-shadow: 0 0 6px rgba(25, 233, 255, 0.6);
  flex-shrink: 0;
}

.host-remaining-dot.consumed {
  background: rgba(255, 255, 255, 0.12);
  box-shadow: none;
}

.host-remaining-label {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-left: 2px;
}

/* ─── Revival Unlock Overlay ─── */

.unlock-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  background: rgba(0, 3, 14, 0.97);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
}

.unlock-overlay.unlock-fading {
  animation: unlock-out 0.38s ease-out forwards;
}

@keyframes unlock-out {
  to { opacity: 0; }
}

/* Expanding rings */
.unlock-rings {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.unlock-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(255, 220, 80, 0.65);
}

.unlock-ring.ur1 { width: 110px; height: 110px; animation: unlock-ring-expand 1.15s 0.08s ease-out forwards; }
.unlock-ring.ur2 { width: 110px; height: 110px; animation: unlock-ring-expand 1.35s 0.26s ease-out forwards; }
.unlock-ring.ur3 { width: 110px; height: 110px; animation: unlock-ring-expand 1.55s 0.46s ease-out forwards; }

@keyframes unlock-ring-expand {
  from { transform: scale(0.65); opacity: 0.8; }
  to   { transform: scale(7);   opacity: 0; }
}

/* Spark particles */
.unlock-sparks {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.unlock-spark {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 220, 80, 0.9);
  box-shadow: 0 0 6px rgba(255, 220, 80, 0.95);
  opacity: 0;
  animation: unlock-spark-fly 0.7s var(--delay, 0s) ease-out forwards;
}

@keyframes unlock-spark-fly {
  0%   { transform: translate(0, 0) scale(1.3); opacity: 1; }
  55%  { opacity: 0.6; }
  100% { transform: translate(var(--tx, 80px), var(--ty, 0px)) scale(0); opacity: 0; }
}

/* Central content */
.unlock-center {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.4rem;
  text-align: center;
  padding: 2rem;
}

.unlock-icon {
  color: rgba(255, 220, 80, 0.96);
  filter:
    drop-shadow(0 0 24px rgba(255, 220, 80, 0.9))
    drop-shadow(0 0 72px rgba(255, 220, 80, 0.3));
  animation: unlock-icon-slam 0.55s cubic-bezier(0.18, 1.35, 0.38, 1) forwards;
}

@keyframes unlock-icon-slam {
  from { transform: scale(0.1) rotate(22deg); opacity: 0; filter: blur(16px); }
  to   { transform: scale(1) rotate(0deg);   opacity: 1; filter: blur(0); }
}

.unlock-headline {
  font-family: 'Chakra Petch', sans-serif;
  font-size: clamp(3rem, 11vw, 5rem);
  font-weight: 900;
  color: rgba(255, 220, 80, 0.97);
  letter-spacing: 0.04em;
  line-height: 1;
  text-shadow:
    0 0 28px rgba(255, 220, 80, 0.9),
    0 0 72px rgba(255, 220, 80, 0.25);
  opacity: 0;
  animation: unlock-stamp 0.48s 0.28s cubic-bezier(0.18, 1.45, 0.38, 1) forwards;
}

@keyframes unlock-stamp {
  from { transform: scale(2.4); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}

.unlock-theme-name {
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
  font-size: clamp(1.65rem, 6.5vw, 3rem);
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.02em;
  text-shadow: 0 0 24px rgba(255, 255, 255, 0.22);
  padding: 0.6rem 1.5rem;
  border: 1.5px solid rgba(255, 220, 80, 0.35);
  border-radius: 10px;
  background: rgba(255, 220, 80, 0.06);
  opacity: 0;
  animation: unlock-rise 0.42s 0.6s ease-out forwards;
}

.unlock-sub {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 220, 80, 0.5);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0;
  animation: unlock-rise 0.38s 0.82s ease-out forwards;
}

@keyframes unlock-rise {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

.unlock-tap-hint {
  position: absolute;
  bottom: 2.5rem;
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.62rem;
  letter-spacing: 0.38em;
  text-transform: uppercase;
  color: rgba(255, 220, 80, 0.42);
  opacity: 0;
  animation: unlock-hint-in 0.3s 1.3s ease forwards;
}

@keyframes unlock-hint-in {
  to { opacity: 1; }
}
</style>
