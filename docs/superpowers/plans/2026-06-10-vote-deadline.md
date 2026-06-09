# Vote Deadline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 7-second vote window to every battle — vote buttons disable automatically, and late-joining participants see "投票已截止" immediately.

**Architecture:** `battleStartedAt` (Unix ms) is set in the Pinia store when a battle starts and cleared on reset. It is included in every `pushVoteState` socket emission so all clients share the same timestamp. The vote page derives the countdown locally with `Date.now()`, requiring no server-side timer.

**Tech Stack:** Vue 3 (Composition API), Pinia, Socket.IO

---

## File Map

| File | Change |
|---|---|
| `server.js` | Add `battleStartedAt: null` to initial `voteState` shape |
| `src/pinia/store.ts` | Add `battleStartedAt` field to `GameState`, set in `startBattleWithChallenger`, clear in `resetBattle`, expose as computed, update `applyVoteState` |
| `src/views/DashboardView.vue` | Include `battleStartedAt` in `pushVoteState()` |
| `src/components/Dashboard/BattleSection.vue` | Include `battleStartedAt` in both `socket.emit('pushVoteState', …)` calls |
| `src/views/VoteView.vue` | Add countdown logic, badge UI, disable buttons when closed |

---

## Task 1: server.js — add `battleStartedAt` to initial voteState

**Files:**
- Modify: `server.js:12-16`

- [ ] **Step 1: Add the field**

In `server.js`, change the initial `voteState` from:
```js
let voteState = {
  currentBattle: null,
  voteResults: { player1: '', player2: '', votes1: 0, votes2: 0, voters1: [], voters2: [] },
  battleWinner: null
}
```
to:
```js
let voteState = {
  currentBattle: null,
  voteResults: { player1: '', player2: '', votes1: 0, votes2: 0, voters1: [], voters2: [] },
  battleWinner: null,
  battleStartedAt: null
}
```

- [ ] **Step 2: Commit**

```bash
git add server.js
git commit -m "feat: add battleStartedAt to server voteState shape"
```

---

## Task 2: store.ts — add `battleStartedAt` to GameState

**Files:**
- Modify: `src/pinia/store.ts`

- [ ] **Step 1: Add field to `GameState` interface**

In `src/pinia/store.ts`, find the `GameState` interface (line ~92). Add `battleStartedAt` after `timePropBonus`:

```typescript
interface GameState {
  currentVoter: Voter | null
  players: Player[]
  currentBattle: {
    player1Name: string
    player2Name: string
    image: string
  } | null
  voteResults: VoteResult | null
  drawResults: DrawResult | null
  eliminatedPlayers: string[]
  wheelPlayerNames: string[] | null
  currentChallenger: ChallengerResult | null
  challengerTimer: number
  defenderTimer: number
  currentTimerPlayer: string | null
  isTimerRunning: boolean
  battleWinner: string | null
  hostThemes: ThemeData[]
  hostCurrentTheme: ThemeData | null
  timePropBonus: Record<string, number>
  battleStartedAt: number | null
}
```

- [ ] **Step 2: Add to initial state**

Find the `const state = ref<GameState>({...})` block (line ~117). Add `battleStartedAt: null` after `timePropBonus: {}`:

```typescript
    timePropBonus: {},
    battleStartedAt: null
```

- [ ] **Step 3: Set in `startBattleWithChallenger`**

Find `function startBattleWithChallenger` (line ~362). Add `state.value.battleStartedAt = Date.now()` immediately after `state.value.isTimerRunning = true`:

```typescript
    state.value.isTimerRunning = true
    state.value.battleStartedAt = Date.now()
```

- [ ] **Step 4: Clear in `resetBattle`**

Find `function resetBattle` (line ~494). Add `state.value.battleStartedAt = null` inside the function body:

```typescript
  function resetBattle() {
    state.value.currentBattle = null
    state.value.challengerTimer = 30
    state.value.defenderTimer = 30
    state.value.currentTimerPlayer = null
    state.value.isTimerRunning = false
    state.value.battleWinner = null
    state.value.timePropBonus = {}
    state.value.battleStartedAt = null
  }
```

- [ ] **Step 5: Expose as computed getter**

Find the block of computed getters near line 143. Add:

```typescript
  const battleStartedAt = computed(() => state.value.battleStartedAt)
```

- [ ] **Step 6: Update `applyVoteState` signature and body**

Replace the current `applyVoteState` function (line ~504):

```typescript
  function applyVoteState(incoming: {
    currentBattle: GameState['currentBattle']
    voteResults: NonNullable<GameState['voteResults']>
    battleWinner: string | null
    battleStartedAt: number | null
  }) {
    state.value.currentBattle = incoming.currentBattle
    state.value.voteResults = incoming.voteResults
    state.value.battleWinner = incoming.battleWinner
    state.value.battleStartedAt = incoming.battleStartedAt ?? null
  }
```

- [ ] **Step 7: Add `battleStartedAt` to the return object**

In the `return { ... }` block at the bottom of the store, add `battleStartedAt` alongside the other computed getters (e.g. after `currentBattle`):

```typescript
    battleStartedAt,
```

- [ ] **Step 8: Commit**

```bash
git add src/pinia/store.ts
git commit -m "feat: add battleStartedAt to game store"
```

---

## Task 3: DashboardView.vue — include `battleStartedAt` in pushVoteState

**Files:**
- Modify: `src/views/DashboardView.vue:54-60`

- [ ] **Step 1: Update `pushVoteState()`**

Replace the current `pushVoteState` function:

```typescript
function pushVoteState() {
  socket.emit('pushVoteState', {
    currentBattle: gameStore.currentBattle,
    voteResults: gameStore.voteResults,
    battleWinner: gameStore.battleWinner,
    battleStartedAt: gameStore.battleStartedAt
  })
}
```

No other changes needed in this file — `gameStore.battleStartedAt` is already set by the store before `pushVoteState` is called.

- [ ] **Step 2: Commit**

```bash
git add src/views/DashboardView.vue
git commit -m "feat: include battleStartedAt in DashboardView pushVoteState"
```

---

## Task 4: BattleSection.vue — include `battleStartedAt` in socket emissions

**Files:**
- Modify: `src/components/Dashboard/BattleSection.vue` (two `socket.emit('pushVoteState', …)` calls)

- [ ] **Step 1: Update winner watch emission (line ~216)**

Change:
```typescript
  socket.emit('pushVoteState', {
    currentBattle: gameStore.currentBattle,
    voteResults: gameStore.voteResults,
    battleWinner: winner
  })
```
to:
```typescript
  socket.emit('pushVoteState', {
    currentBattle: gameStore.currentBattle,
    voteResults: gameStore.voteResults,
    battleWinner: winner,
    battleStartedAt: gameStore.battleStartedAt
  })
```

- [ ] **Step 2: Update `endBattle` emission (line ~226)**

Change:
```typescript
  socket.emit('pushVoteState', {
    currentBattle: gameStore.currentBattle,
    voteResults: gameStore.voteResults,
    battleWinner: gameStore.battleWinner
  })
```
to:
```typescript
  socket.emit('pushVoteState', {
    currentBattle: gameStore.currentBattle,
    voteResults: gameStore.voteResults,
    battleWinner: gameStore.battleWinner,
    battleStartedAt: gameStore.battleStartedAt
  })
```

Note: at the time `endBattle` runs, `resetBattle()` has already been called, so `gameStore.battleStartedAt` will be `null` — exactly what we want.

- [ ] **Step 3: Commit**

```bash
git add src/components/Dashboard/BattleSection.vue
git commit -m "feat: include battleStartedAt in BattleSection socket emissions"
```

---

## Task 5: VoteView.vue — countdown logic, badge, button locking

**Files:**
- Modify: `src/views/VoteView.vue`

- [ ] **Step 1: Update script imports**

Replace:
```typescript
import { computed, ref } from 'vue'
```
with:
```typescript
import { computed, ref, watch, onUnmounted } from 'vue'
```

- [ ] **Step 2: Add countdown constants, state, and interval management**

After `const activeTab = ref<'vote' | 'status'>('vote')`, add:

```typescript
const VOTE_WINDOW_MS = 7000
const now = ref(Date.now())
let countdownInterval: number | null = null

watch(() => gameStore.currentBattle, (battle) => {
  if (battle) {
    countdownInterval = window.setInterval(() => { now.value = Date.now() }, 200)
  } else {
    if (countdownInterval !== null) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }
  }
}, { immediate: true })

onUnmounted(() => {
  if (countdownInterval !== null) clearInterval(countdownInterval)
})

const voteSecondsLeft = computed(() => {
  const startedAt = gameStore.battleStartedAt
  if (!startedAt) return 0
  return Math.max(0, Math.ceil((startedAt + VOTE_WINDOW_MS - now.value) / 1000))
})

const voteOpen = computed(() => voteSecondsLeft.value > 0)
```

- [ ] **Step 3: Guard `vote()` against closed window**

In the `vote()` function, add an early return after the `hasVoted` check:

```typescript
function vote(playerChoice: number) {
  const voterName = gameStore.currentVoter?.name
  if (!voterName || !gameStore.voteResults) return
  if (hasVoted.value) return
  if (!voteOpen.value) return

  gameStore.recordVote(playerChoice, voterName)
  socket.emit('recordVote', { playerChoice, voterName })
}
```

- [ ] **Step 4: Add the badge and update button `:disabled` in the template**

Replace the current vote section block (lines 23–42):

```html
      <section v-if="activeTab === 'vote'" class="section">
        <h3>投票</h3>

        <div v-if="gameStore.currentBattle" class="vote-deadline-badge" :class="{ closed: !voteOpen }">
          <span v-if="voteOpen">投票截止倒數：{{ voteSecondsLeft }}s</span>
          <span v-else>投票已截止</span>
        </div>

        <div v-if="gameStore.currentBattle" class="vote-buttons">
          <button
            @click="vote(1)"
            class="vote-btn"
            :class="{ 'voted': hasVotedFor(1) }"
            :disabled="hasVoted || !voteOpen"
          >
            <Check v-if="hasVotedFor(1)" :size="16" style="margin-right:0.3rem;vertical-align:middle" />Vote for {{ gameStore.currentBattle?.player1Name }}
          </button>
          <button
            @click="vote(2)"
            class="vote-btn"
            :class="{ 'voted': hasVotedFor(2) }"
            :disabled="hasVoted || !voteOpen"
          >
            <Check v-if="hasVotedFor(2)" :size="16" style="margin-right:0.3rem;vertical-align:middle" />Vote for {{ gameStore.currentBattle?.player2Name }}
          </button>
        </div>

        <div v-if="!gameStore.currentBattle" class="voting-disabled">
          暫無對決
        </div>
        <div v-if="hasVoted && gameStore.currentBattle" class="voted-message">
          <Check :size="16" style="vertical-align:middle;margin-right:0.35rem" />投票成功
        </div>
```

- [ ] **Step 5: Add CSS for the badge**

In `<style scoped>`, add before the closing `</style>` tag (before the `@media` blocks):

```css
.vote-deadline-badge {
  margin-bottom: 0.75rem;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  text-align: center;
  font-weight: bold;
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.95rem;
  background: rgba(245, 158, 11, 0.12);
  color: var(--warn);
  border: 1px solid rgba(245, 158, 11, 0.3);
  letter-spacing: 0.04em;
}

.vote-deadline-badge.closed {
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-muted);
  border-color: transparent;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/views/VoteView.vue
git commit -m "feat: add 7-second vote deadline countdown to VoteView"
```

---

## Manual Verification

1. Start backend: `node server.js` (or via docker)
2. Start frontend: `npm run dev`
3. Open dashboard on one tab, log in as a player and open `/vote` on another
4. Start a battle on the dashboard
5. **Vote page** should immediately show amber badge counting down 7…6…5…
6. Vote on one player while countdown is running — should succeed
7. After 7s, badge turns to "投票已截止" and both buttons grey out
8. Open a new `/vote` tab after 7s — should show "投票已截止" immediately
9. End the battle — badge disappears (no battle = no badge)
