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
        <img :src="battleInfo.image" :alt="battleInfo.image" class="battle-image" />
        <div class="battle-bottom">
          <span>Time Remaining: {{ battleInfo.timeRemaining }}s</span>
          <div v-if="battleWinner" class="winner-announcement">
            🎉 Winner: {{ battleWinner }} 🎉
          </div>
        </div>
      </div>

      <div v-else class="no-battle large">
        No active battle
        <button @click="onStartDemo">Start Demo Battle</button>
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
        <p v-else>這裡由主持人顯示答對 / 跳過後的答案內容。</p>
      </div>
      <div class="answer-footer">
        <button class="next-btn" @click="nextQuestion" :disabled="isNextDisabled">下一題</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useGameStore } from '../../pinia/store'

const gameStore = useGameStore()

const props = defineProps<{
  selectedThemeName: string
  selectedThemePhotos: string[]
  selectedThemeAnswers: string[]
  onStartDemo: () => void
}>()

const selectedThemeName = computed(() => props.selectedThemeName)
const selectedThemePhotos = computed(() => props.selectedThemePhotos)
const selectedThemeAnswers = computed(() => props.selectedThemeAnswers)
const onStartDemo = computed(() => props.onStartDemo)

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

watch(
  selectedThemePhotos,
  () => {
    currentPhotoIndex.value = 0
    showAnswer.value = false
    currentAnswer.value = ''
  },
  { immediate: true }
)

const nextQuestion = () => {
  if (selectedThemePhotos.value.length === 0 || showAnswer.value) return

  // 顯示答案
  currentAnswer.value = selectedThemeAnswers.value[currentPhotoIndex.value] ?? '暫無答案'
  showAnswer.value = true

  // 暫停 timer
  gameStore.pauseTimer()

  // 0.8秒後切換照片並換 timer
  setTimeout(() => {
    showAnswer.value = false

    if (currentPhotoIndex.value < selectedThemePhotos.value.length - 1) {
      currentPhotoIndex.value += 1
      const nextImage = selectedThemePhotos.value[currentPhotoIndex.value]
      const currentBattle = gameStore.currentBattle
      if (nextImage && currentBattle) {
        gameStore.startBattle(currentBattle.player1Name, currentBattle.player2Name, nextImage)
        gameStore.switchTimer()
        gameStore.startTimer(gameStore.currentTimerPlayer || '')
      }
    } else {
      // 最後一張仍然恢復 timer
      gameStore.startTimer(gameStore.currentTimerPlayer || '')
    }
  }, 800)
}

const isNextDisabled = computed(
  () => selectedThemePhotos.value.length === 0 || showAnswer.value
)
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
  width: 100%;
  height: calc(100% - 90px);
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 1rem;
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
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: white;
  border-radius: 10px;
  color: #7f8c8d;
  text-align: center;
}

.answer-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
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
</style>
