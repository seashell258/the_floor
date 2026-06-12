# Winner Ceremony Design
**Date:** 2026-06-12

## Problem

The battle section currently shows a minimal `result-panel` (inline text + button) when a winner is decided. There is no dramatic reveal moment, and 2-win streaks are visually indistinguishable from regular wins. The ceremony feels low-stakes.

## Goal

Add a two-phase winner ceremony that:
1. Delivers a full-screen dramatic reveal when a winner is decided
2. Escalates significantly for 2-win streak moments (熱血格鬥 style)
3. Collapses back to the existing inline `result-panel` flow so host controls are unchanged

---

## Architecture

### New file: `src/components/Dashboard/WinnerCeremony.vue`

**Props:**
```ts
winner: string        // winner's display name
isStreak: boolean     // true when winner's winStreak >= 2 after this win
isHostBattle: boolean // when true, isStreak is always false
```

**Emits:** `dismissed` — fired when the ceremony finishes and the inline panel should appear

### Integration in BattleSection.vue

- A new reactive ref `showCeremony: boolean` controls ceremony visibility
- A new computed `ceremonyIsStreak` reads winner's updated `winStreak` from store (already incremented by `processBattleResult` before `battleWinner` is set)
- When `watch(battleWinner)` fires: set `showCeremony = true`
- The existing `result-panel` (`v-if="battleWinner && battleInfo"`) gains an additional condition: only renders after `showCeremony` becomes false (i.e. after `@dismissed`)
- `WinnerCeremony` is mounted inside the existing `<Teleport to="body">` block (or a new one — whichever is cleaner)

### State machine inside WinnerCeremony

```
mounted
  └─ isStreak?
       ├─ false → regular phase (2.5s auto-dismiss → emit dismissed)
       └─ true  → streak phase (manual dismiss → click anywhere → emit dismissed)
```

---

## Visual Design

### Regular win (cyan, 2.5s auto)

- Full-screen overlay: `rgba(0, 0, 0, 0.82)` backdrop
- Center layout:
  - Small `勝利` label fades in at t=0.1s
  - Winner's name blasts in: `scale(1.5) opacity(0) → scale(1) opacity(1)`, cyan text-shadow bloom, duration 0.35s
  - Shockwave ring: thin cyan circle expands `scale(0) → scale(4)`, fades out over 0.8s
  - 8–12 particle dots burst radially, drift downward, fade out
- At t=2.3s: overlay fades to transparent over 0.2s
- At t=2.5s: component emits `dismissed`

### 2-win streak (gold/fire, manual dismiss)

- Full-screen overlay, darker base
- Animated background: diagonal fire gradient cycling `#1a0000 → #3d1400 → #1a0000`, 3s loop
- Mount effect: screen shake — container translates ±4px rapidly for 0.4s
- `「二連勝!!」` stamp: enters at `scale(2.2) rotate(-4deg)` → `scale(1) rotate(0)`, color `#FFB800`, heavy orange drop-shadow, duration 0.4s
- Winner's name appears 0.15s after stamp, smaller, white
- 15–20 fire particles: small orange/gold dots floating upward with random horizontal drift, loop continuously while overlay is visible
- Dismiss: pulsing gold "點擊繼續" label at bottom; clicking anywhere on overlay fires `dismissed`

**Color palette additions (streak only):**
- `#FFB800` — gold (streak text)
- `#FF6B00` — fire orange (particles, shadow)

---

## Audio

### Regular win
`playWinnerSFX()` — unchanged, already called from `watch(battleWinner)` in BattleSection. No changes needed.

### 2-win streak
New `playStreakSFX()` exported from `useAudio.ts`. Called from WinnerCeremony on mount when `isStreak === true` (BattleSection should NOT call `playWinnerSFX` in this case — WinnerCeremony owns the audio for streak).

**Sound design:**
- t=0: low thud — sine sweep 120→40Hz, 0.11s, peak gain 0.32 (kick style)
- t=0.05s: tri-tone hit — sine partials at 220, 330, 440Hz, fast attack (0.01s), decay to silence by t=0.5s
- t=0.2s: upward sweep — sawtooth 300→900Hz, 0.3s duration, routed through a short reverb tail
- All nodes connect through existing `master()` gain (mute-compatible)
- Total natural decay ~1.5s, no manual stop needed

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/Dashboard/WinnerCeremony.vue` | **New** — full ceremony component |
| `src/components/Dashboard/BattleSection.vue` | Add `showCeremony` ref, `ceremonyIsStreak` computed, gate `result-panel` behind dismissed, import + render WinnerCeremony; in `watch(battleWinner)` call `playWinnerSFX()` only when `!ceremonyIsStreak` (streak audio is owned by WinnerCeremony) |
| `src/composables/useAudio.ts` | Add `playStreakSFX()` export |

---

## Out of Scope

- No changes to vote flow, continue-challenge dialog, or timer logic
- No changes to the store — `winStreak` already increments correctly before `battleWinner` is set
- No new routes or views
