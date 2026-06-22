---
title: Theme Priority Ordering Fix
date: 2026-06-22
---

## Problem

`ThemeStack.peekActive()` and `selectableThemeKeys` iterate from the **last** array index backward, treating the highest-index active theme as "first priority." But `playersConfig.ts` lists themes with index 0 = highest priority (first to be played). This reversal means the wrong theme is shown as the primary battle target and consumed on battle loss.

Example — 李長鴻:
```
items[0] = '美國卡通'      ← user expects this to be #1 priority
items[1] = '單機遊戲'
items[2] = '希臘神話人物'  ← current code treats this as #1 priority
items[3] = '哲學家語錄'    (isActivated: false, locked)
```

## Settlement Rules (for reference)

- **A wins, B loses** → B's first-priority theme consumed; A's themes unchanged.
- **B wins, A loses** → B's first-priority theme consumed; A's first-priority theme transferred to B (pushed to end of B's stack as lowest-priority bonus life).

`processBattleResult` structure is already correct — it just feeds on the wrong theme once `peekActive()` is fixed.

## Fix — 4 changes, direction A

| File | Location | Change |
|------|----------|--------|
| `src/pinia/store.ts` | `ThemeStack.peekActive()` | Iterate forward from index 0 |
| `src/pinia/store.ts` | `selectableThemeKeys` computed | Iterate forward from index 0 |
| `src/components/Dashboard/PlayersSection.vue` | `topAvailableTheme()` | Remove `.reverse()` before `.find()` |
| `src/components/Dashboard/PlayersSection.vue` | `secondaryThemes()` | Remove `.reverse()` before `.filter()` |

No changes to `processBattleResult`, lives-dots rendering, or `playersConfig.ts`.

## Outcome

After fix: index 0 = highest priority. First theme in config = first battle theme = first dot consumed. `peekActive()` returns index 0's active theme, making settlement, UI display, and selectability all consistent.
