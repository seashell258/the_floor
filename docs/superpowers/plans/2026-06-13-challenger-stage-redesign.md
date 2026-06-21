# Challenger Stage Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `GetChallengerSection.vue` so the audience watching the host operate feels engaged — candidate pool feels like a stage, draw reveal flows into a persistent challenger hero state, admin controls are de-emphasised.

**Architecture:** Single-file change in `GetChallengerSection.vue`. Three named page states (pre-draw / post-reveal / pool-empty) are expressed through template conditionals and CSS classes. No new components, no store changes.

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), CSS animations, Pinia (read-only — no store changes)

---

## File Map

| File | Change |
|---|---|
| `src/components/Dashboard/GetChallengerSection.vue` | Rewrite `<template>` layout + all scoped CSS; JS logic untouched |

---

## Task 1: Rewrite the template

**Files:**
- Modify: `src/components/Dashboard/GetChallengerSection.vue` (template block, lines 1–76)

### Context

The current template has `.wheel-inner > .wheel-controls + .wheel-display + .drawn-result`. Replace this entire structure with:
- `challenger-hero` block (visible when `gameStore.currentChallenger` exists)
- `hero-divider` line (same condition)
- `pool-area` containing the candidate grid or empty-state message
- `controls` bar with state-driven button visibility

The overlay (`<Teleport>`) and remove-dialog stay **identical** — do not touch them.

- [ ] **Step 1: Replace the template block**

Replace everything from `<section class="section">` opening tag content down to (but not including) `<!-- Dramatic draw reveal overlay -->` with the following. Keep the overlay and remove-dialog blocks exactly as they are.

```html
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
```

- [ ] **Step 2: Verify the app compiles without errors**

```bash
cd /app && npm run build 2>&1 | tail -20
```

Expected: build succeeds (or only pre-existing warnings — no new errors).

---

## Task 2: Rewrite the scoped CSS

**Files:**
- Modify: `src/components/Dashboard/GetChallengerSection.vue` (style block)

### Context

Remove the old classes: `.wheel-inner`, `.wheel-controls`, `.wheel-btn`, `.wheel-display`, `.wheel-players`, `.wheel-player`, `.drawn-result`.

Keep everything from `/* ─── Draw Overlay ─── */` onwards (`.draw-overlay` and everything after it) — the overlay CSS is unchanged.

Add the new classes listed below.

- [ ] **Step 1: Replace CSS from `.section` down to the draw overlay comment**

Find the `<style scoped>` block. Replace from `.section {` down to (but not including) `/* ─── Draw Overlay ─── */` with:

```css
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

```

- [ ] **Step 2: Verify build is clean**

```bash
cd /app && npm run build 2>&1 | tail -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Dashboard/GetChallengerSection.vue
git commit -m "feat: redesign challenger stage — hero section, candidate grid, de-emphasised admin controls"
```

---

## Task 3: Smoke test in browser

**Files:** none

- [ ] **Step 1: Start dev server**

```bash
cd /app && npm run dev
```

Open `http://localhost:5173/dashboard`.

- [ ] **Step 2: Verify state A (pre-draw)**

- Navigate to 抽挑戰者 tab
- Candidate cards should be in a grid, larger than old pill chips
- Cards should have a slow independent glow pulse (staggered — not all flashing in sync)
- 「開始抽籤」 is the large primary button
- 「下一輪」 and 「移除陣亡者」 are small secondary buttons on the right

- [ ] **Step 3: Verify draw + state B (post-reveal)**

- Click 開始抽籤
- Overlay cycling animation plays, then reveal slams in
- Tap overlay to dismiss
- Page should show challenger hero at top (large name, small label, glow)
- Remaining candidate cards should be dimmed and slightly smaller
- 「開始抽籤」 shrinks to secondary style
- 「下一輪」 still visible as small secondary button

- [ ] **Step 4: Verify state C (pool empty)**

- Keep drawing until all players are drawn (or click 下一輪 without resetting first)
- When wheelPlayers is empty: candidate grid shows 「輪次已結束」
- 「開始下一輪」 becomes the large primary button
- 「開始抽籤」 is gone

- [ ] **Step 5: Verify reset**

- Click 開始下一輪
- Pool refills with all players
- Candidate cards animate back in (full opacity, full scale)
- Challenger hero persists (currentChallenger is not cleared by resetWheel — expected)
