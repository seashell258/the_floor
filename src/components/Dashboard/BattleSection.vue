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
              <template v-else>{{ hostBattlePlayerName }}勝利，解鎖多一個主題!</template>
            </template>
            <template v-else>{{ battleWinner }} 勝利！</template>
          </div>
          <div v-if="!isHostBattle" class="result-detail">
            <span class="loser-name">
              {{ battleWinner === battleInfo.player1Name ? battleInfo.player2Name : battleInfo.player1Name }}
              的第一順位主題已消耗
            </span>
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
    @dismissed="onCeremonyDismissed"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { useGameStore } from '../../pinia/store'
import { socket } from '../../socket'
import { Volume2, VolumeX } from 'lucide-vue-next'
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
        isActivated: t.isActivated
      }))
    })),
    hostThemesSnapshot: gameStore.hostThemes.map(t => ({
      name: t.name,
      isConsumed: t.isConsumed
    }))
  })
})

function endBattle() {
  pendingWinnerName.value = gameStore.battleWinner ?? ''
  hasSkippedOnce.value = false
  stopBattleMusic()
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
        isActivated: t.isActivated
      }))
    })),
    hostThemesSnapshot: gameStore.hostThemes.map(t => ({
      name: t.name,
      isConsumed: t.isConsumed
    }))
  })
  if (isHostBattle.value) {
    gameStore.clearChallenger()
    emit('battle-ended')
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
}

onUnmounted(() => stopBattleMusic())
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
</style>
