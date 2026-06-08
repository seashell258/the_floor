# Vote-Battle Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Socket.IO so participants on `/vote` see the current battle and can vote in real-time, with results visible on both the host dashboard and all participant devices.

**Architecture:** A Node.js + Socket.IO server (`server.js`, port 3001) holds the authoritative `voteState` (currentBattle, voteResults, battleWinner). The host pushes state snapshots to the server after key battle actions; participants emit `recordVote` events; the server broadcasts updates to all connected clients. App.vue sets up the global `voteState` listener, which calls `gameStore.applyVoteState()` on every device.

**Tech Stack:** `socket.io` (Node.js server), `socket.io-client` (Vue frontend), Vue 3 + Pinia (existing)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `server.js` | Create | Socket.IO server — holds voteState, handles pushVoteState + recordVote |
| `src/socket.ts` | Create | Socket.io-client singleton used by all frontend code |
| `src/pinia/store.ts` | Modify | Fix player name bug; add `applyVoteState()` action |
| `src/App.vue` | Modify | Set up global `voteState` socket listener |
| `src/views/DashboardView.vue` | Modify | Emit `pushVoteState` after battle starts |
| `src/components/Dashboard/BattleSection.vue` | Modify | Emit `pushVoteState` when winner declared and when battle ends |
| `src/views/VoteView.vue` | Modify | Route `vote()` through socket instead of local store |

---

### Task 1: Install dependencies and create server.js

**Files:**
- Modify: `package.json`
- Create: `server.js`

- [ ] **Step 1: Install socket.io and socket.io-client**

```bash
cd /app
npm install socket.io socket.io-client
```

Expected: both packages appear in `package.json` dependencies and `node_modules/socket.io` and `node_modules/socket.io-client` exist.

- [ ] **Step 2: Create server.js**

```js
import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST']
  }
})

let voteState = {
  currentBattle: null,
  voteResults: { player1: '', player2: '', votes1: 0, votes2: 0, voters1: [], voters2: [] },
  battleWinner: null
}

io.on('connection', (socket) => {
  console.log('client connected:', socket.id)
  socket.emit('voteState', voteState)

  socket.on('pushVoteState', (state) => {
    voteState = state
    socket.broadcast.emit('voteState', voteState)
  })

  socket.on('recordVote', ({ playerChoice, voterName }) => {
    const vr = voteState.voteResults
    if (!vr) return

    const hasVotedFor1 = vr.voters1.includes(voterName)
    const hasVotedFor2 = vr.voters2.includes(voterName)

    if (hasVotedFor1 && playerChoice !== 1) {
      vr.votes1--
      vr.voters1 = vr.voters1.filter(n => n !== voterName)
    } else if (hasVotedFor2 && playerChoice !== 2) {
      vr.votes2--
      vr.voters2 = vr.voters2.filter(n => n !== voterName)
    }

    if (playerChoice === 1 && !hasVotedFor1) {
      vr.votes1++
      vr.voters1.push(voterName)
    } else if (playerChoice === 2 && !hasVotedFor2) {
      vr.votes2++
      vr.voters2.push(voterName)
    }

    io.emit('voteState', voteState)
  })

  socket.on('disconnect', () => {
    console.log('client disconnected:', socket.id)
  })
})

httpServer.listen(3001, () => {
  console.log('Socket server running on port 3001')
})
```

- [ ] **Step 3: Verify server starts**

In a terminal:
```bash
node server.js
```

Expected output:
```
Socket server running on port 3001
```

Keep this terminal running. Open a second terminal for frontend work.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json server.js
git commit -m "feat: add Socket.IO server for vote-battle sync"
```

---

### Task 2: Create src/socket.ts

**Files:**
- Create: `src/socket.ts`

- [ ] **Step 1: Create the socket singleton**

```ts
import { io } from 'socket.io-client'

export const socket = io('http://localhost:3001')
```

- [ ] **Step 2: Verify no import errors**

```bash
npm run build 2>&1 | head -20
```

Expected: no TypeScript errors related to socket.ts. (Build may fail on other things — only check for socket-related errors.)

- [ ] **Step 3: Commit**

```bash
git add src/socket.ts
git commit -m "feat: add socket.io-client singleton"
```

---

### Task 3: Fix store — player names bug + applyVoteState

**Files:**
- Modify: `src/pinia/store.ts`

- [ ] **Step 1: Fix player names and reset votes in startBattleWithChallenger**

In `src/pinia/store.ts`, find `function startBattleWithChallenger` (around line 362). Replace the existing function body with:

```ts
function startBattleWithChallenger(challengerName: string, defenderName: string, photos: string[]) {
  const challengerBonus = state.value.timePropBonus[challengerName] ?? 0
  const defenderBonus   = state.value.timePropBonus[defenderName]   ?? 0
  state.value.currentBattle = {
    player1Name: challengerName,
    player2Name: defenderName,
    image: photos[0] || ''
  }
  state.value.challengerTimer = 30 + challengerBonus
  state.value.defenderTimer   = 30 + defenderBonus
  delete state.value.timePropBonus[challengerName]
  delete state.value.timePropBonus[defenderName]
  state.value.currentTimerPlayer = challengerName
  state.value.isTimerRunning = true
  state.value.battleWinner = null
  if (state.value.voteResults) {
    state.value.voteResults.player1 = challengerName
    state.value.voteResults.player2 = defenderName
    state.value.voteResults.votes1 = 0
    state.value.voteResults.votes2 = 0
    state.value.voteResults.voters1 = []
    state.value.voteResults.voters2 = []
  }
}
```

- [ ] **Step 2: Add applyVoteState action**

Inside the store's `defineStore` callback, after the `resetBattle` function, add:

```ts
function applyVoteState(incoming: {
  currentBattle: GameState['currentBattle']
  voteResults: NonNullable<GameState['voteResults']>
  battleWinner: string | null
}) {
  state.value.currentBattle = incoming.currentBattle
  state.value.voteResults = incoming.voteResults
  state.value.battleWinner = incoming.battleWinner
}
```

- [ ] **Step 3: Export applyVoteState from the store return object**

Find the `return { ... }` block at the bottom of the store. Add `applyVoteState` to the returned object:

```ts
return {
  // ... all existing exports ...
  applyVoteState
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npm run build 2>&1 | grep -i error
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/pinia/store.ts
git commit -m "fix: update voteResults player names on battle start; add applyVoteState action"
```

---

### Task 4: Set up global voteState listener in App.vue

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Add socket import and voteState listener**

In `src/App.vue`, find the `<script setup>` block. Add the socket import alongside existing imports:

```ts
import { socket } from './socket'
```

Find the existing `onMounted` block:

```ts
onMounted(() => {
  if (gameStore.players.length === 0) {
    gameStore.initializePlayersFromConfig(playersConfig)
  }
  if (gameStore.hostThemes.length === 0) {
    gameStore.initializeHostThemes(hostConfig)
  }
})
```

Replace it with:

```ts
onMounted(() => {
  if (gameStore.players.length === 0) {
    gameStore.initializePlayersFromConfig(playersConfig)
  }
  if (gameStore.hostThemes.length === 0) {
    gameStore.initializeHostThemes(hostConfig)
  }
  socket.on('voteState', (data) => {
    gameStore.applyVoteState(data)
  })
})
```

- [ ] **Step 2: Add onUnmounted cleanup**

The existing imports already include `onMounted`. Add `onUnmounted` to the Vue import line:

```ts
import { onMounted, onUnmounted } from 'vue'
```

After the `onMounted` block, add:

```ts
onUnmounted(() => {
  socket.off('voteState')
})
```

- [ ] **Step 3: Manual verification — listener fires on connect**

With `node server.js` running in one terminal and `npm run dev` in another:
1. Open `http://localhost:5173` in browser
2. Open browser DevTools → Console
3. In the server terminal, you should see: `client connected: <socket-id>`
4. In the browser console, run: `window.__pinia_stores` won't work — instead, open Vue DevTools and check the game store. `currentBattle` should be `null` (matching server's initial state).

- [ ] **Step 4: Commit**

```bash
git add src/App.vue
git commit -m "feat: set up global voteState socket listener in App.vue"
```

---

### Task 5: Push voteState from DashboardView after battle starts

**Files:**
- Modify: `src/views/DashboardView.vue`

- [ ] **Step 1: Import socket in DashboardView**

In `src/views/DashboardView.vue`, add to the existing imports:

```ts
import { socket } from '../socket'
```

- [ ] **Step 2: Add pushVoteState helper**

Inside `<script setup>`, after the existing function definitions, add:

```ts
function pushVoteState() {
  socket.emit('pushVoteState', {
    currentBattle: gameStore.currentBattle,
    voteResults: gameStore.voteResults,
    battleWinner: gameStore.battleWinner
  })
}
```

- [ ] **Step 3: Call pushVoteState in handleThemeClick**

Find `function handleThemeClick` (around line 81). After the `gameStore.startBattleWithChallenger(...)` call, add `pushVoteState()`:

```ts
function handleThemeClick(player: any, theme: any) {
  if (!gameStore.currentChallenger) {
    toast.error('尚未抽出挑戰者', {
      description: '請先到「抽挑戰者」抽出本輪挑戰者，再選擇對戰主題。',
      duration: 4000,
    })
    return
  }

  selectedThemeName.value = theme.name
  selectedBattlePlayerName.value = player.name
  selectedThemePhotos.value = theme.photos ?? []
  selectedThemeAnswers.value = theme.answers ?? []

  if (selectedThemePhotos.value.length > 0) {
    const challenger = gameStore.currentChallenger.challenger
    gameStore.startBattleWithChallenger(challenger.name, player.name, selectedThemePhotos.value)
    pushVoteState()
  }

  activeTab.value = 'battle'
}
```

- [ ] **Step 4: Call pushVoteState in handleStartHostBattle**

Find `function handleStartHostBattle` (around line 122). After `gameStore.startBattleWithChallenger(...)`, add `pushVoteState()`:

```ts
function handleStartHostBattle(challengerName: string) {
  const hostTheme = gameStore.state.hostCurrentTheme
  if (!hostTheme) return

  selectedThemeName.value = hostTheme.name
  selectedThemePhotos.value = hostTheme.photos
  selectedThemeAnswers.value = hostTheme.answers ?? []

  gameStore.startBattleWithChallenger(challengerName, '主持人', hostTheme.photos)
  pushVoteState()
  activeTab.value = 'battle'
}
```

- [ ] **Step 5: Manual verification — battle start syncs to participants**

With server and frontend running:
1. Open `http://localhost:5173/dashboard` in Browser A
2. Open `http://localhost:5173/login` in Browser B, log in as any name, go to `/vote`
3. On Browser A, start a battle (抽挑戰者 → choose a theme)
4. Browser B's vote screen should immediately show two vote buttons with player names

- [ ] **Step 6: Commit**

```bash
git add src/views/DashboardView.vue
git commit -m "feat: push voteState to server when battle starts from dashboard"
```

---

### Task 6: Push voteState from BattleSection on winner and battle end

**Files:**
- Modify: `src/components/Dashboard/BattleSection.vue`

- [ ] **Step 1: Import socket in BattleSection**

In `src/components/Dashboard/BattleSection.vue`, add to existing imports:

```ts
import { socket } from '../../socket'
```

- [ ] **Step 2: Emit pushVoteState when winner is declared**

Find the existing `watch(battleWinner, ...)` block (around line 175):

```ts
watch(battleWinner, (winner) => {
  if (!winner) return
  autoEndTimeout = setTimeout(() => {
    endBattle()
  }, 4000)
})
```

Replace with:

```ts
watch(battleWinner, (winner) => {
  if (!winner) return
  socket.emit('pushVoteState', {
    currentBattle: gameStore.currentBattle,
    voteResults: gameStore.voteResults,
    battleWinner: winner
  })
  autoEndTimeout = setTimeout(() => {
    endBattle()
  }, 4000)
})
```

- [ ] **Step 3: Emit pushVoteState when battle ends**

Find the existing `function endBattle()` (around line 186):

```ts
function endBattle() {
  if (autoEndTimeout) {
    clearTimeout(autoEndTimeout)
    autoEndTimeout = null
  }
  gameStore.resetBattle()
  gameStore.clearChallenger()
  emit('battle-ended')
}
```

Replace with:

```ts
function endBattle() {
  if (autoEndTimeout) {
    clearTimeout(autoEndTimeout)
    autoEndTimeout = null
  }
  gameStore.resetBattle()
  gameStore.clearChallenger()
  socket.emit('pushVoteState', {
    currentBattle: gameStore.currentBattle,
    voteResults: gameStore.voteResults,
    battleWinner: gameStore.battleWinner
  })
  emit('battle-ended')
}
```

- [ ] **Step 4: Manual verification — winner and battle-end sync**

With server, frontend, two browsers as before:
1. Start a battle (from Task 5 verification)
2. Let timer run out on one player (or wait for `battleWinner` to be set by `updateTimers`)
3. Browser B should show the winner name within ~1 second
4. After Browser A clicks "結束對戰" (or auto-ends), Browser B should show "暫無對決"

- [ ] **Step 5: Commit**

```bash
git add src/components/Dashboard/BattleSection.vue
git commit -m "feat: push voteState to server on battle winner and battle end"
```

---

### Task 7: Route votes through socket in VoteView

**Files:**
- Modify: `src/views/VoteView.vue`

- [ ] **Step 1: Import socket in VoteView**

In `src/views/VoteView.vue`, add to existing imports:

```ts
import { socket } from '../socket'
```

- [ ] **Step 2: Replace local vote action with socket emit**

Find the existing `function vote`:

```ts
function vote(playerChoice: number) {
  const voterName = gameStore.currentVoter?.name
  if (!voterName || !gameStore.voteResults) return
  
  if (hasVoted.value) return
  
  gameStore.recordVote(playerChoice, voterName)
}
```

Replace with:

```ts
function vote(playerChoice: number) {
  const voterName = gameStore.currentVoter?.name
  if (!voterName || !gameStore.currentBattle) return
  if (hasVoted.value) return

  socket.emit('recordVote', { playerChoice, voterName })
}
```

- [ ] **Step 3: Manual verification — end-to-end vote sync**

With server and frontend running, two browsers:
1. Browser A: `/dashboard`, start a battle
2. Browser B: `/vote`, log in as "Alice"
3. Open Browser C: `/vote`, log in as "Bob"
4. Alice votes for player 1 → within ~1 second, Browser A dashboard's answer panel shows `1 票` for player 1, Browser C's vote screen also shows updated counts
5. Bob votes for player 2 → all three browsers update to show 1-1

- [ ] **Step 4: Commit**

```bash
git add src/views/VoteView.vue
git commit -m "feat: route participant votes through socket server"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Implemented in |
|---|---|
| currentBattle synced to participants | Task 5 (DashboardView pushVoteState after startBattleWithChallenger) |
| voteResults synced to all devices | Task 7 (votes via server) + Task 4 (applyVoteState listener) |
| battleWinner synced to participants | Task 6 (BattleSection watcher) |
| New participant gets current state on connect | Task 1 (server sends voteState on connection) |
| Server not running → silent fail | socket.io-client reconnects silently; VoteView shows "暫無對決" (existing behavior) |
| Fix voteResults player names bug | Task 3 (startBattleWithChallenger update) |
| Votes reset on new battle | Task 3 (votes cleared in startBattleWithChallenger) |

**Placeholder scan:** None found.

**Type consistency check:**
- `applyVoteState` defined in Task 3 with params `{ currentBattle, voteResults, battleWinner }` — matches the object shape emitted in Tasks 5 and 6.
- `socket.emit('recordVote', { playerChoice, voterName })` in Task 7 matches server's `socket.on('recordVote', ({ playerChoice, voterName })` in Task 1.
- `socket.emit('pushVoteState', { currentBattle, voteResults, battleWinner })` in Tasks 5 and 6 matches server's `socket.on('pushVoteState', (state))` in Task 1.
