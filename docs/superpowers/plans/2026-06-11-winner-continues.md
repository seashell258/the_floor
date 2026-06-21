# Winner Continues to Challenge — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After a battle ends, show a confirmation dialog letting the host keep the winner as challenger for the next round instead of always re-drawing.

**Architecture:** Single-file change in `BattleSection.vue`. Add `showContinueDialog` ref; split `endBattle()` into "show dialog" and two handlers (`confirmContinue` / `confirmRestart`); add dialog template via `<Teleport to="body">`; add styles. DashboardView and the store are untouched.

**Tech Stack:** Vue 3 (Composition API, `<script setup>`, `<Teleport>`), Pinia, TypeScript

---

## File Map

| File | Change |
|---|---|
| `src/components/Dashboard/BattleSection.vue` | Add dialog ref + handlers; split endBattle; add dialog template + styles |

---

## Task 1: Add dialog logic to BattleSection

**Files:**
- Modify: `src/components/Dashboard/BattleSection.vue`

### Context

Current `endBattle()` (lines 265–291) does: `stopBattleMusic()` → `resetBattle()` → `socket.emit('pushVoteState', ...)` → `clearChallenger()` → `emit('battle-ended')`.

The new flow: `endBattle()` stops after the push and sets `showContinueDialog = true`. Two new handlers finish the job:
- `confirmContinue()` — emits `battle-ended` without clearing the challenger
- `confirmRestart()` — calls `clearChallenger()` then emits `battle-ended`

`DashboardView` always switches to `playersList` on `battle-ended`, so no payload change is needed.

- [ ] **Step 1: Add `showContinueDialog` ref**

In the `<script setup>` block, find the existing refs near line 135 (`borderFlash`, `currentPhotoIndex`, `showAnswer`). Add after them:

```ts
const showContinueDialog = ref(false)
```

- [ ] **Step 2: Replace `endBattle()` and add dialog handlers**

Find the current `endBattle()` function (lines 265–291). Replace the entire function with:

```ts
function endBattle() {
  stopBattleMusic()
  gameStore.resetBattle()
  socket.emit('pushVoteState', {
    currentBattle: gameStore.currentBattle,
    voteResults: gameStore.voteResults,
    battleWinner: gameStore.battleWinner,
    battleStartedAt: gameStore.battleStartedAt,
    playersSnapshot: gameStore.players.map(p => ({
      name: p.name,
      eliminated: p.eliminated,
      winStreak: p.winStreak,
      prop: p.prop,
      themeItems: p.themeStack.items.map(t => ({
        name: t.name,
        isConsumed: t.isConsumed,
        isActivated: t.isActivated
      }))
    })),
    hostThemesSnapshot: gameStore.hostThemes.map(t => ({
      name: t.name,
      isConsumed: t.isConsumed
    }))
  })
  showContinueDialog.value = true
}

function confirmContinue() {
  showContinueDialog.value = false
  emit('battle-ended')
}

function confirmRestart() {
  showContinueDialog.value = false
  gameStore.clearChallenger()
  emit('battle-ended')
}
```

Key points:
- `stopBattleMusic()`, `resetBattle()`, and the `socket.emit` block are identical to the old `endBattle()` — only the tail changes
- `clearChallenger()` moves to `confirmRestart()` only
- `confirmContinue()` does NOT call `clearChallenger()`, preserving `currentChallenger` so `handleThemeClick` in DashboardView can start the next battle immediately

- [ ] **Step 3: Add dialog template**

In `<template>`, after the closing `</section>` tag (line 84), add:

```html
<Teleport to="body">
  <div
    v-if="showContinueDialog"
    class="continue-overlay"
    @click.self="confirmRestart"
  >
    <div class="continue-dialog">
      <p class="continue-question">讓 <strong>{{ gameStore.battleWinner }}</strong> 繼續挑戰？</p>
      <div class="continue-actions">
        <button type="button" class="continue-btn primary" @click="confirmContinue">繼續挑戰</button>
        <button type="button" class="continue-btn secondary" @click="confirmRestart">重新選人</button>
      </div>
    </div>
  </div>
</Teleport>
```

Notes:
- `<Teleport to="body">` is a built-in Vue 3 component — no import needed
- `@click.self="confirmRestart"` on the overlay means tapping outside the card triggers 重新選人 (conservative default)
- `gameStore.battleWinner` is already available as a computed at line 118; read directly from store here since we're inside `<Teleport>` (outside the section, still within the component)

- [ ] **Step 4: Add styles**

In the `<style scoped>` block, add at the very end (before `</style>`):

```css
/* Continue-challenge confirmation dialog */
.continue-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  z-index: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.continue-dialog {
  background: var(--bg-panel);
  border: 1px solid var(--glow);
  border-radius: 12px;
  padding: 2rem 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  min-width: 280px;
  box-shadow: 0 0 40px var(--glow-30);
}

.continue-question {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text);
  font-family: 'Chakra Petch', sans-serif;
  text-align: center;
  letter-spacing: 0.04em;
}

.continue-question strong {
  color: var(--glow);
}

.continue-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.continue-btn {
  padding: 0.65rem 1.4rem;
  border-radius: 8px;
  font-family: 'Chakra Petch', sans-serif;
  font-weight: 600;
  font-size: 0.9rem;
  letter-spacing: 0.06em;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.continue-btn.primary {
  background: var(--glow);
  color: var(--bg-panel);
  border-color: var(--glow);
}

.continue-btn.primary:hover {
  background: var(--glow-bright, var(--glow));
  border-color: var(--glow-bright, var(--glow));
}

.continue-btn.secondary {
  background: transparent;
  color: var(--text-muted);
  border-color: var(--glow-30);
}

.continue-btn.secondary:hover {
  color: var(--text);
  border-color: var(--glow);
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /app && npx vue-tsc --noEmit 2>&1 | head -30
```

Expected: no new errors. (There is a known pre-existing `vue-tsc` tooling crash unrelated to this code — if you see `Error: Search string not found: "/supportedTSExtensions = .*(?=;)/"`, that is pre-existing and not caused by these changes. Confirm by running `git stash && npx vue-tsc --noEmit 2>&1 | head -5 && git stash pop`.)

- [ ] **Step 6: Smoke test in browser**

Start dev server: `npm run dev` (from `/app`). Open `http://localhost:5173/dashboard`.

1. Draw a challenger (抽挑戰者 tab), select a player + theme to start a battle.
2. After the winner appears, click **結束對戰**.
3. Verify: a modal overlay appears with "讓 [勝者名] 繼續挑戰？" and two buttons.
4. Click **繼續挑戰** → modal closes, dashboard switches to 選擇挑戰對象, the winner's name is still shown as the current challenger (the 抽挑戰者 tab's challenger display should still show them).
5. Repeat step 1-3 for a second battle.
6. Click **重新選人** → modal closes, dashboard switches to 選擇挑戰對象, no challenger is set (clicking a theme shows "尚未抽出挑戰者" toast).
7. Test overlay background tap: start another battle, click 結束對戰, tap outside the dialog card → same as 重新選人 (modal closes, no challenger).

- [ ] **Step 7: Commit**

```bash
git add src/components/Dashboard/BattleSection.vue
git commit -m "feat: show continue-challenge dialog after battle ends instead of auto-clearing challenger"
```
