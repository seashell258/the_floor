<template>
  <div id="app" class="app-container">
    <nav v-if="gameStore.currentVoter" class="navbar">
      <h1>The Cat Floor</h1>
      <div class="nav-user">
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
import { playersConfig } from './config/playersConfig'
import { onMounted } from 'vue'

const router = useRouter()
const gameStore = useGameStore()

// 应用启动时初始化玩家
onMounted(() => {
  if (gameStore.players.length === 0) {
    gameStore.initializePlayersFromConfig(playersConfig)
  }
})

function handleLogout() {
  gameStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.navbar {
  background-color: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  gap: 2rem;
}

.navbar h1 {
  margin: 0;
  font-size: 1.5rem;
  white-space: nowrap;
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
}

.logout-btn {
  padding: 0.5rem 1rem;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s;
  white-space: nowrap;
}

.logout-btn:hover {
  background-color: #c0392b;
}

main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* Mobile optimization */
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
