# Streak Reward Simplification

**Date:** 2026-06-23

## Background

The consecutive win reward system currently works as follows:
- Every 2 wins, a player gains `streakRewardCharges = 1`
- Admin opens the "抽連勝獎勵" (draw streak reward) panel, selects the player, and clicks "開始抽獎"
- `handleDrawReward()` randomly picks from `['time', 'shield']` and applies that prop
- Result is either `時間+3秒` or `盾牌`

Shields are being removed from the streak reward pool. With only one possible outcome (+3 seconds), the random draw mechanism has no purpose.

## Decision

Remove the draw panel and replace with an inline button on the player card.

## What Gets Removed

- `src/components/Dashboard/winStreakReward.vue` — deleted entirely
- `PlayersSection.vue`: `rewardOptions`, `handleDrawReward()`, `isDrawPanelOpen`, `openDrawPanel()`, the Draw Panel HTML block, and the "開始抽獎" button in any floating panel
- `store.ts`: `recordDrawResult()` function, `DrawResult` interface, `drawResults` state field, `drawResults` computed getter
- `DashboardView.vue`: import and usage of `winStreakReward` component

## What Gets Added

In `PlayersSection.vue`, on each player card: when `player.streakRewardCharges > 0`, render an "⚡ +3秒" button near the win streak count display.

Clicking it calls:
1. `gameStore.applyTimeProp(player.name)` — adds 3 seconds to that player's `timePropBonus`
2. `gameStore.consumeStreakRewardCharge(player.name)` — sets `streakRewardCharges` back to 0

Button styling follows existing glow theme conventions.

## What Stays Unchanged

- `streakRewardCharges` accumulation logic in `processBattleResult` (every 2 wins → charge = 1)
- `applyTimeProp()` and `consumeStreakRewardCharge()` functions in store
- Shield system for any other use cases
- `winStreak` counter display on player cards
- The `⚡` indicator on player names in other sections (already tied to `streakRewardCharges > 0`)
