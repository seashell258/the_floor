# Spec: BattleSection Vote Bar + Remove Heading

**Date:** 2026-06-09  
**File:** `src/components/Dashboard/BattleSection.vue`  
**Status:** Approved design, ready for implementation

---

## Overview

Two changes to `BattleSection.vue`:

1. **Delete `<h3>開始battle</h3>`** (line 3) — frees vertical space for the photo area.
2. **Add a `vote-bar` column** (leftmost) — moves vote counts out of `answer-panel` into a vertical bar visualization with animated fill heights.

No other files change.

---

## Layout Change

### Before (2-column)
```
[ battle-main (flex:1) ] [ battle-controls 88px ]
```

### After (3-column)
```
[ vote-bar ~80px ] [ battle-main (flex:1) ] [ battle-controls 88px ]
```

`.vote-bar` is a new sibling inserted as the **first child** of `.battle-row`, before `.battle-main`.

---

## Template Changes

### 1. Remove heading (line 3)
Delete:
```html
<h3>開始battle</h3>
```

### 2. Remove `.answer-header` from `answer-panel` (lines 50–59)
Delete the entire `.answer-header` div:
```html
<div class="answer-header">
  <div class="answer-side">
    <span class="answer-player">{{ voteResults?.player1 || 'Player 1' }}</span>
    <span class="answer-votes">{{ voteResults?.votes1 ?? 0 }} 票</span>
  </div>
  <div class="answer-side">
    <span class="answer-player">{{ voteResults?.player2 || 'Player 2' }}</span>
    <span class="answer-votes">{{ voteResults?.votes2 ?? 0 }} 票</span>
  </div>
</div>
```
Only `.answer-body` remains inside `.answer-panel`.

### 3. Add `.vote-bar` as first child of `.battle-row`
Insert before `.battle-main`:
```html
<div class="vote-bar">
  <!-- P1 sub-column -->
  <div class="vote-col">
    <span class="vote-count">{{ voteResults?.votes1 ?? 0 }}</span>
    <div class="vote-track">
      <div class="vote-fill p1-fill" :style="{ height: getVotePercent(1) + '%' }"></div>
    </div>
    <span class="vote-name">{{ voteResults?.player1 || 'P1' }}</span>
  </div>
  <!-- P2 sub-column -->
  <div class="vote-col">
    <span class="vote-count">{{ voteResults?.votes2 ?? 0 }}</span>
    <div class="vote-track">
      <div class="vote-fill p2-fill" :style="{ height: getVotePercent(2) + '%' }"></div>
    </div>
    <span class="vote-name">{{ voteResults?.player2 || 'P2' }}</span>
  </div>
</div>
```

---

## Script Change

Add `getVotePercent` function inside `<script setup>`, after the existing `computed` declarations:

```ts
function getVotePercent(playerNum: 1 | 2): number {
  const v1 = voteResults.value?.votes1 ?? 0
  const v2 = voteResults.value?.votes2 ?? 0
  const total = v1 + v2
  if (total === 0) return 0
  return playerNum === 1 ? (v1 / total) * 100 : (v2 / total) * 100
}
```

---

## CSS Changes

### Remove stale rules
Delete `.answer-header`, `.answer-side`, `.answer-player`, `.answer-votes` blocks (lines 336–358) — they only served the removed `.answer-header`.

### Add new rules

```css
.vote-bar {
  width: 80px;
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: stretch;
}

.vote-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.vote-count {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.9rem;
  font-weight: bold;
  color: var(--text);
  line-height: 1;
}

.vote-track {
  flex: 1;
  width: 100%;
  background: var(--bg-surface);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.vote-fill {
  width: 100%;
  border-radius: 4px;
  transition: height 0.4s ease;
}

.p1-fill {
  background: var(--glow);
  box-shadow: 0 0 8px var(--glow-30);
}

.p2-fill {
  background: var(--warn);
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.3);
}

.vote-name {
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
  font-size: 0.7rem;
  color: var(--text-muted);
  writing-mode: vertical-rl;
  text-orientation: mixed;
  line-height: 1;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

### Update `.answer-panel`
Remove `flex-direction: column` dependency on `.answer-header` — the panel now only contains `.answer-body`, so no layout change needed there. `.answer-panel` CSS stays as-is.

### Update `.section h3` rule
The `h3` rule (`.section h3 { margin: 0 0 1rem 0; ... }`) can be deleted since the heading is removed. Or leave it — it's harmless. **Prefer deleting** to keep CSS clean.

---

## Visual Behavior

- When no votes exist (`total === 0`): both fills render at `height: 0%` — empty tracks.
- As votes come in: fills animate smoothly upward via `transition: height 0.4s ease`.
- P1 (left col) is cyan (`--glow`), P2 (right col) is amber (`--warn`).
- Player names render vertically at the base of each column.

---

## Acceptance Criteria

- [ ] `<h3>開始battle</h3>` is gone from the template
- [ ] `.answer-header` div is gone from the template
- [ ] `.vote-bar` appears as the leftmost column in `.battle-row`
- [ ] P1 and P2 vote counts display above their respective tracks
- [ ] Player names display vertically below their tracks
- [ ] Fill heights update reactively when `voteResults` changes
- [ ] P1 fill is cyan with glow, P2 fill is amber with glow
- [ ] Fill transition is 0.4s ease
- [ ] No TypeScript errors
- [ ] Removed CSS rules (`.answer-header`, `.answer-side`, `.answer-player`, `.answer-votes`, `.section h3`) are deleted
