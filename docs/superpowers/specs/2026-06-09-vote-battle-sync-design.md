# Vote-Battle Sync Design

**Date:** 2026-06-09  
**Scope:** Real-time sync of battle/vote state to participant devices via Socket.IO

---

## Problem

The app is used in a multi-device setting: host operates `/dashboard` on one screen, participants use `/vote` on their own phones connecting to the same server. Pinia state is in-memory per device — changes made on the host's dashboard are invisible to participants. Participants cannot see who is battling and cannot vote.

There is also a pre-existing bug: `voteResults.player1` and `voteResults.player2` are initialized as `'Player 1'` / `'Player 2'` and never updated when a battle starts.

---

## Scope

Sync only the three vote-relevant fields:

- `currentBattle` — who is fighting (player1Name, player2Name, image)
- `voteResults` — vote counts and voter names
- `battleWinner` — winner when battle ends

Player status (themeStack, winStreak, etc.) is out of scope for this iteration.

---

## Architecture

```
[Host: /dashboard]          [Server: port 3001]         [Participants: /vote]
       │                           │                            │
       │── pushVoteState ─────────>│                            │
       │                           │── broadcast 'voteState' ──>│
       │                           │                            │
       │<── 'voteState' (votes) ───│<── recordVote ────────────│
       │                           │                            │
```

Two processes:
- `node server.js` — Express + Socket.IO on port 3001
- `npm run dev` — Vite frontend on port 5173

---

## Backend: `server.js`

Simple Node.js + Socket.IO server (~60 lines).

**State held in memory:**
```js
let voteState = {
  currentBattle: null,
  voteResults: { player1: '', player2: '', votes1: 0, votes2: 0, voters1: [], voters2: [] },
  battleWinner: null
}
```

**Socket events:**

| Event | Direction | Behaviour |
|---|---|---|
| `connection` | server → client | Send current `voteState` to newly connected client |
| `pushVoteState` | host → server | Store new state, `socket.broadcast.emit('voteState', ...)` to all other clients |
| `recordVote` | participant → server | Update `voteResults` (same logic as current Pinia `recordVote` action), then `io.emit('voteState', ...)` to all clients including host |

Vote logic on server side (mirrors existing Pinia `recordVote`):
- Prevent double-voting for same player
- Allow switching vote (remove from old, add to new)

---

## Frontend Changes

### New file: `src/socket.ts`

Singleton Socket.IO client connecting to `http://localhost:3001`.

```ts
import { io } from 'socket.io-client'
export const socket = io('http://localhost:3001')
```

### `src/pinia/store.ts`

**Fix existing bug:** In `startBattleWithChallenger()`, update `voteResults.player1` and `voteResults.player2` to match the actual player names.

**New action: `applyVoteState(voteState)`**  
Passively receives server state and updates `currentBattle`, `voteResults`, `battleWinner` in local store. Used by all clients when receiving `'voteState'` socket event.

### `src/components/Dashboard/BattleSection.vue`

After the following actions, emit `pushVoteState` to server:
- `startBattleWithChallenger` (battle begins)
- `processBattleResult` (winner declared)
- `endBattle` / `resetBattle` (battle cleared)

Use an `isReceivingFromServer` flag to prevent emit loops:
- Before calling `applyVoteState()`, set flag to `true`
- After update, set flag to `false`
- Only emit `pushVoteState` when flag is `false`

### `src/views/VoteView.vue`

**`vote()` function:** Instead of calling `gameStore.recordVote()` locally, emit `recordVote` event to server with `{ playerChoice, voterName }`.

Template remains unchanged — continues reading `gameStore.currentBattle` and `gameStore.voteResults`.

**On mount:** Listen to `'voteState'` socket event and call `gameStore.applyVoteState()`.

---

## Edge Cases

| Case | Behaviour |
|---|---|
| Participant connects before battle starts | Server sends `currentBattle: null` → VoteView shows "暫無對決" |
| Server not running | Socket fails silently; dashboard works normally via local Pinia; VoteView shows "暫無對決" |
| Battle ends | Host pushes `voteState` with `battleWinner` set; participants see winner; next battle push resets state |
| `voteResults` player name bug | Fixed in `startBattleWithChallenger()` — names are now set from actual player names |

---

## New Dependencies

- **Backend:** `socket.io` (Node.js package)
- **Frontend:** `socket.io-client` (npm package)

Run commands:
```bash
# install backend dep (global or local)
npm install socket.io

# install frontend dep
npm install socket.io-client
```

---

## Files Changed

| File | Change |
|---|---|
| `server.js` | New — Socket.IO backend |
| `src/socket.ts` | New — socket client singleton |
| `src/pinia/store.ts` | Fix player name bug; add `applyVoteState()` action |
| `src/components/Dashboard/BattleSection.vue` | Emit `pushVoteState` after battle actions |
| `src/views/VoteView.vue` | Route `vote()` through socket; listen for `voteState` events |
| `package.json` | Add `socket.io-client` dependency |
