# Remove Winner from Wheel on Dialog Confirm — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a battle winner presses "繼續挑戰" or "見好就收", remove them from the roulette wheel draw pool so they cannot be drawn again in the same round.

**Architecture:** Add `removeFromWheel(name: string)` to the Pinia store, then call it in both `confirmContinue()` and `confirmRestart()` in BattleSection. No UI changes.

**Tech Stack:** Vue 3 (Composition API), Pinia, TypeScript

---

## File Map

| File | Change |
|---|---|
| `src/pinia/store.ts` | Add `removeFromWheel(name)` function + export it |
| `src/components/Dashboard/BattleSection.vue` | Call `removeFromWheel` in `confirmContinue` and `confirmRestart` |

---

## Task 1: Add `removeFromWheel` to store and call it in BattleSection

**Files:**
- Modify: `src/pinia/store.ts` (after line 270, near `resetWheel`)
- Modify: `src/components/Dashboard/BattleSection.vue:316-329`

### Context

The wheel draw pool is `state.value.wheelPlayerNames: string[] | null`. Null means uninitialized; an empty array means the round is exhausted. The existing `drawFromWheel()` splices out the drawn player. We need the same removal but by name, without returning a player.

`confirmContinue()` (line 316) and `confirmRestart()` (line 324) in BattleSection both have access to `pendingWinnerName.value` — the winner's name captured before `resetBattle()` cleared it. Both handlers should remove that name from the wheel.

- [ ] **Step 1: Add `removeFromWheel` to `src/pinia/store.ts`**

Find `resetWheel()` (lines 266–271). Add the new function immediately after it:

```ts
function removeFromWheel(name: string) {
  if (!state.value.wheelPlayerNames) return
  state.value.wheelPlayerNames = state.value.wheelPlayerNames.filter(n => n !== name)
}
```

- [ ] **Step 2: Export `removeFromWheel` from the store**

Find the export block near line 629–631:

```ts
    initWheel,
    drawFromWheel,
    resetWheel,
```

Add `removeFromWheel` after `resetWheel`:

```ts
    initWheel,
    drawFromWheel,
    resetWheel,
    removeFromWheel,
```

- [ ] **Step 3: Call `removeFromWheel` in `confirmContinue`**

Find `confirmContinue()` in `src/components/Dashboard/BattleSection.vue` (lines 316–322). Add `gameStore.removeFromWheel(pendingWinnerName.value)` before clearing `pendingWinnerName`:

```ts
function confirmContinue() {
  showContinueDialog.value = false
  const winnerPlayer = gameStore.players.find(p => p.name === pendingWinnerName.value)
  if (winnerPlayer) gameStore.setChallenger(winnerPlayer)
  gameStore.removeFromWheel(pendingWinnerName.value)
  pendingWinnerName.value = ''
  emit('battle-ended')
}
```

- [ ] **Step 4: Call `removeFromWheel` in `confirmRestart`**

Find `confirmRestart()` (lines 324–329). Add `gameStore.removeFromWheel(pendingWinnerName.value)` before clearing `pendingWinnerName`:

```ts
function confirmRestart() {
  showContinueDialog.value = false
  gameStore.removeFromWheel(pendingWinnerName.value)
  pendingWinnerName.value = ''
  gameStore.clearChallenger()
  emit('battle-ended')
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /app && npx vue-tsc --noEmit 2>&1 | head -30
```

Expected: no new errors. (The pre-existing `vue-tsc` tooling crash `Error: Search string not found: "/supportedTSExtensions = .*(?=;)/"` is unrelated to this code — ignore it if that's the only output.)

- [ ] **Step 6: Commit**

```bash
git add src/pinia/store.ts src/components/Dashboard/BattleSection.vue
git commit -m "feat: remove winner from wheel draw pool when host confirms or quits after battle"
```
