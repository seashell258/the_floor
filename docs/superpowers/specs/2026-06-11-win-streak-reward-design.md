---
name: win-streak-reward
description: Design for win streak reward system — tracking charges, UI indicators on player cards, and soft-guard draw panel
metadata:
  type: project
---

# Win Streak Reward System

## Overview

Players earn a draw charge after winning 2 consecutive games (while holding no prop). The host draws a reward for the eligible player via the existing draw panel. If the charge goes unused before the player wins again, it expires.

## Store Changes (`store.ts`)

### Player interface — new fields

```typescript
winsTowardNextReward: number   // counts wins toward next charge (only increments when prop === null)
streakRewardCharges: number    // 0 or 1 — whether a draw is currently available
```

### `createPlayer` defaults

```typescript
winsTowardNextReward: 0,
streakRewardCharges: 0,
```

### `processBattleResult` — winner logic (added alongside existing `winner.winStreak += 1`)

1. If `winner.streakRewardCharges === 1` → expire unused charge, set to 0
2. If `winner.prop === null` → `winsTowardNextReward += 1`
3. If `winsTowardNextReward >= 2` → `streakRewardCharges = 1`, `winsTowardNextReward = 0`

### `processBattleResult` — loser logic (added alongside existing `loser.winStreak = 0`)

- `loser.winsTowardNextReward = 0`
- `loser.streakRewardCharges = 0`

### New action: `consumeStreakRewardCharge(playerName: string)`

Sets `player.streakRewardCharges = 0`. Called by the draw panel after a successful reward draw.

### Host battles

The `isHostInvolved` branch returns early before the new logic runs. Host battles do not affect `winsTowardNextReward` or `streakRewardCharges`.

## Component Changes (`PlayersSection.vue`)

### Player card

- Add CSS class `streak-ready` when `player.streakRewardCharges === 1`
- Style: amber/orange border + pulse animation so the host sees it immediately

### Draw panel

- Select options show charge status: `⚡ 小明` vs `小明`
- When selected player has `streakRewardCharges === 0`, show warning text below select: 「此玩家目前無連勝獎勵可抽」
- Draw button remains enabled regardless (soft guard — host retains full control)
- On successful draw: call `gameStore.consumeStreakRewardCharge(playerName)` in addition to existing `applyProp` + `recordDrawResult`

## Reward Pool

Unchanged — random pick between `'time'` (+3s) and `'shield'` as currently implemented.

## Out of Scope

- `winStreakReward.vue` — unused legacy component, left untouched
- Future: streak rewards affecting in-battle conditions (separate phase)
