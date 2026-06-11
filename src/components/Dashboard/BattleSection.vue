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

        <div v-if="battleWinner && battleInfo" class="result-panel">
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
        <button class="skip-btn" @click="skipQuestion" :disabled="isNextDisabled">跳過</button>
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

  setTimeout(() => {
    const wasLast = currentPhotoIndex.value >= selectedThemePhotos.value.length - 1
    if (!wasLast) currentPhotoIndex.value += 1
    showAnswer.value = false
    currentAnswer.value = ''
    borderFlash.value = 'idle'
    if (wasLast) {
      resolveByTimer()
    } else {
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

watch(battleInfo, (info) => {
  if (info) startBattleMusic()
}, { immediate: true })

watch(battleWinner, (winner) => {
  if (!winner) return
  stopBattleMusic()
  playWinnerSFX()
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
</style>
