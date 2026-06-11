# Remove Winner from Wheel on Dialog Confirm — Design Spec

**Goal:** When a battle ends and the host chooses either "繼續挑戰" or "見好就收", the winner is removed from the roulette wheel draw pool for the current round.

**Date:** 2026-06-11

---

## Problem

The wheel (`wheelPlayerNames`) removes a player when they are drawn (`drawFromWheel` splices them out). But when a defender wins a battle and becomes the next challenger via "繼續挑戰" (bypassing the wheel), they remain in `wheelPlayerNames`. This means:

- If they continue and eventually press "見好就收" (or even just if they continue fighting), the wheel can still draw them in the same round.

## Solution

Add `removeFromWheel(name: string)` to the store. Call it in both `confirmContinue()` and `confirmRestart()` in BattleSection, passing `pendingWinnerName`.

- **"繼續挑戰"**: Winner is removed from wheel immediately as they become the next challenger — same effect as having been drawn.
- **"見好就收"**: Winner is removed from wheel as they exit the challenger role.

Both paths produce the same removal outcome. The next `resetWheel()` call (start of a new round) repopulates the pool normally.

---

## Architecture

**Two-file change:**

| File | Change |
|---|---|
| `src/pinia/store.ts` | Add `removeFromWheel(name: string)` action + export |
| `src/components/Dashboard/BattleSection.vue` | Call `removeFromWheel` in `confirmContinue` and `confirmRestart` |

### Store action

```ts
function removeFromWheel(name: string) {
  if (!state.value.wheelPlayerNames) return
  state.value.wheelPlayerNames = state.value.wheelPlayerNames.filter(n => n !== name)
}
```

Export alongside `drawFromWheel`, `resetWheel`, `initWheel`.

### BattleSection changes

In `confirmContinue()`, add before clearing `pendingWinnerName`:
```ts
gameStore.removeFromWheel(pendingWinnerName.value)
```

In `confirmRestart()`, add before clearing `pendingWinnerName`:
```ts
gameStore.removeFromWheel(pendingWinnerName.value)
```

---

## Edge Cases

- **Wheel not initialized** (`wheelPlayerNames === null`): `removeFromWheel` returns early — no effect.
- **Player already removed** (e.g. was eliminated earlier): `filter` is idempotent — no effect.
- **Host battle** (`isHostBattle`): `endBattle()` skips the dialog entirely and goes directly to `clearChallenger + emit`. No `removeFromWheel` call needed — `'主持人'` is never in the wheel.
- **Round reset**: `resetWheel()` repopulates from all non-eliminated players — normal behavior unchanged.
