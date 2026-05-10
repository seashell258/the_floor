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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.login-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 100%;
  width: 90%;
  max-width: 400px;
  text-align: center;
}

h1 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 2rem;
  font-weight: bold;
}

.subtitle {
  margin: 0 0 2rem 0;
  color: #7f8c8d;
  font-size: 1rem;
}

.input-group {
  margin-bottom: 2rem;
}

.name-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  font-size: 1rem;
  box-sizing: border-box;
  transition: all 0.3s;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.name-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.name-input::placeholder {
  color: #bdc3c7;
}

.login-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  touch-action: manipulation;
}

.login-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Mobile optimization */
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
