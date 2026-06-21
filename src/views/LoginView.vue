<template>
  <div class="login-page">
    <div class="login-card">
      <h1>The Cat Floor</h1>
      <p class="subtitle">請輸入您的名字</p>
      
      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <input
            v-model="userName"
            type="text"
            placeholder="輸入名字"
            class="name-input"
            @keyup.enter="handleLogin"
            autofocus
          />
        </div>
        
        <button type="submit" class="login-btn" :disabled="!userName.trim()">
          進入遊戲
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../pinia/store'

const userName = ref('')
const router = useRouter()
const gameStore = useGameStore()

function handleLogin() {
  if (!userName.value.trim()) return
  
  gameStore.login(userName.value.trim())
  router.push('/vote')
}
</script>

<style scoped>
.login-page {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
}

.login-card {
  background: var(--bg-panel);
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid var(--glow);
  box-shadow: 0 0 40px var(--glow-30);
  width: 90%;
  max-width: 400px;
  text-align: center;
  animation: fade-slide-up 0.4s ease-out;
}

h1 {
  margin: 0 0 0.5rem 0;
  color: var(--glow);
  font-size: 2rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 0 24px var(--glow-30);
}

.subtitle {
  margin: 0 0 2rem 0;
  color: var(--text-muted);
  font-size: 1rem;
}

.input-group {
  margin-bottom: 2rem;
}

.name-input {
  width: 100%;
  padding: 1rem;
  user-select: text;
  background: var(--bg-surface);
  border: 1px solid rgba(25, 233, 255, 0.25);
  border-radius: 8px;
  font-size: 1rem;
  color: var(--text);
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
  box-sizing: border-box;
  transition: all 0.3s;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.name-input:focus {
  outline: none;
  border-color: var(--glow);
  box-shadow: 0 0 0 3px var(--glow-10);
}

.name-input::placeholder {
  color: var(--text-muted);
}

.login-btn {
  width: 100%;
  padding: 1rem;
  background: var(--glow);
  color: var(--bg-panel);
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 700;
  font-family: 'Chakra Petch', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.2s;
  touch-action: manipulation;
}

.login-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.login-btn:hover:not(:disabled) {
  background: var(--glow-bright);
}

.login-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

@media (min-width: 768px) {
  .login-card {
    padding: 3rem;
  }
  h1 {
    font-size: 2.5rem;
  }
  .login-btn {
    padding: 1.2rem;
    font-size: 1.1rem;
  }
}
</style>
