# BattleSection Controls Layout — Design Spec

**Date:** 2026-06-08  
**Scope:** `src/components/Dashboard/BattleSection.vue` — template structure + CSS only  
**Goal:** Move 下一題/跳過 buttons to a fixed right column to free up vertical space for the battle image

---

## 1. Problem

Currently `.battle-section` is a `flex-column`. The bottom `.answer-panel` contains:
- `answer-header` (vote counts, left + right)
- `answer-body` (answer text)
- `answer-footer` (跳過 + 下一題 buttons)

The buttons taking up space in the answer panel reduces vertical room for the battle image. On a desktop host screen with plenty of horizontal space, the buttons can live in a narrow right-side column instead.

---

## 2. New Layout

```
┌─────────────────────────────────────────┬──────────┐
│  battle-main (flex-column, flex: 1)     │ controls │
│                                         │          │
│  ┌─────────────────────────────────┐   │ [跳過]   │
│  │ battle-stage                    │   │          │
│  │  (battle-card or no-battle)     │   │ [下一題] │
│  └─────────────────────────────────┘   │          │
│                                         │          │
│  ┌─────────────────────────────────┐   │          │
│  │ answer-panel                    │   │          │
│  │  answer-header (votes, left)    │   │          │
│  │  answer-body (answer text)      │   │          │
│  └─────────────────────────────────┘   │          │
└─────────────────────────────────────────┴──────────┘
```

---

## 3. Template Changes

Wrap the existing `.battle-stage` + `.answer-panel` in a new `<div class="battle-main">`. Add a sibling `<div class="battle-controls">` containing the two buttons. Remove the `<div class="answer-footer">` from inside `.answer-panel`.

**Before (simplified):**
```html
<section class="section battle-section">
  <h3>開始battle</h3>
  <div class="battle-stage">...</div>
  <div class="answer-panel">
    <div class="answer-header">...</div>
    <div class="answer-body">...</div>
    <div class="answer-footer">
      <button class="skip-btn" ...>跳過</button>
      <button class="next-btn" ...>下一題</button>
    </div>
  </div>
</section>
```

**After:**
```html
<section class="section battle-section">
  <h3>開始battle</h3>
  <div class="battle-row">
    <div class="battle-main">
      <div class="battle-stage">...</div>
      <div class="answer-panel">
        <div class="answer-header">...</div>
        <div class="answer-body">...</div>
      </div>
    </div>
    <div class="battle-controls">
      <button class="skip-btn" @click="skipQuestion" :disabled="isNextDisabled">跳過</button>
      <button class="next-btn" @click="nextQuestion" :disabled="isNextDisabled">下一題</button>
    </div>
  </div>
</section>
```

---

## 4. CSS Changes

### New rules

```css
.battle-row {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  flex: 1;
  align-items: stretch;
}

.battle-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.battle-controls {
  width: 88px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  flex-shrink: 0;
}
```

### Modified rules

`.battle-section` — remove `flex-direction: column` (now handled by `.battle-row`):
```css
.battle-section {
  min-height: 720px;
  display: flex;
  flex-direction: column;  /* keeps h3 above battle-row */
}
```
*(No change needed here — the section is still a column; `battle-row` is the new row inside it.)*

`.battle-stage` — remove `flex: 1` (now `.battle-main` holds flex growth):
```css
.battle-stage {
  display: flex;
  align-items: stretch;
  margin-bottom: 1rem;
}
```

`.answer-panel` — no longer needs `min-height: 220px` or bottom padding for footer; remove `answer-footer`-related spacing:
```css
.answer-panel {
  margin-top: 0;           /* already handled by battle-stage margin-bottom */
  border-radius: 12px;
  background: var(--bg-surface);
  border: 1px solid rgba(25, 233, 255, 0.15);
  padding: 1rem;
  display: flex;
  flex-direction: column;
}
```

`.answer-header` — vote counts move to left-aligned:
```css
.answer-header {
  display: flex;
  justify-content: flex-start;
  gap: 2rem;
  margin-bottom: 1rem;
}
```

`.skip-btn` and `.next-btn` — change from wide horizontal buttons to square-ish vertical buttons:
```css
.skip-btn,
.next-btn {
  width: 100%;
  padding: 1rem 0.5rem;
  font-size: 0.85rem;
  text-align: center;
  letter-spacing: 0.04em;
}
```

### Removed rules

- `.answer-footer` — deleted (no longer in DOM)

---

## 5. Scope

- Desktop only — no mobile media query needed (battle screen is operated by the host on a desktop)
- Logic/reactivity: zero changes — `skipQuestion`, `nextQuestion`, `isNextDisabled` bindings are identical, just moved to new parent div
- No other component files touched

---

## 6. Files Changed

- **Modify:** `src/components/Dashboard/BattleSection.vue` — template restructure + CSS update
