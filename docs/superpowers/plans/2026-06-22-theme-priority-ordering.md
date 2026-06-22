# Theme Priority Ordering Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make index 0 of each player's theme array = highest-priority battle theme, so the first theme listed in `playersConfig.ts` is the one challenged first.

**Architecture:** Four targeted edits — two in `store.ts` (iteration direction for `peekActive()` and `selectableThemeKeys`), two in `PlayersSection.vue` (remove `.reverse()` calls). No structural changes, no new files.

**Tech Stack:** TypeScript, Vue 3, Pinia, Vite (no test framework — verify manually by inspecting player cards in the browser)

---

### Task 1: Fix `ThemeStack.peekActive()` and `selectableThemeKeys` in store.ts

**Files:**
- Modify: `src/pinia/store.ts:53-58` (peekActive), `src/pinia/store.ts:307-323` (selectableThemeKeys)

- [ ] **Step 1: Fix `peekActive()` to iterate forward from index 0**

In `src/pinia/store.ts`, replace the `peekActive()` method (currently lines 53–58):

```typescript
  peekActive(): ThemeData | undefined {
    for (let i = 0; i < this.items.length; i++) {
      if (!this.items[i].isConsumed && this.items[i].isActivated) return this.items[i]
    }
    return undefined
  }
```

- [ ] **Step 2: Fix `selectableThemeKeys` to iterate forward from index 0**

In `src/pinia/store.ts`, find the `selectableThemeKeys` computed (the inner loop over `player.themeStack.items`). Replace the backward loop:

```typescript
  const selectableThemeKeys = computed<Set<string>>(() => {
    const keys = new Set<string>()
    const challengerName = state.value.currentChallenger?.challenger.name ?? null
    for (const player of state.value.players) {
      if (player.eliminated) continue
      if (player.name === challengerName) continue
      const items = player.themeStack.items
      for (let i = 0; i < items.length; i++) {
        const t = items[i]
        if (!t.isConsumed && t.isActivated) {
          keys.add(`${player.name}:${t.name}`)
          break
        }
      }
    }
    return keys
  })
```

- [ ] **Step 3: Commit**

```bash
git add src/pinia/store.ts
git commit -m "fix: peekActive and selectableThemeKeys iterate forward so index 0 = highest priority"
```

---

### Task 2: Fix `topAvailableTheme()` and `secondaryThemes()` in PlayersSection.vue

**Files:**
- Modify: `src/components/Dashboard/PlayersSection.vue:321-330`

- [ ] **Step 1: Fix `topAvailableTheme()` — remove `.reverse()`**

In `src/components/Dashboard/PlayersSection.vue`, replace `topAvailableTheme`:

```typescript
function topAvailableTheme(player: any): any | null {
  return player.themeStack.items.find((t: any) => themeClass(t, player.name) === '') ?? null
}
```

- [ ] **Step 2: Fix `secondaryThemes()` — remove `.reverse()`**

In `src/components/Dashboard/PlayersSection.vue`, replace `secondaryThemes`:

```typescript
function secondaryThemes(player: any): any[] {
  const top = topAvailableTheme(player)
  return player.themeStack.items.filter((t: any) => t !== top)
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Dashboard/PlayersSection.vue
git commit -m "fix: topAvailableTheme and secondaryThemes use forward order so index 0 theme is primary"
```

---

### Task 3: Verify

**Files:** none

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Open the dashboard and check player cards**

For each player card, confirm that the theme shown under **決鬥主題** matches the **first** theme listed for that player in `src/config/playersConfig.ts` (index 0, e.g. 李長鴻 → `美國卡通`).

- [ ] **Step 3: Set a challenger and check selectability**

Set any player as the current challenger. Confirm that clicking another player's card highlights their **first** theme (index 0) as the battle target — not their last active theme.

- [ ] **Step 4: Simulate a battle result and check consumption**

Run a battle and declare a winner. Confirm that the **first** theme (index 0) of the loser is the one that turns grey (consumed), and that the remaining themes shift correctly.
