<!-- <template>
  <div class="player-status">
    <div class="players-grid">
      <div v-for="player in players" :key="player.name" class="player" :class="{ eliminated: player.eliminated }">
        <h5>{{ player.name }}</h5>
        <div class="stats">
          <div class="stat-item">
            <span class="stat-label">生命數：</span>
            <span class="stat-value">{{ player.lives }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">答對數：</span>
            <span class="stat-value">{{ player.correct }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">連勝：</span>
            <span class="stat-value">{{ player.winStreak }}</span>
          </div>
        </div>
        <div class="status-indicator" :class="{ active: !player.eliminated }">
          {{ player.eliminated ? '已淘汰' : '進行中' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Player {
  name: string
  lives: number
  correct: number
  winStreak: number
  eliminated: boolean
}

defineProps<{
  players: Player[]
}>()
</script>

<style scoped>
.player-status {
  width: 100%;
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.player {
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #3498db;
  transition: all 0.3s;
}

.player.eliminated {
  opacity: 0.5;
  border-left-color: #e74c3c;
}

.player h5 {
  margin: 0 0 0.75rem 0;
  color: #2c3e50;
  font-size: 1rem;
  font-weight: bold;
}

.stats {
  margin-bottom: 0.75rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.stat-label {
  color: #555;
  font-weight: 600;
}

.stat-value {
  color: #2c3e50;
  font-weight: bold;
}

.status-indicator {
  display: inline-block;
  padding: 0.3rem 0.6rem;
  background-color: #ecf0f1;
  color: #7f8c8d;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

.status-indicator.active {
  background-color: #d5f4e6;
  color: #27ae60;
}

/* Tablet and larger screens */
@media (min-width: 768px) {
  .players-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .player {
    padding: 1.2rem;
  }

  .player h5 {
    font-size: 1.1rem;
  }

  .stat-item {
    font-size: 0.95rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .players-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  .player {
    padding: 1.5rem;
  }
}
</style> -->
