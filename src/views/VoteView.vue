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
        <div v-if="gameStore.currentBattle" class="vote-buttons">
          <button
            @click="vote(1)"
            class="vote-btn"
            :class="{ 'voted': hasVotedFor(1) }"
            :disabled="hasVoted"
          >
            {{ hasVotedFor(1) ? '✓ ' : '' }}Vote for {{ gameStore.currentBattle?.player1Name }}
          </button>
          <button
            @click="vote(2)"
            class="vote-btn"
            :class="{ 'voted': hasVotedFor(2) }"
            :disabled="hasVoted"
          >
            {{ hasVotedFor(2) ? '✓ ' : '' }}Vote for {{ gameStore.currentBattle?.player2Name }}
          </button>
        </div>

        <div v-if="!gameStore.currentBattle" class="voting-disabled">
          暫無對決
        </div>
        <div v-if="hasVoted" class="voted-message">
          ✓ 投票成功
        </div>

        <div class="section vote-stats">
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
                :class="{ consumed: theme.isConsumed }"
              >
                {{ theme.name }}
              </div>
            </div>

            <div class="status-badge" :class="{ active: !player.eliminated }">
              {{ player.eliminated ? '已淘汰' : '存活' }}
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore } from '../pinia/store'

const gameStore = useGameStore()
const activeTab = ref<'vote' | 'status'>('vote')

function vote(playerChoice: number) {
  const voterName = gameStore.currentVoter?.name
  if (!voterName || !gameStore.voteResults) return
  
  if (hasVoted.value) return
  
  gameStore.recordVote(playerChoice, voterName)
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


/* Tab Navigation */
.tab-navigation {
  display: flex;
  gap: 0;
  margin-bottom: 1.5rem;
  border-radius: 10px;
  overflow: hidden;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
}

.tab-button {
  flex: 1;
  padding: 1rem 0;
  text-align: center;
  border: none;
  background: transparent;
  font-weight: bold;
  color: #7f8c8d;
  cursor: pointer;
  transition: all 0.25s ease;
}

.tab-button.active {
  color: #3498db;
  background: white;
}

.tab-button:hover {
  background: #f0f4fb;
}

/* Vote Container - Mobile Single Column */
.vote-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #2c3e50;
  font-size: 1.1rem;
  border-bottom: 2px solid #3498db;
  padding-bottom: 0.75rem;
}

/* Vote Buttons - Mobile Optimized */
.vote-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.vote-btn {
  padding: 1.2rem 1rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
  font-size: 1rem;
  touch-action: manipulation;
}

.vote-btn:active:not(:disabled) {
  transform: scale(0.98);
  background-color: #2980b9;
}

.vote-btn.voted {
  background-color: #27ae60;
  border: 2px solid #2ecc71;
}

.vote-btn.voted:active {
  background-color: #229954;
}

.vote-btn:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
  opacity: 0.6;
}

.voting-disabled {
  padding: 1.5rem 1rem;
  background-color: #ecf0f1;
  border-radius: 6px;
  text-align: center;
  color: #7f8c8d;
  font-size: 1rem;
}

.voted-message {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #d5f4e6;
  color: #27ae60;
  border-radius: 6px;
  text-align: center;
  font-weight: bold;
}

/* Vote Results - Mobile Optimized */
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
  color: #2c3e50;
  font-size: 1rem;
}

.result-bar {
  height: 40px;
  background-color: #ecf0f1;
  border-radius: 6px;
  overflow: hidden;
  margin: 0.75rem 0;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2980b9);
  transition: width 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 0.9rem;
  min-width: 30px;
}

.vote-number {
  display: block;
  font-size: 0.95rem;
  color: #2c3e50;
  font-weight: bold;
}

.voters-list {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background-color: #f0f7ff;
  border-radius: 4px;
  font-size: 0.85rem;
  border-left: 3px solid #3498db;
}

.voters-label {
  color: #555;
  font-weight: bold;
  display: block;
  margin-bottom: 0.3rem;
}

.voters-names {
  color: #2c3e50;
  word-break: break-word;
}

/* Player Status - Mobile Optimized */
.player-list {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1rem;
}

.player-card {
  padding: 1rem;
  background-color: #ffffff;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.player-card:hover {
  transform: translateY(-2px);
}

.player-card.eliminated {
  opacity: 0.55;
  filter: grayscale(0.35);
  border-color: #e74c3c;
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
  color: #1f2937;
  font-size: 1.15rem;
}

.player-meta {
  margin: 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.player-badge {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 0.55rem 0.85rem;
  background: rgba(245, 166, 35, 0.15);
  border-radius: 999px;
}

.player-badge span {
  color: #b45309;
  font-size: 0.8rem;
}

.player-badge strong {
  color: #c2410c;
  font-size: 1rem;
}

.theme-list {
  display: grid;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.theme-pill {
  padding: 0.75rem 0.9rem;
  border-radius: 999px;
  background: #f59e0b;
  color: white;
  font-weight: 700;
  text-align: center;
}

.theme-pill.consumed {
  background: #cbd5e1;
  color: #475569;
}

.status-badge {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  background-color: #ecf0f1;
  color: #7f8c8d;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: bold;
}

.status-badge.active {
  background-color: #d5f4e6;
  color: #27ae60;
}

/* Responsive adjustments for small tablets */
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
</style>
