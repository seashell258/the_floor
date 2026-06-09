# Vote Deadline Feature — Design Spec

**Date:** 2026-06-10  
**Status:** Approved

## Summary

When a battle starts, the vote page shows a 7-second countdown. Once it expires, vote buttons are disabled regardless of when the participant navigated to the page. The countdown is derived from an absolute timestamp so late joiners immediately see the correct remaining time (or "投票已截止" if time has passed).

## Data Layer

### `voteState` shape (server.js)

Add `battleStartedAt: number | null` to the initial `voteState` object. The server stores and re-broadcasts it unchanged — no other server logic required.

```js
let voteState = {
  currentBattle: null,
  voteResults: { ... },
  battleWinner: null,
  battleStartedAt: null   // ← new
}
```

### `GameState` (store.ts)

Add `battleStartedAt: number | null` to the `GameState` interface and initialise it as `null`.

`applyVoteState()` receives and stores `battleStartedAt` from the incoming socket payload.

### `pushVoteState()` (DashboardView.vue)

When called after `startBattleWithChallenger()`: pass `battleStartedAt: Date.now()`.  
When called after `resetBattle()` (i.e. `currentBattle` is null): pass `battleStartedAt: null`.

## Vote Page UI (VoteView.vue)

### Countdown logic

- `VOTE_WINDOW_MS = 7000`
- A `ref<number>` called `now` is updated every 200 ms by a `setInterval` while a battle is active. The interval is started in a `watch` on `gameStore.currentBattle` and cleared on battle end or `onUnmounted`.
- `voteSecondsLeft` (computed): `Math.max(0, Math.ceil((battleStartedAt + VOTE_WINDOW_MS - now) / 1000))`. Returns `0` if `battleStartedAt` is null.
- `voteOpen` (computed): `voteSecondsLeft > 0`.

### UI states

| Condition | Countdown badge | Vote buttons |
|---|---|---|
| Battle active, `voteOpen` true, not yet voted | Amber — `"投票截止倒數：Xs"` | Enabled |
| Battle active, `voteOpen` true, already voted | Amber badge hidden (已投票 message shown instead) | Disabled (voted style) |
| Battle active, `voteOpen` false, voted | `"投票已截止"` (muted/danger) | Disabled (voted style) |
| Battle active, `voteOpen` false, not voted | `"投票已截止"` (muted/danger) | Disabled (greyed-out) |
| No battle | No badge | N/A (暫無對決 shown) |

The badge appears directly above the `.vote-buttons` grid, inside the existing vote section.

### No changes to BattleSection.vue

The countdown is entirely a vote-page concern. The dashboard does not display or manage the vote window timer.

## Files Changed

| File | Change |
|---|---|
| `server.js` | Add `battleStartedAt: null` to initial `voteState` |
| `src/pinia/store.ts` | Add `battleStartedAt` to `GameState`, `applyVoteState()` |
| `src/views/DashboardView.vue` | Pass `battleStartedAt` in `pushVoteState()` calls |
| `src/views/VoteView.vue` | Countdown logic + badge UI + button locking |
