<template>
  <section class="section">

    <!-- Challenger hero — visible in state B (post-reveal) -->
    <div v-if="gameStore.currentChallenger" class="challenger-hero">
      <span class="challenger-label">本輪挑戰者</span>
      <span class="challenger-name" :key="gameStore.currentChallenger.challenger.name">
        {{ gameStore.currentChallenger.challenger.name }}
      </span>
    </div>
    <div v-if="gameStore.currentChallenger" class="hero-divider" />

    <!-- Candidate pool -->
    <div class="pool-area">
      <div v-if="gameStore.wheelPlayers.length === 0" class="no-players">
        輪次已結束
      </div>
      <div v-else class="candidate-grid">
        <div
          v-for="(player, i) in gameStore.wheelPlayers"
          :key="player.name"
          class="candidate-card"
          :class="{ dimmed: !!gameStore.currentChallenger }"
          :style="{ animationDelay: `${(i * 0.41) % 3.5}s` }"
        >
          {{ player.name }}
          <div class="candidate-predict">{{ player.correct }}次預測</div>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="controls">
      <!-- Primary action: 開始抽籤 (state A) / secondary (state B) -->
      <button
        v-if="gameStore.wheelPlayers.length > 0"
        class="draw-btn"
        :class="{ 'draw-btn--secondary': !!gameStore.currentChallenger }"
        @click="handleDrawFromWheel"
        :disabled="isCycling"
      >開始抽籤</button>

      <!-- Primary action: 開始下一輪 (state C only) -->
      <button
        v-if="gameStore.wheelPlayers.length === 0"
        class="draw-btn"
        @click="handleResetWheel"
      >開始下一輪</button>

      <!-- Secondary controls: always present but small -->
      <div class="sec-controls">
        <button
          v-if="gameStore.wheelPlayers.length > 0"
          class="sec-btn"
          @click="handleResetWheel"
        >下一輪</button>
        <button class="sec-btn" @click="handleShowRemoveDialog">移除陣亡者</button>
      </div>
    </div>

    <!-- Dramatic draw reveal overlay -->
    <Teleport to="body">
      <div
        v-if="overlayVisible"
        class="draw-overlay"
        :class="{ 'is-revealed': isRevealed }"
        @click="handleOverlayClick"
      >
        <div class="scanlines" />
        <div v-if="isRevealed" class="bg-glow" />

        <div class="draw-stage">
          <!-- Corner brackets -->
          <div class="bracket tl" />
          <div class="bracket tr" />
          <div class="bracket bl" />
          <div class="bracket br" />

          <div class="draw-label">本輪挑戰者</div>

          <div class="draw-name" :class="{ cycling: isCycling, revealed: isRevealed }">
            {{ displayName }}
          </div>

          <div v-if="isRevealed" class="draw-hint">TAP TO CONTINUE</div>
        </div>
      </div>
    </Teleport>

    <!-- Remove dialog (unchanged) -->
    <div v-if="showRemoveDialog" class="modal-overlay" @click="handleHideRemoveDialog">
      <div class="modal-content" @click.stop>
        <h4>移除陣亡者</h4>

        <div class="player-list-modal">
          <div v-for="player in gameStore.players" :key="player.name" class="player-item">
            <span>{{ player.name }}</span>
            <button class="remove-btn" @click="handleRemovePlayer(player.name)">移除</button>
          </div>
        </div>
        <div class="modal-actions">
          <button class="cancel-btn" @click="handleHideRemoveDialog">取消</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../../pinia/store'

const props = defineProps<{
  onRemovePlayer: (playerName: string) => void
}>()

const gameStore = useGameStore()
const showRemoveDialog = ref(false)
const isCycling = ref(false)
const isRevealed = ref(false)
const displayName = ref('')
let dismissTimer: number | null = null
let cycleTimer: ReturnType<typeof setTimeout> | null = null

const overlayVisible = computed(() => isCycling.value || isRevealed.value)

onMounted(() => {
  if (!gameStore.wheelInitialized) gameStore.initWheel()
})

onUnmounted(() => {
  if (dismissTimer) clearTimeout(dismissTimer)
  if (cycleTimer) clearTimeout(cycleTimer)
})

function handleDrawFromWheel() {
  if (gameStore.wheelPlayers.length === 0 || isCycling.value) return

  const poolNames = gameStore.wheelPlayers.map(p => p.name)
  const selected = gameStore.drawFromWheel()
  if (!selected) return
  gameStore.setChallenger(selected)

  const finalName = selected.name
  isCycling.value = true
  isRevealed.value = false
  displayName.value = poolNames[0] ?? finalName

  startCycle(poolNames, finalName)
}

function startCycle(pool: string[], finalName: string) {
  // Shorter total if only 1 player (nothing to cycle through)
  const totalMs = pool.length <= 1 ? 350 : 950
  const startMs = 50
  const endMs = 190
  let elapsed = 0

  function tick() {
    displayName.value = pool[Math.floor(Math.random() * pool.length)]
    const t = Math.min(elapsed / totalMs, 1)
    // Ease-in deceleration: starts fast, slows toward end
    const interval = startMs + (endMs - startMs) * (t * t)
    elapsed += interval

    if (elapsed < totalMs) {
      cycleTimer = setTimeout(tick, interval)
    } else {
      displayName.value = finalName
      isCycling.value = false
      isRevealed.value = true
      dismissTimer = window.setTimeout(dismissReveal, 4500)
    }
  }

  cycleTimer = setTimeout(tick, startMs)
}

function handleOverlayClick() {
  if (isCycling.value) return
  dismissReveal()
}

function dismissReveal() {
  if (dismissTimer) { clearTimeout(dismissTimer); dismissTimer = null }
  isRevealed.value = false
  isCycling.value = false
}

function handleResetWheel() {
  gameStore.resetWheel()
}

function handleShowRemoveDialog() {
  showRemoveDialog.value = true
}

function handleHideRemoveDialog() {
  showRemoveDialog.value = false
}

function handleRemovePlayer(playerName: string) {
  props.onRemovePlayer(playerName)
  showRemoveDialog.value = false
}
</script>

<style scoped>
.section {
  background: var(--bg-panel);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--glow);
  box-shadow: 0 0 20px var(--glow-10);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ─── Challenger Hero ─── */

.challenger-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 0 0.5rem;
  gap: 0.4rem;
  user-select: none;
}

.challenger-label {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.7rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--glow);
  opacity: 0.5;
}

.challenger-name {
  font-family: 'Chakra Petch', sans-serif;
  font-size: clamp(2.4rem, 8vw, 4rem);
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 0 20px var(--glow), 0 0 50px rgba(25, 233, 255, 0.3);
  animation: challenger-land 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
  line-height: 1.1;
  text-align: center;
}

@keyframes challenger-land {
  from { opacity: 0; transform: scale(0.88); filter: blur(8px); }
  to   { opacity: 1; transform: scale(1);    filter: blur(0); }
}

.hero-divider {
  height: 1px;
  background: rgba(25, 233, 255, 0.15);
  width: 100%;
}

/* ─── Candidate Pool ─── */

.pool-area {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-players {
  text-align: center;
  color: var(--text-muted);
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
}

.candidate-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
  width: 100%;
}

.candidate-card {
  padding: 0.85rem 1.25rem;
  border-radius: 8px;
  border: 1px solid rgba(25, 233, 255, 0.25);
  background: var(--bg-surface);
  font-family: 'Chakra Petch', sans-serif;
  font-weight: 600;
  color: var(--text);
  text-align: center;
  animation: card-breathe 3.5s ease-in-out infinite;
  transition: opacity 0.5s ease, transform 0.5s ease;
  user-select: none;
}

.candidate-card.dimmed {
  opacity: 0.4;
  transform: scale(0.95);
}

@keyframes card-breathe {
  0%, 100% { box-shadow: none; border-color: rgba(25, 233, 255, 0.2); }
  50%       { box-shadow: 0 0 12px rgba(25, 233, 255, 0.18); border-color: rgba(25, 233, 255, 0.5); }
}

.candidate-predict {
  font-size: 0.68rem;
  color: var(--text-muted);
  font-family: 'Chakra Petch', sans-serif;
  margin-top: 0.2rem;
  letter-spacing: 0.04em;
  font-weight: 400;
}

/* ─── Controls ─── */

.controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.draw-btn {
  flex: 1;
  padding: 0.9rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Chakra Petch', sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.95rem;
  background: var(--glow);
  color: var(--bg-panel);
  border: none;
  transition: background 0.2s;
}

.draw-btn:hover:not(:disabled) {
  background: var(--glow-bright);
}

.draw-btn:disabled {
  background: var(--bg-surface);
  color: var(--text-muted);
  cursor: not-allowed;
}

.draw-btn--secondary {
  flex: none;
  padding: 0.55rem 1rem;
  font-size: 0.78rem;
  font-weight: 600;
  background: transparent;
  color: var(--glow);
  border: 1px solid var(--glow-30);
}

.draw-btn--secondary:hover:not(:disabled) {
  background: var(--glow-10);
}

.sec-controls {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

.sec-btn {
  padding: 0.45rem 0.75rem;
  border-radius: 5px;
  cursor: pointer;
  font-family: 'Chakra Petch', sans-serif;
  font-weight: 500;
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  background: transparent;
  color: var(--text-muted);
  border: 1px solid rgba(25, 233, 255, 0.15);
  transition: color 0.15s, border-color 0.15s;
}

.sec-btn:hover {
  color: var(--text);
  border-color: var(--glow-30);
}

/* ─── Draw Overlay ─── */

.draw-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 6, 20, 0.97);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
}

.draw-overlay.is-revealed {
  cursor: pointer;
}

.scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 3px,
    rgba(0, 0, 0, 0.18) 3px,
    rgba(0, 0, 0, 0.18) 4px
  );
  pointer-events: none;
  opacity: 0.5;
}

.bg-glow {
  position: absolute;
  width: min(80vw, 560px);
  height: min(80vw, 560px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(25, 233, 255, 0.10) 0%,
    rgba(25, 233, 255, 0.04) 40%,
    transparent 70%
  );
  animation: bg-breathe 2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes bg-breathe {
  0%, 100% { transform: scale(0.92); opacity: 0.8; }
  50%       { transform: scale(1.06); opacity: 1; }
}

.draw-stage {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  padding: 3rem 2.5rem;
  z-index: 1;
}

/* Targeting brackets */
.bracket {
  position: absolute;
  width: 28px;
  height: 28px;
  opacity: 0.45;
}

.bracket.tl { top: 0;    left: 0;  border-top:  2px solid var(--glow); border-left:  2px solid var(--glow); }
.bracket.tr { top: 0;    right: 0; border-top:  2px solid var(--glow); border-right: 2px solid var(--glow); }
.bracket.bl { bottom: 0; left: 0;  border-bottom: 2px solid var(--glow); border-left:  2px solid var(--glow); }
.bracket.br { bottom: 0; right: 0; border-bottom: 2px solid var(--glow); border-right: 2px solid var(--glow); }

.draw-label {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.75rem;
  letter-spacing: 0.38em;
  text-transform: uppercase;
  color: var(--glow);
  opacity: 0.55;
}

.draw-name {
  font-family: 'Chakra Petch', sans-serif;
  font-size: clamp(3.2rem, 13vw, 6.5rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: 0.02em;
  text-align: center;
  max-width: 90vw;
  word-break: break-all;
}

/* Cycling state: dim, blurry, flickering */
.draw-name.cycling {
  color: rgba(226, 244, 248, 0.35);
  filter: blur(2px);
  animation: cycle-flicker 0.08s steps(1) infinite;
}

@keyframes cycle-flicker {
  0%   { opacity: 0.30; }
  33%  { opacity: 0.40; }
  66%  { opacity: 0.25; }
  100% { opacity: 0.35; }
}

/* Revealed state: slam in + full glow */
.draw-name.revealed {
  color: #ffffff;
  animation: slam-in 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
  text-shadow:
    0 0 18px var(--glow),
    0 0 45px rgba(25, 233, 255, 0.35),
    0 0 90px rgba(25, 233, 255, 0.12);
}

@keyframes slam-in {
  0% {
    opacity: 0;
    transform: scale(0.15);
    filter: blur(28px);
    text-shadow: none;
  }
  65% {
    transform: scale(1.07);
  }
  100% {
    opacity: 1;
    transform: scale(1);
    filter: blur(0);
  }
}

.draw-hint {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.68rem;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--glow);
  opacity: 0;
  animation: hint-appear 0.4s ease 1.1s forwards;
}

@keyframes hint-appear {
  to { opacity: 0.35; }
}

/* ─── Remove dialog (unchanged) ─── */

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-panel);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--glow-30);
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.modal-content h4 {
  margin: 0 0 1rem 0;
  color: var(--text);
  font-family: 'Chakra Petch', sans-serif;
}

.player-list-modal {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.player-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid rgba(25, 233, 255, 0.1);
  color: var(--text);
}

.player-item:last-child {
  border-bottom: none;
}

.remove-btn {
  padding: 0.25rem 0.5rem;
  background: var(--danger);
  color: var(--text);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.remove-btn:hover {
  opacity: 0.85;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  background: var(--bg-surface);
  color: var(--text-muted);
  border: 1px solid rgba(25, 233, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Chakra Petch', sans-serif;
  transition: color 0.15s;
}

.cancel-btn:hover {
  color: var(--text);
}
</style>
