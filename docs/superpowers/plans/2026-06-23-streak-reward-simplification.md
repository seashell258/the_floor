# Streak Reward Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the random "draw streak reward" panel (which picked between +3 seconds or shield) with a simple inline ⚡ +3秒 button on each player card.

**Architecture:** Remove `drawResults` state and `recordDrawResult` from the store. Remove the draw FAB + draw panel + related JS from `PlayersSection.vue`. Add an `applyStreakReward` inline button to the player card header. Delete the now-unused `winStreakReward.vue` file.

**Tech Stack:** Vue 3 + Pinia (TypeScript)

## Global Constraints

- Do NOT touch the `streakRewardCharges` accumulation logic in `processBattleResult` — every 2 wins → charge = 1 stays unchanged
- Do NOT touch shield system code unrelated to streak rewards
- Do NOT touch `applyTimeProp()` or `consumeStreakRewardCharge()` — these stay as-is
- The `streak-ready` CSS class on player cards stays (visual indicator that charge > 0)

---

### Task 1: Remove draw-result state and function from store.ts

**Files:**
- Modify: `src/pinia/store.ts`

**Interfaces:**
- Removes: `DrawResult` interface, `drawResults` state field, `drawResults` computed getter, `recordDrawResult()` function, their entries in the returned object

- [ ] **Step 1: Remove `DrawResult` interface**

In `src/pinia/store.ts`, delete lines 85–88:
```typescript
// DELETE THIS BLOCK:
interface DrawResult {
  winner: string
  reward: string | null
}
```

- [ ] **Step 2: Remove `drawResults` from `GameState` interface**

In the `GameState` interface, delete:
```typescript
drawResults: DrawResult | null
```

- [ ] **Step 3: Remove `drawResults` from initial state**

In the initial `state = ref<GameState>({...})` block, delete:
```typescript
drawResults: null,
```

- [ ] **Step 4: Remove `drawResults` computed getter**

Delete line 152:
```typescript
const drawResults = computed(() => state.value.drawResults)
```

- [ ] **Step 5: Remove `recordDrawResult` function**

Delete lines 226–231:
```typescript
function recordDrawResult(winner: string, reward: string) {
  state.value.drawResults = {
    winner,
    reward
  }
}
```

- [ ] **Step 6: Remove both from the returned object**

In the return block (around line 600–654), delete:
```typescript
drawResults,
```
and:
```typescript
recordDrawResult,
```

- [ ] **Step 7: Commit**

```bash
git add src/pinia/store.ts
git commit -m "refactor: remove drawResults state and recordDrawResult from store"
```

---

### Task 2: Replace draw FAB/panel with inline ⚡ +3秒 button in PlayersSection.vue

**Files:**
- Modify: `src/components/Dashboard/PlayersSection.vue`

**Interfaces:**
- Consumes: `player.streakRewardCharges`, `gameStore.applyTimeProp(name)`, `gameStore.consumeStreakRewardCharge(name)` (all unchanged from store)
- Removes: `Gift` icon import, `isDrawPanelOpen`, `drawSelectedPlayerName`, `rewardOptions`, `selectedPlayerHasCharge`, `openDrawPanel()`, `handleDrawReward()`, draw FAB HTML, draw panel HTML, draw CSS classes
- Adds: `applyStreakReward(player)` function, inline button in card header, `.streak-reward-btn` CSS

- [ ] **Step 1: Remove `Gift` from the lucide import**

Find line 279:
```typescript
import { Swords, Gift, Unlock, Clock, Shield, X } from 'lucide-vue-next'
```
Change to:
```typescript
import { Swords, Unlock, Clock, Shield, X } from 'lucide-vue-next'
```

- [ ] **Step 2: Remove draw-related refs and computed**

Delete these lines from the `<script setup>` block:
```typescript
const isDrawPanelOpen = ref(false)
```
```typescript
const drawSelectedPlayerName = ref('')
const rewardOptions: Array<'time' | 'shield'> = ['time', 'shield']
```
```typescript
const selectedPlayerHasCharge = computed(() =>
  gameStore.players.find(p => p.name === drawSelectedPlayerName.value)?.streakRewardCharges > 0
)
```

- [ ] **Step 3: Remove `openDrawPanel()` and `handleDrawReward()` functions**

Delete these functions entirely:
```typescript
function openDrawPanel() {
  if (!drawSelectedPlayerName.value && gameStore.players.length > 0) {
    drawSelectedPlayerName.value = gameStore.players[0].name
  }
  isPanelOpen.value = false
  isDrawPanelOpen.value = true
}
```
```typescript
function handleDrawReward() {
  if (!drawSelectedPlayerName.value) return
  const prop = rewardOptions[Math.floor(Math.random() * rewardOptions.length)]
  gameStore.applyProp(drawSelectedPlayerName.value, prop)
  gameStore.recordDrawResult(drawSelectedPlayerName.value, prop === 'time' ? '時間+3秒' : '盾牌')
  gameStore.consumeStreakRewardCharge(drawSelectedPlayerName.value)
}
```

Also remove `isDrawPanelOpen.value = false` from `openPanel()` (around line 479).

- [ ] **Step 4: Add `applyStreakReward` function**

After the `handlePropClick` function, add:
```typescript
function applyStreakReward(player: any): void {
  gameStore.applyTimeProp(player.name)
  gameStore.consumeStreakRewardCharge(player.name)
}
```

- [ ] **Step 5: Remove draw FAB and draw panel HTML blocks**

In the `<template>`, delete the entire draw FAB block (lines 100–103):
```html
<!-- 抽連勝獎勵 FAB -->
<div v-if="!isDrawPanelOpen" class="draw-fab" @click="openDrawPanel">
  <Gift :size="15" /><span>抽連勝獎勵</span>
</div>
```

And delete the entire draw panel block (lines 105–131):
```html
<!-- 抽連勝獎勵面板 -->
<div v-else class="draw-panel">
  <div class="host-panel-header">
    <span class="host-panel-title">抽連勝獎勵</span>
    <button class="close-btn" @click="isDrawPanelOpen = false"><X :size="15" /></button>
  </div>
  <div class="host-panel-body">
    <div class="panel-row">
      <label class="panel-label">選擇玩家</label>
      <select v-model="drawSelectedPlayerName" class="panel-select">
        <option v-for="p in gameStore.players" :key="p.name" :value="p.name">
          {{ p.streakRewardCharges > 0 ? '⚡ ' : '' }}{{ p.name }}
        </option>
      </select>
      <p v-if="drawSelectedPlayerName && !selectedPlayerHasCharge" class="no-charge-warning">
        此玩家目前無連勝獎勵可抽
      </p>
    </div>
    <button class="duel-btn" :disabled="!drawSelectedPlayerName" @click="handleDrawReward">
      開始抽獎
    </button>
    <div v-if="gameStore.drawResults" class="draw-result">
      <span class="draw-result-name">{{ gameStore.drawResults.winner }}</span>
      <span class="draw-result-reward">{{ gameStore.drawResults.reward }}</span>
    </div>
  </div>
</div>
```

- [ ] **Step 6: Add inline ⚡ +3秒 button to player card header**

In the player card header's `header-right` div (around line 21), after the existing `prop-btn` button and before the `player-badge` div, add:
```html
<button
  v-if="player.streakRewardCharges > 0"
  class="streak-reward-btn"
  @click.stop="applyStreakReward(player)"
  title="連勝獎勵：+3秒"
>
  ⚡ +3秒
</button>
```

The `header-right` block should look like:
```html
<div class="header-right" @click.stop>
  <button
    v-if="player.prop"
    class="prop-btn"
    @click="handlePropClick(player)"
    :title="player.prop === 'time' ? '使用：時間+3秒' : '使用：盾牌'"
  >
    <Clock v-if="player.prop === 'time'" :size="13" />
    <Shield v-else :size="13" />
  </button>
  <button
    v-if="player.streakRewardCharges > 0"
    class="streak-reward-btn"
    @click.stop="applyStreakReward(player)"
    title="連勝獎勵：+3秒"
  >
    ⚡ +3秒
  </button>
  <div class="player-badge">
    <span>連勝</span>
    <strong>{{ player.winStreak }}</strong>
  </div>
</div>
```

- [ ] **Step 7: Remove draw CSS, add streak-reward-btn CSS**

Delete these CSS blocks (lines 939–1004):
```css
.draw-fab { ... }
.draw-fab:hover { ... }
.draw-panel { ... }
.draw-result { ... }
.draw-result-name { ... }
.draw-result-reward { ... }
.no-charge-warning { ... }
```

Add this CSS block near the other button styles:
```css
.streak-reward-btn {
  padding: 0.2rem 0.5rem;
  background: transparent;
  border: 1px solid var(--warn);
  border-radius: 4px;
  color: var(--warn);
  font-size: 0.75rem;
  font-family: 'Chakra Petch', sans-serif;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.streak-reward-btn:hover {
  background: var(--warn);
  color: var(--bg-panel);
}
```

- [ ] **Step 8: Commit**

```bash
git add src/components/Dashboard/PlayersSection.vue
git commit -m "refactor: replace draw streak reward panel with inline +3s button on player card"
```

---

### Task 3: Delete winStreakReward.vue

**Files:**
- Delete: `src/components/Dashboard/winStreakReward.vue`

Note: This file is not imported anywhere (confirmed by grep — DashboardView.vue does not import it), so deletion is safe.

- [ ] **Step 1: Delete the file**

```bash
git rm src/components/Dashboard/winStreakReward.vue
git commit -m "chore: delete unused winStreakReward.vue"
```

---

### Task 4: Verify

- [ ] **Step 1: Run TypeScript build check**

```bash
npm run build
```

Expected: Build completes with no TypeScript errors. Any error referencing `drawResults`, `recordDrawResult`, `Gift`, `isDrawPanelOpen`, `drawSelectedPlayerName`, `rewardOptions`, or `selectedPlayerHasCharge` means a reference was missed — search for it and remove.

- [ ] **Step 2: Manual smoke test**

Start the dev server:
```bash
npm run dev
```

Check:
1. Player cards load without errors
2. A player with `streakRewardCharges > 0` shows the ⚡ +3秒 button in their card header
3. Clicking ⚡ +3秒 applies a +3s time bonus to that player (check by starting a battle — that player's timer should start at 33s instead of 30s)
4. After clicking, the ⚡ +3秒 button disappears (charge consumed)
5. No "抽連勝獎勵" FAB appears anywhere
6. "挑戰主持人" FAB still works normally
