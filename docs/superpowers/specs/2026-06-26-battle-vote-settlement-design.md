# Battle Vote Settlement Design

**Date:** 2026-06-26
**Scope:** Battle section voting settlement — correct-prediction tracking, result overlay, milestone trigger, and display updates.

---

## Overview

When a battle starts, observers on their phones vote for who they think will win. This spec adds the full settlement loop: extending the vote window to 10 seconds, evaluating whether each voter predicted correctly, showing a full-screen result overlay on the voter's device, syncing correct-prediction counts across all clients, and surfacing those counts in the UI.

---

## Section 1 — Data Flow & State Changes

### Vote Window

`VoteView.vue`: change `VOTE_WINDOW_MS` from `7000` to `10000`.

### Correct-Prediction Counting (Host Side)

After `processBattleResult` sets `battleWinner` in the store, the host immediately evaluates which voters predicted correctly:

```
for each voterName in voteResults.voters1:
  if battleWinner === currentBattle.player1Name → player.correct += 1

for each voterName in voteResults.voters2:
  if battleWinner === currentBattle.player2Name → player.correct += 1
```

This logic lives in `store.ts` as a new action `incrementCorrectVoters()`, called at the end of `processBattleResult`.

### Snapshot Sync

`playersSnapshot` in `BattleSection.vue` (both `watch(battleWinner)` and `endBattle()`) must include `correct` per player. `applyVoteState` in `store.ts` must apply it:

```ts
player.correct = snap.correct ?? player.correct
```

### 5-Prediction Milestone

After `applyVoteState` updates `correct`, VoteView watches for the current voter's count crossing 5. A `prophesyShown` ref (local to VoteView) ensures the modal fires only once per session. The modal appears after the settlement overlay has finished auto-dismissing.

---

## Section 2 — VoteView Settlement Overlay

### Trigger

Fires when `applyVoteState` sets `battleWinner !== null` and the current voter has cast a vote in the resolved battle (i.e., their name appears in `voters1` or `voters2`). Voters who did not vote see nothing.

### Correct/Incorrect Determination (Client-Local)

```ts
const myVote = hasVotedFor(1) ? 1 : hasVotedFor(2) ? 2 : null
const isCorrect =
  (myVote === 1 && battleWinner === currentBattle.player1Name) ||
  (myVote === 2 && battleWinner === currentBattle.player2Name)
```

### Overlay Content

**Correct (cyan theme):**
- Large text: 猜對了！
- Sub-line: `{{ battleWinner }} 勝利`
- Counter: 總計投對 N 次

**Incorrect (dark-red theme):**
- Large text: 猜錯了
- Sub-line: `{{ battleWinner }} 勝利`

### Dismissal

Auto-fades after 4 seconds. If `currentVoter.correct` just reached exactly 5 on this settlement, the 「大預言家」modal fires immediately after the overlay disappears.

### Edge Cases

- If a new battle starts before the overlay is dismissed, it clears immediately.
- If the voter has no vote recorded (did not vote in time), no overlay shows.

---

## Section 3 — 大預言家 Modal

Fires on VoteView when the logged-in player's `correct` count reaches 5 for the first time in the session.

**Content:**
```
你是大預言家！
呼叫主持人來提前回答續命題吧
```

**Behaviour:** Full-screen modal, must be manually dismissed (tap anywhere or close button). `prophesyShown` ref is set to `true` once shown so it never re-fires within the session.

---

## Section 4 — UI Display Updates

### VoteView — 玩家狀態 Tab (player-card)

Add a new stat line below the existing 連勝 badge:

```
預測命中 N 次
```

Reads from `player.correct` in the store (synced via snapshot).

### Dashboard — GetChallengerSection (candidate-card)

Add a small secondary line inside each candidate card:

```
N次預測
```

Reads directly from `gameStore.players.find(p => p.name === ...).correct`. Host side is always up-to-date since it is the source of truth.

---

## Files to Change

| File | Change |
|------|--------|
| `src/views/VoteView.vue` | VOTE_WINDOW_MS → 10000; settlement overlay component; 大預言家 modal; correct count in player-card |
| `src/pinia/store.ts` | `incrementCorrectVoters()` action; `correct` in snapshot apply |
| `src/components/Dashboard/BattleSection.vue` | Call `incrementCorrectVoters()` after `processBattleResult`; add `correct` to `playersSnapshot` serialization in both emit sites |
| `src/components/Dashboard/GetChallengerSection.vue` | Add `N次預測` line to candidate-card |

---

## Out of Scope

- Persisting `correct` counts across page refreshes (in-memory only, consistent with existing architecture)
- Game-mechanic effect of the 大預言家 milestone beyond the modal notification
- Server-side storage of correct counts
