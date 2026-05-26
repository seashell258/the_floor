<template>
  <section class="section battle-section">
    <h3>開始battle</h3>

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
        <img :src="currentPhoto" :alt="currentPhoto" class="battle-image" />
        <div v-if="battleWinner" class="result-panel">
          <div class="winner-announcement">
            🏆 {{ battleWinner }} 勝利！
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
        <div class="answer-side right">
          <span class="answer-player">{{ voteResults?.player2 || 'Player 2' }}</span>
          <span class="answer-votes">{{ voteResults?.votes2 ?? 0 }} 票</span>
        </div>
      </div>
      <div class="answer-body">
        <p v-if="showAnswer">{{ currentAnswer || selectedThemeAnswers[currentPhotoIndex] || '暫無答案' }}</p>
        <p v-else></p>
      </div>
      <div class="answer-footer">
        <button class="skip-btn" @click="skipQuestion" :disabled="isNextDisabled">跳過</button>
        <button class="next-btn" @click="nextQuestion" :disabled="isNextDisabled">下一題</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { useGameStore } from '../../pinia/store'

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

const currentPhotoIndex = ref(0)
const showAnswer = ref(false)
const currentAnswer = ref('')

const currentPhoto = computed(() => selectedThemePhotos.value[currentPhotoIndex.value] ?? '')

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
  gameStore.clearChallenger()
  emit('battle-ended')
}
</script>

<style scoped>
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
  color: #7f8c8d;
  font-size: 0.85rem;
}

.timer {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #bdc3c7; /* 黯淡的灰色背景 */
  border-radius: 8px;
  font-weight: bold;
  color: #7f8c8d; /* 較淡的文字顏色 */
  text-align: center;
  transition: all 0.3s ease;
}

.timer.active {
  background: #f39c12; /* 橙色背景 */
  color: white;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.winner-announcement {
  margin-top: 1rem;
  padding: 1rem;
  background: #d4edda;
  color: #155724;
  border-radius: 8px;
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
}

.battle-image {
  width: 80%;
  max-height: 470px;
  object-fit: cover;
  border-radius: 12px;
  margin: 0 auto 1rem;
  display: block;
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
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  min-height: 48px;
  background: white;
  border-radius: 10px;
  color: #7f8c8d;
  text-align: center;
}

.answer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.skip-btn {
  padding: 0.8rem 1.2rem;
  background: #e67e22;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}

.skip-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.skip-btn:hover:not(:disabled) {
  background: #d35400;
}

.next-btn {
  padding: 0.8rem 1.2rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}

.next-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.next-btn:hover:not(:disabled) {
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

.result-panel {
  margin-top: 1rem;
  padding: 1.2rem;
  background: #f0fdf4;
  border: 2px solid #86efac;
  border-radius: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
}

.winner-announcement {
  font-size: 1.4rem;
  font-weight: bold;
  color: #166534;
}

.result-detail {
  font-size: 0.95rem;
  color: #475569;
}

.loser-name {
  font-weight: 600;
}

.end-battle-btn {
  padding: 0.7rem 1.8rem;
  background: #64748b;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.95rem;
  transition: background 0.2s;
}

.end-battle-btn:hover {
  background: #475569;
}
</style>
