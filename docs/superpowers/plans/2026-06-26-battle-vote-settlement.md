# Battle Vote Settlement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add correct-prediction tracking, a full-screen settlement overlay on voter phones, a 大預言家 milestone modal at 5 correct predictions, and correct-count displays on player cards and dashboard candidate cards.

**Architecture:** Host (Dashboard/BattleSection) is source of truth. When a battle resolves, the host computes which voters predicted correctly, increments `player.correct` in the Pinia store, serializes `correct` in `playersSnapshot`, and broadcasts via socket `pushVoteState`. VoteView clients receive the updated state via `App.vue`'s `socket.on('voteState', applyVoteState)` handler. A `watch(() => gameStore.battleWinner)` in VoteView triggers the settlement overlay locally, and a `prophesyShown` ref ensures the 大預言家 modal fires at most once per session.

**Tech Stack:** Vue 3, Pinia, Socket.io, TypeScript, Vite. No frontend test framework — verification is manual.

## Global Constraints

- Vote window: `VOTE_WINDOW_MS = 10000` (10 seconds)
- Settlement overlay: auto-dismisses after 4 seconds, cyan theme for correct, dark-red for wrong
- 大預言家 modal: fires once when `player.correct` reaches exactly 5, requires manual dismiss
- All UI text: Traditional Chinese, no emoji
- Candidate card text: `N次預測` (no space before 次, no punctuation)
- Player-card stat: `預測命中 N 次`
- Design language: Chakra Petch font, CSS vars `--glow`, `--danger`, `--bg-panel`, `--bg-surface`, `--text-muted`, `--text`, `--glow-10`, `--glow-30`
- Do not add automated tests — no JS test framework is installed

---

## File Map

| File | Change |
|------|--------|
| `src/pinia/store.ts` | Add `incrementCorrectVoters(winnerName)` action; call it inside `processBattleResult` (both host and regular paths); extend `applyVoteState` snapshot type and apply `correct` |
| `src/components/Dashboard/BattleSection.vue` | Add `correct: p.correct` to `playersSnapshot` in `watch(battleWinner)` emit and `endBattle()` emit |
| `src/views/VoteView.vue` | Change `VOTE_WINDOW_MS` to 10000; add settlement overlay; add 大預言家 modal; add correct count to player-card; update `onUnmounted` to clear settlement timer |
| `src/components/Dashboard/GetChallengerSection.vue` | Add `N次預測` line inside candidate-card |

---

## Task 1: store.ts — incrementCorrectVoters + applyVoteState sync

**Files:**
- Modify: `src/pinia/store.ts`

**Interfaces:**
- Produces: `incrementCorrectVoters(winnerName: string): void` — exported from store, called internally by `processBattleResult`
- Produces: `applyVoteState` now accepts `correct?: number` per snapshot player entry and applies it

- [ ] **Step 1: Add `incrementCorrectVoters` function and call it in `processBattleResult`**

Open `src/pinia/store.ts`. Add this function immediately before `processBattleResult` (around line 413):

```typescript
function incrementCorrectVoters(winnerName: string): void {
  const battle = state.value.currentBattle
  const vr = state.value.voteResults
  if (!battle || !vr) return
  const correctVoters = winnerName === battle.player1Name ? vr.voters1 : vr.voters2
  for (const voterName of correctVoters) {
    const player = state.value.players.find(p => p.name === voterName)
    if (player) player.correct += 1
  }
}
```

In `processBattleResult`, in the **host battle path**, add the call before `state.value.battleWinner = winnerName`:

```typescript
// Replace this block (lines ~421-426):
if (isHostInvolved) {
  const activeHostTheme = state.value.hostThemes.find(t => !t.isConsumed)
  if (activeHostTheme) activeHostTheme.isConsumed = true
  state.value.battleWinner = winnerName
  return
}

// With:
if (isHostInvolved) {
  const activeHostTheme = state.value.hostThemes.find(t => !t.isConsumed)
  if (activeHostTheme) activeHostTheme.isConsumed = true
  incrementCorrectVoters(winnerName)
  state.value.battleWinner = winnerName
  return
}
```

In the **regular battle path**, add the call before the final `state.value.battleWinner = winnerName` (the last two lines of `processBattleResult`):

```typescript
// Replace:
  loser.winStreak = 0
  loser.pendingTimeBonuses = []
  state.value.battleWinner = winnerName

// With:
  loser.winStreak = 0
  loser.pendingTimeBonuses = []
  incrementCorrectVoters(winnerName)
  state.value.battleWinner = winnerName
```

- [ ] **Step 2: Extend `applyVoteState` snapshot type to include `correct`**

In `applyVoteState`, find the `playersSnapshot` parameter type (around line 529). Add `correct?: number`:

```typescript
// Replace the playersSnapshot type:
playersSnapshot?: Array<{
  name: string
  eliminated: boolean
  winStreak: number
  prop: 'time' | 'shield' | null
  themeItems: Array<{ name: string; isConsumed: boolean; isActivated: boolean }>
}> | null

// With:
playersSnapshot?: Array<{
  name: string
  eliminated: boolean
  winStreak: number
  prop: 'time' | 'shield' | null
  correct?: number
  themeItems: Array<{ name: string; isConsumed: boolean; isActivated: boolean }>
}> | null
```

Then inside the `for (const snap of incoming.playersSnapshot)` loop, after `player.prop = snap.prop`, add:

```typescript
if (snap.correct !== undefined) player.correct = snap.correct
```

- [ ] **Step 3: Export `incrementCorrectVoters` in the return statement**

Find the `return { ... }` block at the end of `defineStore`. Add `incrementCorrectVoters` to it (near the other action exports):

```typescript
// Add to the return object:
incrementCorrectVoters,
```

- [ ] **Step 4: Verify TypeScript compiles cleanly**

```bash
cd /app && npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/pinia/store.ts
git commit -m "feat: add incrementCorrectVoters action and sync correct via applyVoteState"
```

---

## Task 2: BattleSection.vue — serialize `correct` in playersSnapshot

**Files:**
- Modify: `src/components/Dashboard/BattleSection.vue`

**Interfaces:**
- Consumes: `Player.correct` from `src/pinia/store.ts` (already exists on the Player interface)
- Produces: `playersSnapshot` entries now include `correct: number`, which `applyVoteState` (Task 1) will consume

- [ ] **Step 1: Add `correct` to the `watch(battleWinner)` emit**

In `BattleSection.vue`, find the `watch(battleWinner, ...)` block (around line 328). The `playersSnapshot` map is:

```typescript
playersSnapshot: gameStore.players.map(p => ({
  name: p.name,
  eliminated: p.eliminated,
  winStreak: p.winStreak,
  prop: p.prop,
  themeItems: p.themeStack.items.map(t => ({
```

Add `correct: p.correct,` after `prop: p.prop,`:

```typescript
playersSnapshot: gameStore.players.map(p => ({
  name: p.name,
  eliminated: p.eliminated,
  winStreak: p.winStreak,
  prop: p.prop,
  correct: p.correct,
  themeItems: p.themeStack.items.map(t => ({
    name: t.name,
    isConsumed: t.isConsumed,
    isActivated: t.isActivated
  }))
})),
```

- [ ] **Step 2: Add `correct` to the `endBattle()` emit**

Find the `endBattle()` function (around line 352). It has an identical `playersSnapshot` map. Apply the same change: add `correct: p.correct,` after `prop: p.prop,`.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /app && npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Dashboard/BattleSection.vue
git commit -m "feat: include player.correct in playersSnapshot broadcast"
```

---

## Task 3: VoteView.vue — vote window + settlement overlay

**Files:**
- Modify: `src/views/VoteView.vue`

**Interfaces:**
- Consumes: `gameStore.battleWinner`, `gameStore.currentBattle`, `gameStore.currentVoter`, `gameStore.players` from store
- Consumes: `hasVoted`, `hasVotedFor(n)` — already exist in VoteView script
- Produces: full-screen settlement overlay visible to voter after battle resolves

- [ ] **Step 1: Change vote window to 10 seconds**

In `VoteView.vue` script section, find:

```typescript
const VOTE_WINDOW_MS = 7000
```

Change to:

```typescript
const VOTE_WINDOW_MS = 10000
```

- [ ] **Step 2: Add settlement refs, computed, and watcher**

In the script section, after the existing `const hostAvailableCount = computed(...)` line and before the `watch(() => gameStore.currentBattle, ...)` block, add:

```typescript
const showSettlement = ref(false)
const settlementCorrect = ref(false)
const settlementWinnerName = ref('')
const showProphecy = ref(false)
const prophesyShown = ref(false)
let settlementTimer: number | null = null

const currentVoterCorrect = computed(() => {
  const name = gameStore.currentVoter?.name
  return name ? (gameStore.players.find(p => p.name === name)?.correct ?? 0) : 0
})

function checkProphecy() {
  if (prophesyShown.value) return
  if (currentVoterCorrect.value === 5) {
    showProphecy.value = true
    prophesyShown.value = true
  }
}

watch(() => gameStore.battleWinner, (winner) => {
  if (!winner || !gameStore.currentBattle) return
  if (!hasVoted.value) return
  if (settlementTimer !== null) { clearTimeout(settlementTimer); settlementTimer = null }

  const myVote = hasVotedFor(1) ? 1 : 2
  settlementCorrect.value =
    (myVote === 1 && winner === gameStore.currentBattle.player1Name) ||
    (myVote === 2 && winner === gameStore.currentBattle.player2Name)
  settlementWinnerName.value = winner
  showSettlement.value = true

  settlementTimer = window.setTimeout(() => {
    showSettlement.value = false
    settlementTimer = null
    checkProphecy()
  }, 4000)
})

watch(() => gameStore.currentBattle, (battle) => {
  if (battle) {
    showSettlement.value = false
    if (settlementTimer !== null) { clearTimeout(settlementTimer); settlementTimer = null }
  }
})
```

- [ ] **Step 3: Update `onUnmounted` to clear settlement timer**

Find the existing `onUnmounted` block:

```typescript
onUnmounted(() => {
  if (countdownInterval !== null) clearInterval(countdownInterval)
})
```

Replace with:

```typescript
onUnmounted(() => {
  if (countdownInterval !== null) clearInterval(countdownInterval)
  if (settlementTimer !== null) clearTimeout(settlementTimer)
})
```

- [ ] **Step 4: Add settlement overlay to template**

At the very end of the `<template>` block, just before `</template>`, add:

```html
<Teleport to="body">
  <Transition name="settlement-fade">
    <div
      v-if="showSettlement"
      class="settlement-overlay"
      :class="settlementCorrect ? 'settlement-correct' : 'settlement-wrong'"
    >
      <div class="settlement-content">
        <div class="settlement-verdict">{{ settlementCorrect ? '猜對了！' : '猜錯了' }}</div>
        <div class="settlement-winner">{{ settlementWinnerName }} 勝利</div>
        <div v-if="settlementCorrect" class="settlement-count">
          總計投對 {{ currentVoterCorrect }} 次
        </div>
      </div>
    </div>
  </Transition>
</Teleport>
```

- [ ] **Step 5: Add settlement overlay CSS**

At the end of the `<style scoped>` block, append:

```css
/* ── Settlement overlay ── */
.settlement-overlay {
  position: fixed;
  inset: 0;
  z-index: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.settlement-correct {
  background: rgba(0, 13, 43, 0.92);
  border-top: 3px solid var(--glow);
  box-shadow: inset 0 0 60px rgba(25, 233, 255, 0.08);
}

.settlement-wrong {
  background: rgba(20, 0, 0, 0.92);
  border-top: 3px solid var(--danger);
  box-shadow: inset 0 0 60px rgba(255, 70, 85, 0.08);
}

.settlement-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
}

.settlement-verdict {
  font-family: 'Chakra Petch', sans-serif;
  font-size: clamp(3rem, 15vw, 5rem);
  font-weight: 700;
  line-height: 1;
}

.settlement-correct .settlement-verdict {
  color: var(--glow);
  text-shadow: 0 0 30px var(--glow), 0 0 60px rgba(25, 233, 255, 0.3);
}

.settlement-wrong .settlement-verdict {
  color: var(--danger);
  text-shadow: 0 0 30px var(--danger);
}

.settlement-winner {
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
  font-size: 1.2rem;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.settlement-count {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 1rem;
  color: var(--glow);
  opacity: 0.75;
  letter-spacing: 0.06em;
}

.settlement-fade-enter-active {
  transition: opacity 0.3s ease;
}
.settlement-fade-leave-active {
  transition: opacity 0.6s ease;
}
.settlement-fade-enter-from,
.settlement-fade-leave-to {
  opacity: 0;
}
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd /app && npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/views/VoteView.vue
git commit -m "feat: extend vote window to 10s and add settlement overlay"
```

---

## Task 4: VoteView.vue — 大預言家 modal + player-card correct count

**Files:**
- Modify: `src/views/VoteView.vue`

**Interfaces:**
- Consumes: `showProphecy`, `prophesyShown`, `checkProphecy()` — added in Task 3
- Consumes: `currentVoterCorrect` computed — added in Task 3
- Consumes: `player.correct` on each player in `gameStore.players`

- [ ] **Step 1: Add 大預言家 modal to template**

After the settlement overlay `<Teleport>` block added in Task 3, add another `<Teleport>`:

```html
<Teleport to="body">
  <div v-if="showProphecy" class="prophecy-overlay" @click.self="showProphecy = false">
    <div class="prophecy-dialog">
      <div class="prophecy-title">你是大預言家！</div>
      <div class="prophecy-body">呼叫主持人來提前回答續命題吧</div>
      <button class="prophecy-close" @click="showProphecy = false">收到</button>
    </div>
  </div>
</Teleport>
```

- [ ] **Step 2: Add 大預言家 CSS**

Append to `<style scoped>`:

```css
/* ── 大預言家 modal ── */
.prophecy-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  z-index: 900;
  display: flex;
  align-items: center;
  justify-content: center;
}

.prophecy-dialog {
  background: var(--bg-panel);
  border: 1px solid var(--glow);
  border-radius: 12px;
  padding: 2rem 2.5rem;
  max-width: 320px;
  width: 90%;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 0 40px var(--glow-30);
  animation: fade-slide-up 0.35s ease-out;
}

.prophecy-title {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--glow);
  text-shadow: 0 0 16px var(--glow-30);
}

.prophecy-body {
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
  font-size: 0.95rem;
  color: var(--text);
  line-height: 1.6;
}

.prophecy-close {
  margin-top: 0.5rem;
  padding: 0.7rem 1.5rem;
  background: var(--glow);
  color: var(--bg-panel);
  border: none;
  border-radius: 8px;
  font-family: 'Chakra Petch', sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: background 0.2s;
}

.prophecy-close:hover {
  background: var(--glow-bright);
}

@keyframes fade-slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

- [ ] **Step 3: Add 預測命中 N 次 to player-card**

In the template, find the `玩家狀態` tab's player-card section. The `player-card-header` div currently looks like:

```html
<div class="player-card-header">
  <div>
    <h4>{{ player.name }}</h4>
    <p class="player-meta">剩餘命數：{{ player.themeStack.items.filter((t: any) => !t.isConsumed).length }}</p>
  </div>
  <div class="player-badge">
    <span>連勝</span>
    <strong>{{ player.winStreak }}</strong>
  </div>
</div>
```

Replace with (add `correct-badge` after `player-badge`):

```html
<div class="player-card-header">
  <div>
    <h4>{{ player.name }}</h4>
    <p class="player-meta">剩餘命數：{{ player.themeStack.items.filter((t: any) => !t.isConsumed).length }}</p>
  </div>
  <div class="badges-col">
    <div class="player-badge">
      <span>連勝</span>
      <strong>{{ player.winStreak }}</strong>
    </div>
    <div class="correct-badge">
      <span>預測命中</span>
      <strong>{{ player.correct }} 次</strong>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Add correct-badge and badges-col CSS**

Append to `<style scoped>`:

```css
.badges-col {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  align-items: flex-end;
}

.correct-badge {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 0.4rem 0.7rem;
  background: rgba(25, 233, 255, 0.07);
  border-radius: 999px;
  border: 1px solid rgba(25, 233, 255, 0.15);
}

.correct-badge span {
  color: var(--text-muted);
  font-size: 0.75rem;
  font-family: 'Chakra Petch', sans-serif;
}

.correct-badge strong {
  color: var(--glow);
  font-size: 0.95rem;
  font-family: 'Chakra Petch', sans-serif;
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /app && npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/views/VoteView.vue
git commit -m "feat: add 大預言家 modal and correct count to player-card"
```

---

## Task 5: GetChallengerSection.vue — N次預測 on candidate card

**Files:**
- Modify: `src/components/Dashboard/GetChallengerSection.vue`

**Interfaces:**
- Consumes: `player.correct` from `gameStore.wheelPlayers` (each `Player` has `.correct`)

- [ ] **Step 1: Add correct count to candidate-card template**

Find the candidate-card div in the template:

```html
<div
  v-for="(player, i) in gameStore.wheelPlayers"
  :key="player.name"
  class="candidate-card"
  :class="{ dimmed: !!gameStore.currentChallenger }"
  :style="{ animationDelay: `${(i * 0.41) % 3.5}s` }"
>
  {{ player.name }}
</div>
```

Replace with:

```html
<div
  v-for="(player, i) in gameStore.wheelPlayers"
  :key="player.name"
  class="candidate-card"
  :class="{ dimmed: !!gameStore.currentChallenger }"
  :style="{ animationDelay: `${(i * 0.41) % 3.5}s` }"
>
  {{ player.name }}
  <div class="candidate-predict">{{ player.correct }}次預測</div>
</div>
```

- [ ] **Step 2: Add candidate-predict CSS**

In the `<style scoped>` block, append after the `.candidate-card` rules:

```css
.candidate-predict {
  font-size: 0.68rem;
  color: var(--text-muted);
  font-family: 'Chakra Petch', sans-serif;
  margin-top: 0.2rem;
  letter-spacing: 0.04em;
  font-weight: 400;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /app && npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Dashboard/GetChallengerSection.vue
git commit -m "feat: show correct prediction count on dashboard candidate cards"
```

---

## Manual Verification Checklist

Run the app with `npm run dev` (frontend) and `npm start` (backend on port 3001). Open Dashboard on one browser and VoteView on another (or phone on LAN).

- [ ] Vote window shows 10 seconds (not 7) after a battle starts
- [ ] Voting after 10 seconds is blocked (buttons disabled, timer shows CLOSED)
- [ ] After battle resolves: voter who predicted correctly sees 猜對了！cyan overlay
- [ ] After battle resolves: voter who predicted wrong sees 猜錯了 dark-red overlay
- [ ] Voter who did not vote sees no overlay
- [ ] Overlay auto-dismisses after ~4 seconds
- [ ] 玩家狀態 tab shows 預測命中 N 次 updating after each battle
- [ ] Dashboard candidate cards show N次預測 for each player
- [ ] On the 5th correct prediction, 大預言家 modal appears after overlay dismisses
- [ ] 大預言家 modal requires manual tap to dismiss
- [ ] 大預言家 modal does not re-appear for subsequent correct predictions in the same session
