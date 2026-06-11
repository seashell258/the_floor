# Win Streak Reset on 見好就收 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reset `winStreak` to 0 when a player chooses "見好就收", leaving `winsTowardNextReward` and `streakRewardCharges` untouched.

**Architecture:** Add `resetWinStreak(playerName)` to the Pinia store, call it in `confirmRestart()` in BattleSection. No UI changes.

**Tech Stack:** Vue 3 (Composition API), Pinia, TypeScript

---

## File Map

| File | Change |
|---|---|
| `src/pinia/store.ts` | Add `resetWinStreak(name)` function + export it |
| `src/components/Dashboard/BattleSection.vue` | Call `resetWinStreak` in `confirmRestart` |

---

## Task 1: Add `resetWinStreak` to store and call it in BattleSection

**Files:**
- Modify: `src/pinia/store.ts`
- Modify: `src/components/Dashboard/BattleSection.vue`

### Context

`state.value.players` is an array of player objects. Each has a `winStreak: number` field. `winsTowardNextReward` and `streakRewardCharges` must NOT be modified.

`confirmRestart()` in BattleSection (currently around lines 324–330) has access to `pendingWinnerName.value` which holds the winner's name before it is cleared. The call must happen before `pendingWinnerName.value = ''`.

The export block in `store.ts` is near the bottom of the file (around line 629–640). Look for `resetWheel` and `removeFromWheel` nearby.

- [ ] **Step 1: Add `resetWinStreak` to `src/pinia/store.ts`**

Find `removeFromWheel` (should be around lines 272–275). Add the new function immediately after it:

```ts
function resetWinStreak(playerName: string) {
  const player = state.value.players.find(p => p.name === playerName)
  if (player) player.winStreak = 0
}
```

- [ ] **Step 2: Export `resetWinStreak` from the store**

Find the export block with `removeFromWheel`. Add `resetWinStreak` after `removeFromWheel`:

```ts
    removeFromWheel,
    resetWinStreak,
```

- [ ] **Step 3: Call `resetWinStreak` in `confirmRestart`**

Find `confirmRestart()` in `src/components/Dashboard/BattleSection.vue`. Add `gameStore.resetWinStreak(pendingWinnerName.value)` before clearing `pendingWinnerName`:

```ts
function confirmRestart() {
  showContinueDialog.value = false
  gameStore.removeFromWheel(pendingWinnerName.value)
  gameStore.resetWinStreak(pendingWinnerName.value)
  pendingWinnerName.value = ''
  gameStore.clearChallenger()
  emit('battle-ended')
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /app && npx vite build 2>&1 | tail -10
```

Expected: build completes with no new TypeScript errors. (Pre-existing `vue-tsc` tooling crash `Error: Search string not found: "/supportedTSExtensions = .*(?=;)/"` is unrelated — use `vite build` instead.)

- [ ] **Step 5: Commit**

```bash
git add src/pinia/store.ts src/components/Dashboard/BattleSection.vue
git commit -m "feat: reset win streak display to 0 when player chooses 見好就收"
```
