# Vote Page State Sync + Host Themes Display

**Date:** 2026-06-11  
**Status:** Approved

## Problem

The VoteView `玩家狀態` tab reads `gameStore.players` directly, which is initialized from local config and never updated by socket events. When players are eliminated, win streaks change, or themes are consumed on the dashboard, the vote page shows stale initial state. Refreshing the vote page resets everything to config defaults.

Additionally, host themes (`isConsumed` state) are not visible to vote-page users at all.

## Solution

Extend the existing `voteState` socket mechanism to carry lean player and host theme snapshots. No new socket event types needed.

---

## Architecture

### Data Flow

```
Dashboard (source of truth)
  │
  ├─ on battle start     → pushVoteState (with snapshot)
  ├─ on battleWinner set → pushVoteState (with snapshot)
  ├─ on endBattle        → pushVoteState (with snapshot)
  └─ on permanentlyRemovePlayer → pushVoteState (with snapshot)  ← NEW
         │
         ▼
    server.js stores voteState
         │
         ├─ broadcast to all other clients (socket.broadcast.emit)
         └─ replay to new connections (socket.emit on 'connection')
         │
         ▼
    App.vue listener → gameStore.applyVoteState()
         │
         ├─ currentBattle, voteResults, battleWinner, battleStartedAt (existing)
         ├─ playersSnapshot → rebuild players with new ThemeStack(themeItems)
         └─ hostThemesSnapshot → patch isConsumed only, keep photos/answers from config
```

### Lean Snapshot Shape

```ts
// Added to voteState on server
playersSnapshot: Array<{
  name: string
  eliminated: boolean
  winStreak: number
  prop: 'time' | 'shield' | null
  themeItems: Array<{ name: string; isConsumed: boolean; isActivated: boolean }>
}> | null   // null = game not started yet; vote page keeps local config state

hostThemesSnapshot: Array<{
  name: string
  isConsumed: boolean
}> | null
```

Intentionally excludes `photos` and `answers` — vote page does not render them, and keeping them out of the socket payload avoids ~20 KB of path strings per push.

### Payload Size

- Full player data (with photos): ~20 KB — excluded from snapshot
- Lean snapshot (5 players + host): **< 1 KB**
- Push frequency: event-driven, ~3–4 times per battle round (not periodic)
- Net impact on sync latency: negligible on LAN/local network

---

## Changes Required

### `server.js`

- Extend `voteState` initial value with `playersSnapshot: null` and `hostThemesSnapshot: null`
- `pushVoteState` handler already stores and rebroadcasts — no logic change needed, the new fields come in as part of the pushed object

### `DashboardView.vue`

- `pushVoteState()` helper: extend to include `playersSnapshot` (derived from `gameStore.players`) and `hostThemesSnapshot` (derived from `gameStore.hostThemes`)
- `permanentlyRemovePlayer()`: call `pushVoteState()` after mutation ← **new trigger**

### `pinia/store.ts` — `applyVoteState()`

- Accept two new optional fields: `playersSnapshot` and `hostThemesSnapshot`
- If `playersSnapshot` is present: update each player's `eliminated`, `winStreak`, `prop`, and rebuild `themeStack` as `new ThemeStack(themeItems)`
- If `hostThemesSnapshot` is present: patch each host theme's `isConsumed` by name; leave `photos` and `answers` untouched

### `VoteView.vue`

- Add floating host themes button (fixed, bottom-left)
- Button toggles a panel (bottom sheet style)
- Panel renders `gameStore.hostThemes` as theme pills using existing `.theme-pill` / `.theme-pill.consumed` styles

---

## UI Spec — Host Themes Panel

```
// HOST THEMES PANEL
// Mobile-first bottom sheet: slides up from bottom on open, fixed overlay
// Button: fixed bottom-left, small icon button (e.g. shield/star icon)
// Panel: full width, rounded top corners, max-height ~50vh, scrollable
// Theme pills: reuse .theme-pill and .theme-pill.consumed styles from existing VoteView
// Background overlay: semi-transparent, tap to close
// Panel visible on both tabs (投票 and 玩家狀態)
```

Panel content: title `主持人主題` + list of host theme pills. No challenger selector (dashboard-only feature).

---

## Out of Scope

- Prop sync during battle (mid-battle prop state not needed on vote page; `endBattle` push covers final state)
- Server-side persistence across restarts (not changed)
- Making `主持人` a voteable option
- Real-time timer sync to vote page
