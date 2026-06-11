<template>
  <div class="dashboard">
    <div v-if="gameStore.tournamentWinner" class="tournament-winner-banner">
      <Trophy :size="22" style="vertical-align: middle; margin-right: 0.4rem;" />{{ gameStore.tournamentWinner }} 是最後存活者！
    </div>

    <div v-show="activeTab !== 'battle'" class="dashboard-header">
      <button :class="{ active: activeTab === 'getchallenger' }" @click="activeTab = 'getchallenger'">抽挑戰者</button>
      <button :class="{ active: activeTab === 'playersList' }" @click="activeTab = 'playersList'">選擇挑戰對象</button>
    </div>

    <div class="dashboard-content">
      <BattleSection
        v-if="activeTab === 'battle'"
        :selectedThemeName="selectedThemeName"
        :selectedThemePhotos="selectedThemePhotos"
        :selectedThemeAnswers="selectedThemeAnswers"
        @battle-ended="activeTab = 'playersList'"
      />

      <PlayersSection
        v-if="activeTab === 'playersList'"
        :players="gameStore.players"
        :onThemeClick="handleThemeClick"
        :onStartHostBattle="handleStartHostBattle"
      />

<GetChallengerSection
        v-if="activeTab === 'getchallenger'"
        :onRemovePlayer="permanentlyRemovePlayer"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Trophy } from 'lucide-vue-next'
import { useGameStore } from '../pinia/store'
import BattleSection from '../components/Dashboard/BattleSection.vue'
import PlayersSection from '../components/Dashboard/PlayersSection.vue'
import GetChallengerSection from '../components/Dashboard/GetChallengerSection.vue'
import { toast } from 'vue-sonner'
import { socket } from '../socket'

const gameStore = useGameStore()
const activeTab = ref<'battle' | 'playersList' | 'getchallenger'>('getchallenger')

const selectedThemePhotos = ref<string[]>([])
const selectedThemeName = ref('')
const selectedThemeAnswers = ref<string[]>([])
const selectedBattlePlayerName = ref('')

function pushVoteState() {
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
}

let timerInterval: number | null = null

onMounted(() => {
  timerInterval = setInterval(() => {
    gameStore.updateTimers()
  }, 1000)
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})

function handleThemeClick(player: any, theme: any) {
  if (!gameStore.currentChallenger) {
    toast.error('尚未抽出挑戰者', {
      description: '請先到「抽挑戰者」抽出本輪挑戰者，再選擇對戰主題。',
      duration: 4000,
    })
    return
  }

  selectedThemeName.value = theme.name
  selectedBattlePlayerName.value = player.name
  selectedThemePhotos.value = theme.photos ?? []
  selectedThemeAnswers.value = theme.answers ?? []

  if (selectedThemePhotos.value.length > 0) {
    const challenger = gameStore.currentChallenger.challenger
    gameStore.startBattleWithChallenger(challenger.name, player.name, selectedThemePhotos.value)
    pushVoteState()
  }

  activeTab.value = 'battle'
}

function permanentlyRemovePlayer(playerName: string) {
  gameStore.permanentlyRemovePlayer(playerName)
  pushVoteState()
}

function handleStartHostBattle(challengerName: string) {
  const hostTheme = gameStore.state.hostCurrentTheme
  if (!hostTheme) return

  selectedThemeName.value = hostTheme.name
  selectedThemePhotos.value = hostTheme.photos
  selectedThemeAnswers.value = hostTheme.answers ?? []

  gameStore.startBattleWithChallenger(challengerName, '主持人', hostTheme.photos)
  pushVoteState()
  activeTab.value = 'battle'
}
</script>

<style scoped>
.dashboard {
  width: 100%;
}

.dashboard-header {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  border-bottom: 1px solid rgba(25, 233, 255, 0.15);
  padding-bottom: 0.5rem;
}

.dashboard-header button {
  padding: 0.9rem 1.2rem;
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-family: 'Chakra Petch', sans-serif;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.9rem;
  transition: color 0.2s, border-color 0.2s;
}

.dashboard-header button.active,
.dashboard-header button:hover {
  color: var(--glow);
  border-bottom-color: var(--glow);
  background: transparent;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.tournament-winner-banner {
  background: var(--glow);
  color: var(--bg-panel);
  text-align: center;
  padding: 1rem;
  font-size: 1.5rem;
  font-weight: bold;
  font-family: 'Chakra Petch', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-radius: 8px;
  margin-bottom: 1rem;
}
</style>
