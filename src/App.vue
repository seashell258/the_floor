<template>
  <div id="app" class="app-container">
    <Toaster position="top-center" theme="dark" />
    <nav class="navbar">
      <h1>The Cat Floor</h1>
      <div v-if="gameStore.currentVoter" class="nav-user">
        <span class="user-name">{{ gameStore.currentVoter?.name }}</span>
        <button @click="handleLogout" class="logout-btn">換個名字</button>
      </div>
    </nav>
    
    <main>
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useGameStore } from './pinia/store'
import { playersConfig, hostConfig } from './config/playersConfig'
import { onMounted, onUnmounted } from 'vue'
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'
import { socket } from './socket'

const router = useRouter()
const gameStore = useGameStore()

function onVoteState(data: Parameters<typeof gameStore.applyVoteState>[0]) {
  gameStore.applyVoteState(data)
}

onMounted(() => {
  if (gameStore.players.length === 0) {
    gameStore.initializePlayersFromConfig(playersConfig)
  }
  if (gameStore.hostThemes.length === 0) {
    gameStore.initializeHostThemes(hostConfig)
  }
  socket.on('voteState', onVoteState)
})

onUnmounted(() => {
  socket.off('voteState', onVoteState)
})

function handleLogout() {
  gameStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
}

.navbar {
  background-color: var(--bg-panel);
  color: var(--text);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--glow);
  box-shadow: 0 1px 16px var(--glow-30);
  gap: 2rem;
}

.navbar h1 {
  margin: 0;
  font-size: 1.5rem;
  white-space: nowrap;
  color: var(--glow);
  text-shadow: 0 0 16px var(--glow-30);
  font-family: 'Chakra Petch', sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: auto;
}

.user-name {
  font-weight: bold;
  white-space: nowrap;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text);
}

.logout-btn {
  padding: 0.5rem 1rem;
  background-color: transparent;
  color: var(--glow);
  border: 1px solid var(--glow);
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-family: 'Chakra Petch', sans-serif;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.logout-btn:hover {
  background-color: var(--glow-10);
}

main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .navbar {
    padding: 1rem;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .navbar h1 {
    font-size: 1.2rem;
    width: 100%;
  }
  .nav-user {
    width: 100%;
  }
  .logout-btn {
    padding: 0.5rem 0.8rem;
    font-size: 0.9rem;
  }
  main {
    padding: 1rem;
  }
}
</style>
