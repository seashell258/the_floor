<template>
  <div class="player-status">
    <h4>Your Status</h4>
    <div class="status-item">
      <span class="label">Correct Answers:</span>
      <span class="value">{{ correct }}</span>
    </div>
    <div class="status-item">
      <span class="label">Can Revive:</span>
      <span class="value">{{ canRevive ? 'Yes' : 'No' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  correct: number
  canRevive: boolean
}>()
</script>

<style scoped>
.player-status {
  padding: 1rem;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.player-status h4 {
  margin-top: 0;
  color: #2c3e50;
}

.status-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #ecf0f1;
}

.status-item:last-child {
  border-bottom: none;
}

.label {
  font-weight: bold;
  color: #555;
}

.value {
  color: #2c3e50;
  font-weight: bold;
}
</style>
