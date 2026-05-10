<template>
  <div class="vote-result">
    <div class="vote-item" v-for="item in voteItems" :key="item.name">
      <span class="name">{{ item.name }}</span>
      <div class="bar">
        <div class="fill" :style="{ width: item.percentage + '%' }"></div>
      </div>
      <span class="count">{{ item.count }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface VoteItem {
  name: string
  count: number
}

const props = defineProps<{
  votes: VoteItem[]
}>()

const voteItems = computed(() => {
  const total = props.votes.reduce((sum, v) => sum + v.count, 0)
  return props.votes.map(v => ({
    ...v,
    percentage: total > 0 ? (v.count / total) * 100 : 0
  }))
})
</script>

<style scoped>
.vote-result {
  padding: 1rem 0;
}

.vote-item {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.name {
  font-weight: bold;
  min-width: 100px;
}

.bar {
  flex: 1;
  height: 24px;
  background-color: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
}

.fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2980b9);
  transition: width 0.3s ease;
}

.count {
  min-width: 40px;
  text-align: right;
  font-weight: bold;
}
</style>
