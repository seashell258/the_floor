# Win Streak Reward Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Track per-player win streak reward charges in the store and expose them in the UI — player cards glow when a draw is ready, the draw panel shows charge status and warns when drawing for an ineligible player.

**Architecture:** Two new fields on `Player` (`winsTowardNextReward`, `streakRewardCharges`) computed inside `processBattleResult`. A new store action `consumeStreakRewardCharge` is called after a draw. `PlayersSection.vue` reads both fields for the card highlight and draw panel soft guard.

**Tech Stack:** Vue 3, Pinia, TypeScript

---

### Task 1: Extend Player type and createPlayer defaults

**Files:**
- Modify: `src/pinia/store.ts`

- [ ] **Step 1: Add two fields to the `Player` interface (lines 65–72)**

Replace:
```typescript
export interface Player {
  name: string
  themeStack: ThemeStack
  correct: number
  eliminated: boolean
  winStreak: number
  prop: 'time' | 'shield' | null
}
```
With:
```typescript
export interface Player {
  name: string
  themeStack: ThemeStack
  correct: number
  eliminated: boolean
  winStreak: number
  prop: 'time' | 'shield' | null
  winsTowardNextReward: number
  streakRewardCharges: number
}
```

- [ ] **Step 2: Add defaults to `createPlayer` (lines 335–344)**

Replace:
```typescript
  function createPlayer(name: string, themes: ThemeData[]): Player {
    return {
      name,
      themeStack: new ThemeStack(themes),
      correct: 0,
      eliminated: false,
      winStreak: 0,
      prop: null
    }
  }
```
With:
```typescript
  function createPlayer(name: string, themes: ThemeData[]): Player {
    return {
      name,
      themeStack: new ThemeStack(themes),
      correct: 0,
      eliminated: false,
      winStreak: 0,
      prop: null,
      winsTowardNextReward: 0,
      streakRewardCharges: 0
    }
  }
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx vue-tsc --noEmit`
Expected: no errors related to `Player`

- [ ] **Step 4: Commit**

```bash
git add src/pinia/store.ts
git commit -m "feat: add winsTowardNextReward and streakRewardCharges to Player"
```

---

### Task 2: Implement streak reward logic in processBattleResult + new action

**Files:**
- Modify: `src/pinia/store.ts`

- [ ] **Step 1: Add winner streak reward logic inside `processBattleResult`**

Find this block near the end of `processBattleResult` (around line 451):
```typescript
    winner.winStreak += 1
    loser.winStreak = 0
    state.value.battleWinner = winnerName
```

Replace with:
```typescript
    winner.winStreak += 1
    if (winner.streakRewardCharges === 1) winner.streakRewardCharges = 0
    if (winner.prop === null) {
      winner.winsTowardNextReward += 1
      if (winner.winsTowardNextReward >= 2) {
        winner.streakRewardCharges = 1
        winner.winsTowardNextReward = 0
      }
    }

    loser.winStreak = 0
    loser.winsTowardNextReward = 0
    loser.streakRewardCharges = 0
    state.value.battleWinner = winnerName
```

- [ ] **Step 2: Add `consumeStreakRewardCharge` action**

Find the `consumeProp` function (around line 320):
```typescript
  function consumeProp(playerName: string): void {
    const player = state.value.players.find(p => p.name === playerName)
    if (player) player.prop = null
  }
```

Add the new action directly after it:
```typescript
  function consumeStreakRewardCharge(playerName: string): void {
    const player = state.value.players.find(p => p.name === playerName)
    if (player) player.streakRewardCharges = 0
  }
```

- [ ] **Step 3: Export the new action in the return object**

Find the return statement at the bottom of `useGameStore`. Add `consumeStreakRewardCharge` to it:
```typescript
    consumeProp,
    applyTimeProp,
    consumeStreakRewardCharge,   // ← add this line
    applyVoteState
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx vue-tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Manual smoke test**

Start dev server (`npm run dev`). Open the app. Start a battle, process a result twice for the same player without giving them a prop. Open browser DevTools → Vue devtools → Pinia store → check that the winning player's `streakRewardCharges` becomes `1` after their 2nd consecutive win.

- [ ] **Step 6: Commit**

```bash
git add src/pinia/store.ts
git commit -m "feat: compute streakRewardCharges in processBattleResult"
```

---

### Task 3: Draw panel — soft guard and consumeStreakRewardCharge call

**Files:**
- Modify: `src/components/Dashboard/PlayersSection.vue`

- [ ] **Step 1: Add a computed for the selected player's charge status**

In the `<script setup>` section, after the existing `drawSelectedPlayerName` ref (around line 154), add:
```typescript
const selectedPlayerHasCharge = computed(() =>
  gameStore.players.find(p => p.name === drawSelectedPlayerName.value)?.streakRewardCharges === 1
)
```

- [ ] **Step 2: Update the select options to show ⚡ indicator**

Find (around line 61):
```html
          <select v-model="drawSelectedPlayerName" class="panel-select">
            <option v-for="p in gameStore.players" :key="p.name" :value="p.name">
              {{ p.name }}
            </option>
          </select>
```

Replace with:
```html
          <select v-model="drawSelectedPlayerName" class="panel-select">
            <option v-for="p in gameStore.players" :key="p.name" :value="p.name">
              {{ p.streakRewardCharges === 1 ? '⚡ ' : '' }}{{ p.name }}
            </option>
          </select>
          <p v-if="drawSelectedPlayerName && !selectedPlayerHasCharge" class="no-charge-warning">
            此玩家目前無連勝獎勵可抽
          </p>
```

- [ ] **Step 3: Call consumeStreakRewardCharge in handleDrawReward**

Find (around line 214):
```typescript
function handleDrawReward() {
  if (!drawSelectedPlayerName.value) return
  const prop = rewardOptions[Math.floor(Math.random() * rewardOptions.length)]
  gameStore.applyProp(drawSelectedPlayerName.value, prop)
  gameStore.recordDrawResult(drawSelectedPlayerName.value, prop === 'time' ? '時間+3秒' : '盾牌')
}
```

Replace with:
```typescript
function handleDrawReward() {
  if (!drawSelectedPlayerName.value) return
  const prop = rewardOptions[Math.floor(Math.random() * rewardOptions.length)]
  gameStore.applyProp(drawSelectedPlayerName.value, prop)
  gameStore.recordDrawResult(drawSelectedPlayerName.value, prop === 'time' ? '時間+3秒' : '盾牌')
  gameStore.consumeStreakRewardCharge(drawSelectedPlayerName.value)
}
```

- [ ] **Step 4: Add warning style**

In `<style scoped>`, add after `.draw-result-reward`:
```css
.no-charge-warning {
  margin: 0;
  font-size: 0.8rem;
  color: var(--warn);
  font-family: 'Chakra Petch', sans-serif;
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx vue-tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Manual smoke test**

Open draw panel. Select a player with no charge — warning text should appear. Select a player with `streakRewardCharges === 1` (trigger via two wins in devtools or real gameplay) — no warning, ⚡ shows in the dropdown. Click draw — charge resets to 0 in Pinia devtools.

- [ ] **Step 7: Commit**

```bash
git add src/components/Dashboard/PlayersSection.vue
git commit -m "feat: soft guard and charge indicator in streak reward draw panel"
```

---

### Task 4: Player card streak-ready visual indicator

**Files:**
- Modify: `src/components/Dashboard/PlayersSection.vue`

- [ ] **Step 1: Add `streak-ready` class binding to the player card**

Find (around line 5):
```html
      <div v-for="player in players" :key="player.name" class="player-card" :class="{ eliminated: player.eliminated }">
```

Replace with:
```html
      <div v-for="player in players" :key="player.name" class="player-card" :class="{ eliminated: player.eliminated, 'streak-ready': player.streakRewardCharges === 1 }">
```

- [ ] **Step 2: Add CSS for streak-ready card**

In `<style scoped>`, add after the `.player-card.eliminated` rule (around line 269):
```css
.player-card.streak-ready {
  border-color: var(--warn);
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.25);
  animation: streak-pulse 1.5s ease-in-out infinite;
}

@keyframes streak-pulse {
  0%, 100% { box-shadow: 0 0 8px rgba(245, 158, 11, 0.15); }
  50% { box-shadow: 0 0 28px rgba(245, 158, 11, 0.5); }
}
```

- [ ] **Step 3: Manual smoke test**

Trigger `streakRewardCharges = 1` on a player (via Pinia devtools or gameplay). The player card should pulse with an amber glow. After drawing the reward, the pulse stops.

- [ ] **Step 4: Commit**

```bash
git add src/components/Dashboard/PlayersSection.vue
git commit -m "feat: player card pulses amber when streak reward charge is ready"
```
