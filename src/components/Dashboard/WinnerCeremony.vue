<template>
  <Teleport to="body">
    <div
      class="ceremony-overlay"
      :class="[{ 'streak-mode': isStreak }, { fading: fading }]"
      @click="isStreak ? handleDismiss() : undefined"
    >
      <div v-if="isStreak" class="fire-particles">
        <span
          v-for="i in 18"
          :key="i"
          class="fire-particle"
          :style="fireParticleStyle(i)"
        />
      </div>

      <div v-if="!isStreak" class="shockwave" />

      <div v-if="!isStreak" class="burst-wrap">
        <span
          v-for="i in 10"
          :key="i"
          class="burst-dot"
          :style="burstDotStyle(i)"
        />
      </div>

      <div class="ceremony-center" :class="{ shaking: shaking }">
        <div v-if="isStreak" class="streak-label">二連勝!!</div>
        <div v-else class="win-label">勝利</div>
        <div class="winner-name" :class="{ 'winner-name--streak': isStreak }">
          {{ winner }}
        </div>
        <div v-if="isStreak" class="dismiss-hint">點擊繼續</div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { playStreakSFX } from '../../composables/useAudio'

const props = defineProps<{
  winner: string
  isStreak: boolean
}>()

const emit = defineEmits<{ (e: 'dismissed'): void }>()

const fading = ref(false)
const shaking = ref(false)

function fireParticleStyle(i: number) {
  const left = 3 + ((i - 1) / 18) * 94
  const delay = (i * 0.17) % 1.5
  const duration = 1.2 + ((i * 0.13) % 1.0)
  const size = 4 + ((i * 7) % 8)
  const drift = -20 + ((i * 13) % 40)
  return {
    left: `${left}%`,
    width: `${size}px`,
    height: `${size}px`,
    '--delay': `${delay}s`,
    '--duration': `${duration}s`,
    '--drift': `${drift}px`,
  }
}

function burstDotStyle(i: number) {
  const angle = ((i - 1) / 10) * 360
  const rad = (angle * Math.PI) / 180
  const dist = 80 + ((i * 17) % 60)
  return {
    '--tx': `${Math.cos(rad) * dist}px`,
    '--ty': `${Math.sin(rad) * dist}px`,
  }
}

function handleDismiss() {
  emit('dismissed')
}

onMounted(() => {
  if (props.isStreak) {
    playStreakSFX()
    shaking.value = true
    setTimeout(() => { shaking.value = false }, 420)
  } else {
    setTimeout(() => {
      fading.value = true
      setTimeout(() => emit('dismissed'), 200)
    }, 2300)
  }
})
</script>

<style scoped>
.ceremony-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.82);
  animation: overlay-in 0.25s ease-out forwards;
  overflow: hidden;
}

.ceremony-overlay.fading {
  animation: overlay-out 0.2s ease-out forwards;
}

.ceremony-overlay.streak-mode {
  background: rgba(10, 2, 0, 0.92);
  cursor: pointer;
}

.ceremony-overlay.streak-mode::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #1a0000, #3d1400, #1a0000);
  background-size: 300% 300%;
  animation: fire-bg 3s ease infinite;
}

.shockwave {
  position: absolute;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid var(--glow);
  box-shadow: 0 0 20px var(--glow);
  animation: shockwave-expand 0.9s ease-out forwards;
  pointer-events: none;
}

.burst-wrap {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.burst-dot {
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--glow);
  box-shadow: 0 0 6px var(--glow);
  animation: burst-fly 0.7s ease-out forwards;
}

.fire-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.fire-particle {
  position: absolute;
  bottom: -10px;
  border-radius: 50%;
  background: radial-gradient(circle, #FFD700 0%, #FF6B00 60%, transparent 100%);
  animation: fire-float var(--duration, 1.5s) var(--delay, 0s) ease-in infinite;
  opacity: 0.85;
}

.ceremony-center {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
}

.ceremony-center.shaking {
  animation: screen-shake 0.42s ease-out;
}

.win-label {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 1.1rem;
  letter-spacing: 0.2em;
  color: var(--glow);
  text-transform: uppercase;
  opacity: 0;
  animation: fade-up 0.3s 0.1s ease-out forwards;
}

.streak-label {
  font-family: 'Chakra Petch', sans-serif;
  font-size: clamp(2.8rem, 8vw, 5rem);
  font-weight: 700;
  color: #FFB800;
  text-shadow:
    0 0 20px #FF6B00,
    0 4px 12px rgba(0, 0, 0, 0.8);
  letter-spacing: 0.04em;
  animation: streak-stamp 0.4s cubic-bezier(0.2, 1.4, 0.4, 1) forwards;
}

.winner-name {
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
  font-size: clamp(2.2rem, 6vw, 4rem);
  font-weight: 700;
  color: var(--glow);
  text-shadow:
    0 0 30px var(--glow),
    0 0 60px var(--glow-30);
  letter-spacing: 0.06em;
  opacity: 0;
  animation: blast-in 0.35s 0.15s cubic-bezier(0.2, 1.3, 0.4, 1) forwards;
}

.winner-name--streak {
  font-size: clamp(1.6rem, 4vw, 2.8rem);
  color: #fff;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.7);
  opacity: 0;
  animation: fade-up 0.3s 0.35s ease-out forwards;
}

.dismiss-hint {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.85rem;
  letter-spacing: 0.15em;
  color: #FFB800;
  text-transform: uppercase;
  margin-top: 1.5rem;
  opacity: 0;
  animation: fade-up 0.3s 0.8s ease-out forwards,
             pulse-hint 1.5s 1.1s ease-in-out infinite;
}

@keyframes overlay-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes overlay-out {
  from { opacity: 1; }
  to   { opacity: 0; }
}

@keyframes fire-bg {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes shockwave-expand {
  from { transform: scale(0); opacity: 1; }
  to   { transform: scale(10); opacity: 0; }
}

@keyframes burst-fly {
  from { transform: translate(0, 0); opacity: 1; }
  to   { transform: translate(var(--tx, 80px), var(--ty, 0px)); opacity: 0; }
}

@keyframes fire-float {
  0%   { transform: translateY(0) translateX(0); opacity: 0.9; }
  50%  { transform: translateY(-40vh) translateX(calc(var(--drift, 15px) * 0.5)); opacity: 0.6; }
  100% { transform: translateY(-90vh) translateX(var(--drift, 15px)); opacity: 0; }
}

@keyframes screen-shake {
  0%   { transform: translate(0, 0); }
  15%  { transform: translate(-4px, 2px); }
  30%  { transform: translate(4px, -2px); }
  45%  { transform: translate(-3px, 3px); }
  60%  { transform: translate(3px, -1px); }
  75%  { transform: translate(-2px, 1px); }
  90%  { transform: translate(1px, -1px); }
  100% { transform: translate(0, 0); }
}

@keyframes streak-stamp {
  from { transform: scale(2.2) rotate(-4deg); opacity: 0; }
  to   { transform: scale(1) rotate(0deg); opacity: 1; }
}

@keyframes blast-in {
  from { transform: scale(1.5); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-hint {
  0%, 100% { opacity: 0.6; }
  50%       { opacity: 1; }
}
</style>
