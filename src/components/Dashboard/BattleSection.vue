<template>
  <section class="section battle-section">
    <h3>開始battle</h3>

    <div class="battle-stage">
      <div v-if="battleInfo" class="battle-card">
        <div class="battle-meta">
          <div>
            <span class="label">對戰者</span>
            <strong>{{ battleInfo.player1Name }}</strong>
          </div>
          <div>
            <span class="label">VS</span>
            <strong>{{ battleInfo.player2Name }}</strong>
          </div>
          <div v-if="selectedThemeName">
            <span class="label">主題</span>
            <strong>{{ selectedThemeName }}</strong>
          </div>
        </div>
        <img :src="battleInfo.image" :alt="battleInfo.image" class="battle-image" />
        <div class="battle-bottom">
          <span>Time Remaining: {{ battleInfo.timeRemaining }}s</span>
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
        <p>這裡由主持人顯示答對 / 跳過後的答案內容。</p>
      </div>
      <div class="answer-footer">
        <button class="next-btn" @click="onNextPhoto" :disabled="isNextDisabled">下一題</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  battleInfo: { player1Name: string; player2Name: string; image: string; timeRemaining: number } | null
  voteResults: Record<string, any> | null
  selectedThemeName: string
  selectedThemePhotos: string[]
  currentPhotoIndex: number
  onNextPhoto: () => void
  onStartDemo: () => void
}>()

const {
  battleInfo,
  voteResults,
  selectedThemeName,
  selectedThemePhotos,
  currentPhotoIndex,
  onNextPhoto,
  onStartDemo
} = props

const isNextDisabled = computed(
  () => currentPhotoIndex >= selectedThemePhotos.length - 1 || selectedThemePhotos.length === 0
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

.battle-meta .label {
  display: block;
  color: #7f8c8d;
  font-size: 0.85rem;
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
