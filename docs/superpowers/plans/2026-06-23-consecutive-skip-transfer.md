# Consecutive Skip Transfer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the same player skips twice in a row, the second skip deducts 3 seconds AND transfers answering rights to the opponent; the skip button changes label and color after the first skip to signal this.

**Architecture:** Single boolean ref `hasSkippedOnce` added to `BattleSection.vue`. `skipQuestion()` branches on this flag; any answering-rights handoff resets it. The skip button label and color are driven by computed properties.

**Tech Stack:** Vue 3 (Composition API), Pinia store (no changes needed), no test framework — verification is manual via dev server.

## Global Constraints

- Only `src/components/Dashboard/BattleSection.vue` is modified — no store changes, no new files.
- Penalty amount is 3 seconds (same as current skip penalty) for both the 1st and 2nd skip.
- `hasSkippedOnce` resets on ANY answering-rights switch: `nextQuestion()` or the 2nd-skip transfer.
- Applies to all battle types (player-vs-player and host battles).
- Button text: `跳過` (default) → `再次跳過` (after first skip). Color: `var(--warn)` → `var(--danger)`.

---

### Task 1: Add state, update skipQuestion, update nextQuestion, wire template and CSS

**Files:**
- Modify: `src/components/Dashboard/BattleSection.vue`

**Interfaces:**
- Consumes: `gameStore.penalizeTimer(n)`, `gameStore.battleWinner`, `gameStore.pauseTimer()`, `gameStore.switchTimer()`, `gameStore.startTimer(name)`, `gameStore.currentTimerPlayer`
- Produces: no external interface — all changes are internal to the component

- [ ] **Step 1: Add `hasSkippedOnce` ref**

Open `src/components/Dashboard/BattleSection.vue`. Find the block of `ref` declarations near the top of `<script setup>` (around line 159–169 in the current file). Add after `const showCeremony = ref(false)`:

```ts
const hasSkippedOnce = ref(false)
```

- [ ] **Step 2: Add computed properties for skip button**

After the `const ceremonyIsStreak` computed (around line 170), add:

```ts
const skipBtnLabel = computed(() => hasSkippedOnce.value ? '再次跳過' : '跳過')
const skipBtnDanger = computed(() => hasSkippedOnce.value)
```

- [ ] **Step 3: Replace skipQuestion() with the new two-skip logic**

Find the existing `skipQuestion` function (lines 202–227) and replace it entirely with:

```ts
const skipQuestion = () => {
  if (selectedThemePhotos.value.length === 0 || showAnswer.value) return

  gameStore.penalizeTimer(3)

  if (gameStore.battleWinner) return

  playSkipSFX()
  borderFlash.value = 'skip'
  currentAnswer.value = selectedThemeAnswers.value[currentPhotoIndex.value] ?? '暫無答案'
  showAnswer.value = true
  gameStore.pauseTimer()

  const wasFirstSkip = !hasSkippedOnce.value

  setTimeout(() => {
    const wasLast = currentPhotoIndex.value >= selectedThemePhotos.value.length - 1
    if (!wasLast) currentPhotoIndex.value += 1
    showAnswer.value = false
    currentAnswer.value = ''
    borderFlash.value = 'idle'

    if (wasLast) {
      hasSkippedOnce.value = false
      resolveByTimer()
    } else if (wasFirstSkip) {
      // 1st skip: same player continues, flag set
      hasSkippedOnce.value = true
      gameStore.startTimer(gameStore.currentTimerPlayer || '')
    } else {
      // 2nd consecutive skip: transfer answering rights
      hasSkippedOnce.value = false
      gameStore.switchTimer()
      gameStore.startTimer(gameStore.currentTimerPlayer || '')
    }
  }, 800)
}
```

- [ ] **Step 4: Reset hasSkippedOnce in nextQuestion()**

Find the existing `nextQuestion` function (lines 229–251). Inside the `setTimeout` callback, after `gameStore.switchTimer()` and before `gameStore.startTimer(...)`, add `hasSkippedOnce.value = false`. The full updated setTimeout block:

```ts
setTimeout(() => {
  const wasLast = currentPhotoIndex.value >= selectedThemePhotos.value.length - 1
  if (!wasLast) currentPhotoIndex.value += 1
  showAnswer.value = false
  currentAnswer.value = ''
  borderFlash.value = 'idle'
  if (wasLast) {
    resolveByTimer()
  } else {
    hasSkippedOnce.value = false
    gameStore.switchTimer()
    gameStore.startTimer(gameStore.currentTimerPlayer || '')
  }
}, 800)
```

- [ ] **Step 5: Update the skip button in the template**

Find this line in the template (around line 80):

```html
<button class="skip-btn" @click="skipQuestion" :disabled="isNextDisabled">跳過</button>
```

Replace with:

```html
<button
  class="skip-btn"
  :class="{ danger: skipBtnDanger }"
  @click="skipQuestion"
  :disabled="isNextDisabled"
>{{ skipBtnLabel }}</button>
```

- [ ] **Step 6: Add the danger CSS variant for the skip button**

Find the `.skip-btn` style block in `<style scoped>` and add after the existing `.skip-btn:hover:not(:disabled)` rule:

```css
.skip-btn.danger {
  background: var(--danger);
}

.skip-btn.danger:hover:not(:disabled) {
  opacity: 0.85;
}
```

- [ ] **Step 7: Verify manually**

Start the dev server:
```bash
npm run dev
```

Open the dashboard and start a battle. Test these scenarios:

1. **Normal skip:** Click 跳過 once → button becomes「再次跳過」(red), same player's timer continues ticking.
2. **Transfer skip:** Click 再次跳過 → button returns to「跳過」(yellow), timer switches to opponent.
3. **Counter resets via next:** Click 跳過 once (button → 再次跳過), then click 下一題 → button returns to「跳過」because nextQuestion resets the flag.
4. **Last photo on 2nd skip:** If on the last photo and player has already skipped once, clicking 再次跳過 should call resolveByTimer (battle ends by timer comparison), not crash.
5. **Timer hits 0 on skip:** If penalizeTimer causes timer to reach 0, battle ends immediately regardless of skip state — verify no visual glitch.

- [ ] **Step 8: Commit**

```bash
git add src/components/Dashboard/BattleSection.vue
git commit -m "feat: consecutive skip transfers answering rights on second skip"
```
