<template>
  <div class="vote-form">
    <button 
      @click="vote(1)"
      :disabled="isVoted"
      class="vote-button player1"
    >
      Vote {{ player1Name }}
    </button>
    <button 
      @click="vote(2)"
      :disabled="isVoted"
      class="vote-button player2"
    >
      Vote {{ player2Name }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  player1Name: string
  player2Name: string
}>()

const emit = defineEmits<{
  vote: [playerNum: number]
}>()

const isVoted = ref(false)

function vote(playerNum: number) {
  if (!isVoted.value) {
    isVoted.value = true
    emit('vote', playerNum)
  }
}
</script>

<style scoped>
.vote-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.vote-button {
  padding: 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  color: white;
  transition: opacity 0.3s;
}

.vote-button.player1 {
  background-color: #3498db;
}

.vote-button.player1:hover:not(:disabled) {
  opacity: 0.8;
}

.vote-button.player2 {
  background-color: #e74c3c;
}

.vote-button.player2:hover:not(:disabled) {
  opacity: 0.8;
}

.vote-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
