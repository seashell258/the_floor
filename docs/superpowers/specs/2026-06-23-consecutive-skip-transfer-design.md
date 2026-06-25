# Consecutive Skip Transfer Design

## Summary

When the same player skips twice in a row, answering rights transfer to the opponent on the second skip. The first skip is a heavier penalty (keep answering); the second is lighter (opponent takes over, draining their timer instead).

## Scope

Applies to all battle types: player-vs-player and host battles.

## State

Add one local ref to `BattleSection.vue`:

```ts
const hasSkippedOnce = ref(false)
```

Tracks whether the current answering player has already skipped once this turn.

## Logic

### skipQuestion() — new behavior

```
if hasSkippedOnce == false:
  penalizeTimer(3)
  showAnswer for 800ms → advance to next question, same player continues
  set hasSkippedOnce = true

else (hasSkippedOnce == true):
  penalizeTimer(3)
  showAnswer for 800ms → advance to next question, switch timer to opponent
  set hasSkippedOnce = false
```

### Reset conditions for hasSkippedOnce

| Event | Reset? |
|---|---|
| nextQuestion() called | yes → false |
| skipQuestion() triggers transfer (2nd skip) | yes → false |
| New battle starts | yes (ref is component-scoped, resets with component) |

Any answering rights switch → counter resets. This matches the agreed rule: "any handoff resets the counter."

## Visual

The skip button reflects state:

| hasSkippedOnce | Label | Color |
|---|---|---|
| false | 跳過 | `var(--warn)` (yellow-orange, current) |
| true | 再次跳過 | `var(--danger)` (red) |

Implementation:
```ts
const skipBtnLabel = computed(() => hasSkippedOnce.value ? '再次跳過' : '跳過')
```

Template adds `:class="{ danger: skipBtnDanger }"` on the skip button; CSS `.skip-btn.danger` overrides background to `var(--danger)`.

## Files Changed

- `src/components/Dashboard/BattleSection.vue` — only file modified
  - Add `hasSkippedOnce` ref
  - Update `skipQuestion()` logic
  - Update `nextQuestion()` to reset `hasSkippedOnce`
  - Add computed `skipBtnLabel`, `skipBtnDanger`
  - Update template binding and CSS
