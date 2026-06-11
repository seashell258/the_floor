# Win Streak Reset on 見好就收 — Design Spec

**Goal:** When a player chooses "見好就收" after winning a battle, their display win streak (`winStreak`) resets to 0. Players who choose "繼續挑戰" keep accumulating.

**Date:** 2026-06-11

---

## Problem

The `winStreak` field drives the "連勝" counter shown on each player card. When a winner taps "見好就收" and exits the challenger role, it is semantically a clean break — they are no longer on a streak. But the field is never cleared on this path, so the UI still shows their previous streak count.

## Solution

Add `resetWinStreak(playerName: string)` to the Pinia store. Call it in `confirmRestart()` in BattleSection before clearing `pendingWinnerName`.

---

## Intended Behavior

| Event | `winStreak` | `winsTowardNextReward` | `streakRewardCharges` |
|---|---|---|---|
| 繼續挑戰 | unchanged (continues) | unchanged | unchanged |
| 見好就收 | **reset to 0** | unchanged | unchanged |
| 輸掉 | reset to 0 | reset to 0 | reset to 0 (existing) |

`winsTowardNextReward` and `streakRewardCharges` are reward-system fields that must not be touched — they accumulate independently and expiring a streak doesn't cancel earned charges.

---

## Architecture

**Two-file change:**

| File | Change |
|---|---|
| `src/pinia/store.ts` | Add `resetWinStreak(playerName: string)` action + export |
| `src/components/Dashboard/BattleSection.vue` | Call `resetWinStreak` in `confirmRestart` |

### Store action

```ts
function resetWinStreak(playerName: string) {
  const player = state.value.players.find(p => p.name === playerName)
  if (player) player.winStreak = 0
}
```

Export alongside the other player-mutation actions.

### BattleSection change

In `confirmRestart()`, add before clearing `pendingWinnerName`:
```ts
gameStore.resetWinStreak(pendingWinnerName.value)
```

---

## Edge Cases

- **Player not found** (e.g. `pendingWinnerName` is empty or already removed): `find` returns `undefined`, guard prevents write — no effect.
- **Host battle**: `isHostBattle` check in `endBattle()` bypasses `showContinueDialog` entirely, so `confirmRestart` is never called for host battles. No impact.
- **`confirmContinue`**: Intentionally NOT called — the player continues their streak.
