<template>
  <section class="section battle-section">
    <h3>開始battle</h3>

    <div class="battle-row">
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
            <div v-if="battleWinner" class="result-panel">
              <div class="winner-announcement">
                 {{ battleWinner }} 勝利！
              </div>
              <div class="result-detail">
                <span class="loser-name">
                  {{ battleWinner === battleInfo.player1Name ? battleInfo.player2Name : battleInfo.player1Name }}
                  的第一順位主題已消耗
                </span>
              </div>
              <button class="end-battle-btn" @click="endBattle">結束對戰</button>
            </div>
          </div>

          <div v-else class="no-battle large">
            尚無對戰
          </div>
        </div>

        <div class="answer-panel">
          <div class="answer-header">
            <div class="answer-side">
              <span class="answer-player">{{ voteResults?.player1 || 'Player 1' }}</span>
              <span class="answer-votes">{{ voteResults?.votes1 ?? 0 }} 票</span>
            </div>
            <div class="answer-side">
              <span class="answer-player">{{ voteResults?.player2 || 'Player 2' }}</span>
              <span class="answer-votes">{{ voteResults?.votes2 ?? 0 }} 票</span>
            </div>
          </div>
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
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { useGameStore } from '../../pinia/store'
import { socket } from '../../socket'

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

function getVotePercent(playerNum: 1 | 2): number {
  const v1 = voteResults.value?.votes1 ?? 0
  const v2 = voteResults.value?.votes2 ?? 0
  const total = v1 + v2
  if (total === 0) return 0
  return playerNum === 1 ? (v1 / total) * 100 : (v2 / total) * 100
}

const currentPhotoIndex = ref(0)
const showAnswer = ref(false)

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

  currentAnswer.value = selectedThemeAnswers.value[currentPhotoIndex.value] ?? '暫無答案'
  showAnswer.value = true
  gameStore.pauseTimer()

  if (currentPhotoIndex.value < selectedThemePhotos.value.length - 1) {
    currentPhotoIndex.value += 1
  }

  setTimeout(() => {
    showAnswer.value = false
    currentAnswer.value = ''
    gameStore.startTimer(gameStore.currentTimerPlayer || '')
  }, 800)
}

const nextQuestion = () => {
  if (selectedThemePhotos.value.length === 0 || showAnswer.value) return

  // 記錄當前題目的答案並顯示
  currentAnswer.value = selectedThemeAnswers.value[currentPhotoIndex.value] ?? '暫無答案'
  showAnswer.value = true
  gameStore.pauseTimer()

  // 立刻切換到下一張照片
  if (currentPhotoIndex.value < selectedThemePhotos.value.length - 1) {
    currentPhotoIndex.value += 1
  }

  // 0.8秒後隱藏答案，換 timer 給另一位玩家
  setTimeout(() => {
    showAnswer.value = false
    currentAnswer.value = ''
    gameStore.switchTimer()
    gameStore.startTimer(gameStore.currentTimerPlayer || '')
  }, 800)
}

const isNextDisabled = computed(
  () => selectedThemePhotos.value.length === 0 || showAnswer.value
)

let autoEndTimeout: ReturnType<typeof setTimeout> | null = null

watch(battleWinner, (winner) => {
  if (!winner) return
  socket.emit('pushVoteState', {
    currentBattle: gameStore.currentBattle,
    voteResults: gameStore.voteResults,
    battleWinner: winner
  })
  autoEndTimeout = setTimeout(() => {
    endBattle()
  }, 4000)
})

onUnmounted(() => {
  if (autoEndTimeout) clearTimeout(autoEndTimeout)
})

function endBattle() {
  if (autoEndTimeout) {
    clearTimeout(autoEndTimeout)
    autoEndTimeout = null
  }
  gameStore.resetBattle()
  socket.emit('pushVoteState', {
    currentBattle: gameStore.currentBattle,
    voteResults: gameStore.voteResults,
    battleWinner: gameStore.battleWinner
  })
  gameStore.clearChallenger()
  emit('battle-ended')
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

.battle-section {
  min-height: 720px;
  display: flex;
  flex-direction: column;
}

.battle-row {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  flex: 1;
  align-items: stretch;
}

.battle-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.battle-stage {
  flex: 1;
  display: flex;
  align-items: stretch;
  margin-bottom: 1rem;
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
  width: 80%;
  max-height: 470px;
  object-fit: cover;
  border-radius: 12px;
  margin: 0 auto 1rem;
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

.answer-header {
  display: flex;
  justify-content: flex-start;
  gap: 2rem;
  margin-bottom: 1rem;
}

.answer-side {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.answer-player {
  font-weight: bold;
  color: var(--text);
  font-family: 'Chakra Petch', sans-serif;
}

.answer-votes {
  font-size: 0.95rem;
  color: var(--text-muted);
}

.answer-body {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  min-height: 65px;
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
  margin-top: 1rem;
  padding: 1.2rem;
  background: var(--bg-surface);
  border: 2px solid var(--glow);
  border-radius: 12px;
  box-shadow: 0 0 24px var(--glow-30);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
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
</style>
