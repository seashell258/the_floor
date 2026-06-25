# Streak Reward Expansion

**Date:** 2026-06-23

## Background

After the streak-reward simplification (2026-06-23), the only reward is a +3s time bonus triggered every 2 consecutive wins, stored as `streakRewardCharges: number` (0 or 1) and `winsTowardNextReward: number`. This design extends the system with two new rewards and replaces the single-slot model with a queue.

## New Rewards

| Trigger | Reward |
|---|---|
| winStreak divisible by 2 (2, 6, 10…) | +3s |
| winStreak divisible by 4 (4, 8, 12…) | +7s (replaces the +3s at those marks) |
| Eliminate a player (win their last theme) | +5s |

Multiple rewards can be pending at the same time (e.g., a player who earns +7s and +5s in the same battle holds both). Each reward must be used in a separate battle — only one may be staged per battle.

## Data Model

### Player interface

Remove:
- `winsTowardNextReward: number`
- `streakRewardCharges: number`

Add:
- `pendingTimeBonuses: number[]` — ordered list of pending time bonuses (seconds). e.g. `[7, 5]` means +7s and +5s both waiting.

### GameState

No changes. `timePropBonus: Record<string, number>` continues to hold the bonus staged for the next battle.

## Logic: processBattleResult

Replace the `winsTowardNextReward` / `streakRewardCharges` block with direct `winStreak`-based checks. Also add elimination detection for the winner.

```ts
winner.winStreak += 1

if (winner.winStreak % 4 === 0) {
  winner.pendingTimeBonuses.push(7)
} else if (winner.winStreak % 2 === 0) {
  winner.pendingTimeBonuses.push(3)
}

if (loser.themeStack.activeCount() === 0) {
  loser.eliminated = true
  winner.pendingTimeBonuses.push(5)
}

loser.winStreak = 0
loser.pendingTimeBonuses = []
```

Remove the `if (winner.prop === null)` guard — pending bonuses accumulate independently of `player.prop`.

## Logic: resetWinStreak

When a player opts out of continuing to challenge (confirmRestart path), also clear their `pendingTimeBonuses`:

```ts
function resetWinStreak(playerName: string) {
  const player = state.value.players.find(p => p.name === playerName)
  if (!player) return
  player.winStreak = 0
  player.pendingTimeBonuses = []
}
```

## Store Functions

**Changed:**

`applyTimeProp(playerName: string, seconds: number)` — accepts `seconds` as a parameter instead of hardcoding 3. Removes the internal `consumeProp()` call (which was a side-effect bug: it would clear `player.prop` when applying a streak bonus).

```ts
function applyTimeProp(playerName: string, seconds: number): void {
  state.value.timePropBonus[playerName] = (state.value.timePropBonus[playerName] ?? 0) + seconds
}
```

**Removed:** `consumeStreakRewardCharge(playerName: string)`

**Added:** `consumePendingBonus(playerName: string, seconds: number)` — removes the first occurrence of `seconds` from `pendingTimeBonuses`.

```ts
function consumePendingBonus(playerName: string, seconds: number): void {
  const player = state.value.players.find(p => p.name === playerName)
  if (!player) return
  const idx = player.pendingTimeBonuses.indexOf(seconds)
  if (idx !== -1) player.pendingTimeBonuses.splice(idx, 1)
}
```

**Updated exports:** remove `consumeStreakRewardCharge`, add `consumePendingBonus`.

## Player initialisation

In `createPlayer`, replace:
```ts
winsTowardNextReward: 0,
streakRewardCharges: 0,
```
with:
```ts
pendingTimeBonuses: [],
```

## UI: PlayersSection.vue

Replace the single `v-if="player.streakRewardCharges > 0"` button with a `v-for` over `pendingTimeBonuses`:

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

`applyStreakReward` changes signature:
```ts
function applyStreakReward(player: any, bonus: number): void {
  gameStore.applyTimeProp(player.name, bonus)
  gameStore.consumePendingBonus(player.name, bonus)
}
```

`streak-ready` CSS class condition: `player.pendingTimeBonuses.length > 0`.

Replace the call to `gameStore.consumeStreakRewardCharge` with `gameStore.consumePendingBonus` (existing call in `handlePropClick` path for `prop === 'time'` remains — that calls `applyTimeProp` which now requires a `seconds` argument, so that call site must pass `3`).

## What Does NOT Change

- Shield system (`player.prop`, `applyProp`, `consumeProp`, shield dialog, shield animation)
- `winStreak` display on player cards
- `timePropBonus` accumulation and consumption at battle start (`startBattleWithChallenger`)
- Socket snapshot sync (`applyVoteState`) — `pendingTimeBonuses` is admin-only state, not needed on vote page
