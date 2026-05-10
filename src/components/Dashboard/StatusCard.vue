<template>
  <div class="status-card">
    <h4>{{ title }}</h4>
    <div class="card-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<style scoped>
.status-card {
  background: white;
  padding: 1rem;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.status-card h4 {
  margin-top: 0;
  color: #2c3e50;
}

.card-content {
  padding: 0.5rem 0;
}
</style>
