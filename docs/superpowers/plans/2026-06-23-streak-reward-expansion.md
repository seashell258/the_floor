# Streak Reward Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-slot streak reward model with a `pendingTimeBonuses: number[]` queue that awards +3s at every 2nd consecutive win, +7s at every 4th, and +5s whenever a player eliminates an opponent.

**Architecture:** Two files change. `store.ts` owns all game logic: Player interface, reward accumulation in `processBattleResult`, and the two store functions that move bonuses from pending to staged. `PlayersSection.vue` owns the UI: renders one button per pending bonus, disables all buttons once one is staged for the upcoming battle.

**Tech Stack:** Vue 3, Pinia, TypeScript (no test suite — verification is `npm run build` + manual smoke test)

## Global Constraints

- Shield system (`player.prop`, `applyProp`, `consumeProp`, shield dialog, shield animation) must not be touched
- `timePropBonus: Record<string, number>` accumulation and consumption at battle start (`startBattleWithChallenger`) must not be touched
- Socket snapshot sync (`applyVoteState`) must not be touched — `pendingTimeBonuses` is admin-only state
- `winStreak` display on player cards must not be touched
- No new npm dependencies

---

### Task 1: Update store.ts — Player model, reward logic, store functions

**Files:**
- Modify: `src/pinia/store.ts`

**Interfaces:**
- Produces:
  - `Player.pendingTimeBonuses: number[]` (replaces `winsTowardNextReward` and `streakRewardCharges`)
  - `applyTimeProp(playerName: string, seconds: number): void`
  - `consumePendingBonus(playerName: string, seconds: number): void`
  - `resetWinStreak` now also clears `pendingTimeBonuses`

- [ ] **Step 1: Update the `Player` interface**

Find and replace the `Player` interface (lines 65–74):

```typescript
export interface Player {
  name: string
  themeStack: ThemeStack
  correct: number
  eliminated: boolean
  winStreak: number
  prop: 'time' | 'shield' | null
  pendingTimeBonuses: number[]
}
```

(Remove `winsTowardNextReward: number` and `streakRewardCharges: number`.)

- [ ] **Step 2: Update `createPlayer`**

Find `createPlayer` (around line 337) and replace its return object:

```typescript
function createPlayer(name: string, themes: ThemeData[]): Player {
  return {
    name,
    themeStack: new ThemeStack(themes),
    correct: 0,
    eliminated: false,
    winStreak: 0,
    prop: null,
    pendingTimeBonuses: []
  }
}
```

- [ ] **Step 3: Update `resetWinStreak`**

Find `resetWinStreak` (around line 263) and replace it:

```typescript
function resetWinStreak(playerName: string) {
  const player = state.value.players.find(p => p.name === playerName)
  if (!player) return
  player.winStreak = 0
  player.pendingTimeBonuses = []
}
```

- [ ] **Step 4: Replace `consumeStreakRewardCharge` with `consumePendingBonus`**

Find `consumeStreakRewardCharge` (around line 322) and replace the whole function:

```typescript
function consumePendingBonus(playerName: string, seconds: number): void {
  const player = state.value.players.find(p => p.name === playerName)
  if (!player) return
  const idx = player.pendingTimeBonuses.indexOf(seconds)
  if (idx !== -1) player.pendingTimeBonuses.splice(idx, 1)
}
```

- [ ] **Step 5: Fix `applyTimeProp` — add `seconds` parameter, remove `consumeProp` call**

Find `applyTimeProp` (around line 327) and replace it:

```typescript
function applyTimeProp(playerName: string, seconds: number): void {
  state.value.timePropBonus[playerName] = (state.value.timePropBonus[playerName] ?? 0) + seconds
}
```

- [ ] **Step 6: Replace streak/reward block in `processBattleResult`**

Find the section inside `processBattleResult` starting at `if (loser.themeStack.activeCount() === 0)` through `state.value.battleWinner = winnerName` (around lines 453–468). Replace the entire block:

```typescript
if (loser.themeStack.activeCount() === 0) loser.eliminated = true

winner.winStreak += 1
if (winner.winStreak % 4 === 0) {
  winner.pendingTimeBonuses.push(7)
} else if (winner.winStreak % 2 === 0) {
  winner.pendingTimeBonuses.push(3)
}
if (loser.eliminated) {
  winner.pendingTimeBonuses.push(5)
}

loser.winStreak = 0
loser.pendingTimeBonuses = []
state.value.battleWinner = winnerName
```

- [ ] **Step 7: Update exports — swap `consumeStreakRewardCharge` for `consumePendingBonus`**

In the `return { ... }` block at the bottom of the store (around line 634), find:
```typescript
consumeStreakRewardCharge,
```
Replace with:
```typescript
consumePendingBonus,
```

- [ ] **Step 8: Run build to verify no TypeScript errors**

```bash
npm run build
```

Expected: `✓ built` with 0 errors. Any error mentioning `streakRewardCharges`, `winsTowardNextReward`, or `consumeStreakRewardCharge` means a reference was missed — search and fix.

- [ ] **Step 9: Commit**

```bash
git add src/pinia/store.ts
git commit -m "feat: replace streakRewardCharges with pendingTimeBonuses queue, add +7s and +5s rewards"
```

---

### Task 2: Update PlayersSection.vue — UI for multiple pending bonuses

**Files:**
- Modify: `src/components/Dashboard/PlayersSection.vue`

**Interfaces:**
- Consumes from Task 1:
  - `player.pendingTimeBonuses: number[]`
  - `gameStore.applyTimeProp(playerName: string, seconds: number): void`
  - `gameStore.consumePendingBonus(playerName: string, seconds: number): void`

- [ ] **Step 1: Update `streak-ready` CSS class condition**

Find the player-card `:class` binding (around line 9–15). Change:
```html
'streak-ready': player.streakRewardCharges > 0,
```
To:
```html
'streak-ready': player.pendingTimeBonuses.length > 0,
```

- [ ] **Step 2: Replace the single streak reward button with a `v-for` loop**

Find the existing streak reward button block in the `header-right` div (around lines 31–38):
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

Replace with:
```html
<button
  v-for="(bonus, i) in player.pendingTimeBonuses"
  :key="i"
  class="streak-reward-btn"
  :disabled="(gameStore.state.timePropBonus[player.name] ?? 0) > 0"
  @click.stop="applyStreakReward(player, bonus)"
  :title="`連勝獎勵：+${bonus}秒`"
>
  ⚡ +{{ bonus }}秒
</button>
```

- [ ] **Step 3: Fix `handlePropClick` — pass `3` to `applyTimeProp`**

Find `handlePropClick` (around line 420–427):
```typescript
function handlePropClick(player: any): void {
  if (!player.prop) return
  if (player.prop === 'time') {
    gameStore.applyTimeProp(player.name)
  } else {
    gameStore.consumeProp(player.name)
  }
}
```

Replace with:
```typescript
function handlePropClick(player: any): void {
  if (!player.prop) return
  if (player.prop === 'time') {
    gameStore.applyTimeProp(player.name, 3)
  } else {
    gameStore.consumeProp(player.name)
  }
}
```

- [ ] **Step 4: Update `applyStreakReward` — add `bonus` parameter**

Find `applyStreakReward` (around lines 429–432):
```typescript
function applyStreakReward(player: any): void {
  gameStore.applyTimeProp(player.name)
  gameStore.consumeStreakRewardCharge(player.name)
}
```

Replace with:
```typescript
function applyStreakReward(player: any, bonus: number): void {
  gameStore.applyTimeProp(player.name, bonus)
  gameStore.consumePendingBonus(player.name, bonus)
}
```

- [ ] **Step 5: Run build to verify no TypeScript errors**

```bash
npm run build
```

Expected: `✓ built` with 0 errors. Any mention of `streakRewardCharges`, `consumeStreakRewardCharge`, or arity mismatch on `applyTimeProp` means a reference was missed.

- [ ] **Step 6: Manual smoke test**

Start the dev server:
```bash
npm run dev
```

Check:
1. Win 2 battles in a row → player card shows one ⚡ +3秒 button
2. Win 4 battles in a row → at win #4, the button shows ⚡ +7秒 (not ⚡ +3秒)
3. Win the last theme off a player (eliminating them) → winner gets an additional ⚡ +5秒 button
4. If a player has two pending bonuses ([7, 5]), two buttons appear on their card
5. Clicking one button stages it (disappears from pending); the other button becomes disabled until the next battle starts
6. After the staged battle starts and ends, the remaining button becomes clickable again
7. Losing resets winStreak and clears all pending bonus buttons from the loser's card

- [ ] **Step 7: Commit**

```bash
git add src/components/Dashboard/PlayersSection.vue
git commit -m "feat: render one button per pending bonus, disable when one already staged"
```
