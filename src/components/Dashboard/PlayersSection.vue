<template>
  <section class="section">
    <h3>玩家狀態</h3>
    <div class="player-list">
      <div v-for="player in players" :key="player.name" class="player-card" :class="{ eliminated: player.eliminated }">
        <div class="player-card-header">
          <div>
            <h4>{{ player.name }}</h4>
            <p class="player-meta">Lives: {{ player.themeStack.size() }}</p>
          </div>
          <div class="player-badge">
            <span>連勝</span>
            <strong>{{ player.winStreak }}</strong>
          </div>
        </div>

        <div class="theme-list">
          <div
            v-for="theme in player.themeStack.getAll().slice().reverse()"
            :key="theme.name"
            class="theme-pill"
            :class="{ consumed: theme.isConsumed }"
            @click="onThemeClick(player, theme)">
            {{ theme.name }}
          </div>
        </div>

        <p v-if="player.reward" class="player-reward"><strong>Reward:</strong> {{ player.reward }}</p>
        <div class="status-indicator" :class="{ active: !player.eliminated }">
          {{ player.eliminated ? '已淘汰' : '進行中' }}
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{
  players: Array<any>
  onThemeClick: (player: any, theme: any) => void
}>()

const { players, onThemeClick } = props
</script>

<style scoped>
.section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

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
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.theme-pill:hover {
  transform: translateY(-1px);
  background: #d97706;
}

.theme-pill.consumed {
  background: #cbd5e1;
  color: #475569;
}

.player-reward {
  margin: 0 0 0.75rem 0;
  color: #334155;
  font-size: 0.95rem;
}

.status-indicator {
  display: inline-block;
  padding: 0.35rem 0.7rem;
  background-color: #ecf0f1;
  color: #7f8c8d;
  border-radius: 5px;
  font-size: 0.85rem;
  font-weight: 700;
}

.status-indicator.active {
  background-color: #d5f4e6;
  color: #166534;
}

@media (min-width: 768px) {
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
