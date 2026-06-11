# Winner Continues to Challenge — Design Spec

**Goal:** After a battle ends, allow the winner to immediately continue as the challenger for the next round, instead of always clearing the challenger and requiring a re-draw.

**Date:** 2026-06-11

---

## Problem

Currently, `endBattle()` always calls `gameStore.clearChallenger()` before emitting `battle-ended`. This forces the host to navigate to 抽挑戰者, re-draw a challenger, then return to 選擇挑戰對象 before the next battle can start — even when the winner should logically continue.

---

## Solution

After a battle ends (winner determined), instead of immediately calling `clearChallenger()` and emitting `battle-ended`, show a confirmation dialog in BattleSection:

> **讓 [勝者名] 繼續挑戰？**
>
> [繼續挑戰]  [重新選人]

- **繼續挑戰**: `currentChallenger` is preserved → emit `battle-ended` → DashboardView switches to `playersList`. Winner is already set as challenger; host picks a defending player and theme to start the next battle immediately.
- **重新選人**: `gameStore.clearChallenger()` → emit `battle-ended` → DashboardView switches to `playersList`. No challenger is set; clicking a theme shows the existing "尚未抽出挑戰者" toast guard.

DashboardView's `@battle-ended="activeTab = 'playersList'"` is **not changed** — both paths land on the same tab.

---

## Architecture

**Single-file change: `src/components/Dashboard/BattleSection.vue`**

No changes to DashboardView, the store, or server.js.

### State added

```ts
const showContinueDialog = ref(false)
```

### `endBattle()` change

Before:
```ts
function endBattle() {
  gameStore.resetBattle()
  // ... pushVoteState ...
  gameStore.clearChallenger()
  emit('battle-ended')
}
```

After:
```ts
function endBattle() {
  gameStore.resetBattle()
  // ... pushVoteState (unchanged) ...
  // clearChallenger and emit moved to dialog handlers
  showContinueDialog.value = true
}
```

### Two dialog action handlers

```ts
function confirmContinue() {
  showContinueDialog.value = false
  emit('battle-ended')
  // currentChallenger preserved — no clearChallenger call
}

function confirmRestart() {
  showContinueDialog.value = false
  gameStore.clearChallenger()
  emit('battle-ended')
}
```

### Dialog template (inside `<Teleport to="body">`)

Overlay + centered card. Shows when `showContinueDialog` is true. Appears on top of the battle result panel.

Content:
- Heading: `讓 {{ battleWinner }} 繼續挑戰？`
- Two buttons: `繼續挑戰` (primary/accent) and `重新選人` (secondary/muted)
- Clicking overlay background triggers `confirmRestart()` (conservative default — don't silently retain challenger)

### `emit` type update

```ts
// before
const emit = defineEmits<{ (e: 'battle-ended'): void }>()

// after — no change, payload not needed
const emit = defineEmits<{ (e: 'battle-ended'): void }>()
```

---

## Scope Boundaries

- **No limit on consecutive wins** — host can keep pressing 繼續挑戰 indefinitely.
- **Host battles (`isHostBattle`)**: same dialog applies. If host wins, `battleWinner === '主持人'` and the dialog would say "讓 主持人 繼續挑戰？" — acceptable since the host would logically click 重新選人 in that case. No special-casing needed.
- **pushVoteState timing**: unchanged — still fires inside `endBattle()` before the dialog appears. No extra push needed on dialog confirm/cancel.
- **No DashboardView changes.**
- **No store changes.**
- **No server changes.**

---

## Files

| File | Change |
|---|---|
| `src/components/Dashboard/BattleSection.vue` | Add `showContinueDialog` ref; split `endBattle()` into dialog show + two handlers; add dialog template + styles |
