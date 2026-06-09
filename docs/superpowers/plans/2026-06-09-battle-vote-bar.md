# Battle Vote Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the text-only vote count header in BattleSection with an animated vertical bar visualization, and remove the redundant `<h3>` heading.

**Architecture:** Single-file change to `BattleSection.vue` — delete the `<h3>` heading, remove the `.answer-header` div (vote text) from `answer-panel`, insert a new `.vote-bar` column as the leftmost sibling in `.battle-row`, add a `getVotePercent()` helper to `<script setup>`, and update CSS accordingly.

**Tech Stack:** Vue 3 (script setup, computed refs), TypeScript, scoped CSS with CSS custom properties.

**Spec:** `docs/superpowers/specs/2026-06-09-battle-vote-bar.md`

---

## File Map

| File | Change |
|------|--------|
| `src/components/Dashboard/BattleSection.vue` | All changes — template, script, CSS |

---

### Task 1: Add `getVotePercent` to script

**Files:**
- Modify: `src/components/Dashboard/BattleSection.vue` (after line 99, in `<script setup>`)

- [ ] **Step 1: Add the helper function**

In `src/components/Dashboard/BattleSection.vue`, add this function after the `const battleWinner` computed (line 99), before `const currentPhotoIndex`:

```ts
function getVotePercent(playerNum: 1 | 2): number {
  const v1 = voteResults.value?.votes1 ?? 0
  const v2 = voteResults.value?.votes2 ?? 0
  const total = v1 + v2
  if (total === 0) return 0
  return playerNum === 1 ? (v1 / total) * 100 : (v2 / total) * 100
}
```

- [ ] **Step 2: Type-check**

```bash
cd /app && npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Dashboard/BattleSection.vue
git commit -m "feat: add getVotePercent helper to BattleSection"
```

---

### Task 2: Template — remove heading and answer-header

**Files:**
- Modify: `src/components/Dashboard/BattleSection.vue` (template section)

- [ ] **Step 1: Delete the `<h3>` heading**

Remove line 3 from the template:
```html
<h3>開始battle</h3>
```

The `<section>` tag should now be immediately followed by `<div class="battle-row">` with only a blank line between (or no blank line — either is fine).

- [ ] **Step 2: Delete `.answer-header` div**

Remove the entire `.answer-header` block from inside `.answer-panel` (currently lines 50–59):
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

`.answer-panel` should now only contain `.answer-body`.

- [ ] **Step 3: Type-check**

```bash
cd /app && npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Dashboard/BattleSection.vue
git commit -m "feat: remove heading and answer-header from BattleSection template"
```

---

### Task 3: Template — add `.vote-bar` column

**Files:**
- Modify: `src/components/Dashboard/BattleSection.vue` (template section)

- [ ] **Step 1: Insert `.vote-bar` as the first child of `.battle-row`**

In the template, `.battle-row` currently opens directly into `.battle-main`. Insert the following as the very first child of `<div class="battle-row">`, before `<div class="battle-main">`:

```html
<div class="vote-bar">
  <div class="vote-col">
    <span class="vote-count">{{ voteResults?.votes1 ?? 0 }}</span>
    <div class="vote-track">
      <div class="vote-fill p1-fill" :style="{ height: getVotePercent(1) + '%' }"></div>
    </div>
    <span class="vote-name">{{ voteResults?.player1 || 'P1' }}</span>
  </div>
  <div class="vote-col">
    <span class="vote-count">{{ voteResults?.votes2 ?? 0 }}</span>
    <div class="vote-track">
      <div class="vote-fill p2-fill" :style="{ height: getVotePercent(2) + '%' }"></div>
    </div>
    <span class="vote-name">{{ voteResults?.player2 || 'P2' }}</span>
  </div>
</div>
```

- [ ] **Step 2: Type-check**

```bash
cd /app && npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Dashboard/BattleSection.vue
git commit -m "feat: add vote-bar column to BattleSection template"
```

---

### Task 4: CSS — remove stale rules, add vote-bar rules

**Files:**
- Modify: `src/components/Dashboard/BattleSection.vue` (`<style scoped>` section)

- [ ] **Step 1: Delete stale CSS rules**

Remove the following rule blocks from `<style scoped>` (they served only the deleted `.answer-header`):

- `.section h3 { ... }` (the block starting at `margin: 0 0 1rem 0`)
- `.answer-header { ... }`
- `.answer-side { ... }`
- `.answer-player { ... }`
- `.answer-votes { ... }`

- [ ] **Step 2: Add vote-bar CSS rules**

Append the following rules to `<style scoped>` (before the closing `</style>` tag):

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

- [ ] **Step 3: Type-check**

```bash
cd /app && npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Dashboard/BattleSection.vue
git commit -m "feat: add vote-bar CSS, remove stale heading/answer-header styles"
```

---

### Task 5: Visual verification

- [ ] **Step 1: Start dev server**

```bash
cd /app && npm run dev
```

- [ ] **Step 2: Open the dashboard in a browser**

Navigate to `http://localhost:5173` (or whichever port Vite reports). Log in and open the Battle section.

- [ ] **Step 3: Verify acceptance criteria**

Check each item:
- `<h3>開始battle</h3>` is gone — no heading above the battle area
- Three-column layout: vote bar on the left, battle stage in the center, buttons on the right
- Vote bar shows two sub-columns with vote count numbers at the top
- Player names render vertically at the base of each column
- Tracks are dark (`--bg-surface`) when votes are zero; fills are zero height
- Start a battle to populate player names; confirm the names appear in the vote columns
- P1 column fill is cyan with glow; P2 column fill is amber with glow
- Simulating vote changes: confirm fills animate smoothly upward

- [ ] **Step 4: Commit if any fix-up tweaks were needed**

```bash
git add src/components/Dashboard/BattleSection.vue
git commit -m "fix: adjust vote-bar visual tweaks after verification"
```

Only commit if there were actual changes. Skip if Task 4 commit already captured everything.
