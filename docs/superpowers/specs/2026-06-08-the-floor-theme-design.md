# The Floor Theme — Visual Redesign Spec

**Date:** 2026-06-08  
**Scope:** Full frontend visual redesign — LoginView, DashboardView, VoteView, App.vue, all Dashboard components  
**Theme:** The Floor 電視直播感，主色 #001741，輝光輔色 #19E9FF

---

## 1. Design Tokens

A single global CSS file (e.g. `src/assets/theme.css`) defines all tokens and is imported in `main.ts`.

```css
:root {
  /* Backgrounds */
  --bg:         #001741;
  --bg-panel:   #000d2b;
  --bg-surface: #021b4a;

  /* Glow accent */
  --glow:       #19E9FF;
  --glow-30:    rgba(25, 233, 255, 0.30);
  --glow-10:    rgba(25, 233, 255, 0.10);

  /* Typography */
  --text:       #e2f4f8;
  --text-muted: rgba(226, 244, 248, 0.50);

  /* Semantic */
  --danger:     #ff4655;
  --warn:       #f59e0b;
}
```

---

## 2. Typography

| Use | Font | Notes |
|-----|------|-------|
| Headings, buttons, timers, labels | **Chakra Petch** (Google Fonts) | Geometric, broadcast-panel feel; loaded via `<link>` in `index.html` |
| Chinese body / UI text | **Noto Sans TC** | Fallback in font stack after Chakra Petch |
| Button / tab text | Chakra Petch + `letter-spacing: 0.08em` + `text-transform: uppercase` | |

Font stack: `'Chakra Petch', 'Noto Sans TC', sans-serif`

---

## 3. Background

All pages share the same atmospheric background:

```css
body {
  background-color: var(--bg);
  background-image:
    radial-gradient(ellipse at 50% 0%, rgba(25, 233, 255, 0.06) 0%, transparent 65%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V18L28 2l28 16v32L28 66zm0 34L0 84V52l28 16 28-16v32L28 100z' fill='none' stroke='%2319E9FF' stroke-width='0.4' stroke-opacity='0.08'/%3E%3C/svg%3E");
}
```

The SVG encodes a repeating hexagonal grid (referencing The Floor's physical tiles) at 8% opacity — visible on dark backgrounds, disappears on bright displays. The radial gradient adds a subtle spotlight from the top center.

---

## 4. Component Specifications

### 4.1 App.vue — Navbar

- Background: `var(--bg-panel)`
- Bottom border: `1px solid var(--glow)` + `box-shadow: 0 1px 12px var(--glow-30)` (downward glow)
- "The Cat Floor" title: Chakra Petch, color `var(--glow)`, `text-shadow: 0 0 16px var(--glow-30)`
- Player name: `var(--text)`
- 「換個名字」button: outline style — `border: 1px solid var(--glow)`, color `var(--glow)`, transparent background; hover: background `var(--glow-10)`
- Main `<main>` area inherits body background

### 4.2 LoginView

- Full-viewport background inherits body (hex grid + radial glow from top)
- Login card: `background: var(--bg-panel)`, `border: 1px solid var(--glow)`, `box-shadow: 0 0 40px var(--glow-30)`, `border-radius: 12px`
- Title "The Cat Floor": Chakra Petch, `font-size: 2.5rem`, color `var(--glow)`, `text-shadow: 0 0 24px var(--glow-30)`
- Subtitle: `var(--text-muted)`
- Input: `background: var(--bg-surface)`, `border: 1px solid rgba(25,233,255,0.25)`, color `var(--text)`; focus: `border-color: var(--glow)`, `box-shadow: 0 0 0 3px var(--glow-10)`
- Submit button: `background: var(--glow)`, color `#000d2b` (black text on cyan), Chakra Petch, uppercase; disabled: `opacity: 0.35`
- Page load animation: card fades in + slides up 12px over 0.4s

### 4.3 DashboardView

- Page title: Chakra Petch, color `var(--text)`, no change to layout
- Tab buttons: default — `background: transparent`, color `var(--text-muted)`, no border; active — color `var(--glow)`, `border-bottom: 2px solid var(--glow)`, `text-shadow: 0 0 8px var(--glow-30)`; hover — color `var(--text)`
- Tournament winner banner: `background: var(--glow)`, color `#000d2b`
- `dashboard-content` sections inherit panel styling from child components

### 4.4 GetChallengerSection

- Section panel: `background: var(--bg-panel)`, `border: 1px solid var(--glow)`, `box-shadow: 0 0 20px var(--glow-10)`
- Wheel display area: `border: 1px dashed rgba(25,233,255,0.35)` (replaces current grey dashed)
- Player name chips: `background: var(--bg-surface)`, color `var(--glow)`, `border: 1px solid var(--glow-30)`, `border-radius: 20px`
- No-players text: `var(--text-muted)`
- 挑戰者 result box: `background: var(--bg-surface)`, `border: 1px solid var(--glow)`, `box-shadow: 0 0 12px var(--glow-30)`; text color `var(--glow)`
- 「開始抽籤」button: `background: var(--glow)`, color `#000d2b`
- 「開始下一輪」「移除陣亡者」buttons: outline style
- Modal overlay: `rgba(0, 0, 0, 0.75)`; modal content: `background: var(--bg-panel)`, `border: 1px solid var(--glow-30)`

### 4.5 BattleSection

- Section panel: `background: var(--bg-panel)`, `border: 1px solid var(--glow)`, `box-shadow: 0 0 20px var(--glow-10)`
- battle-card: `background: var(--bg-panel)`, remove white background
- battle-meta labels: `var(--text-muted)`
- VS text: Chakra Petch, color `var(--glow)`
- **Timer — inactive**: `background: var(--bg-surface)`, color `var(--text-muted)`, no glow
- **Timer — active**: `background: var(--glow-10)`, color `var(--glow)`, `box-shadow: 0 0 16px var(--glow)`, animation `glow-pulse 1s ease-in-out infinite`
- answer-panel: `background: var(--bg-surface)`, `border: 1px solid rgba(25,233,255,0.15)`
- answer-body (white box): `background: var(--bg-panel)`, text `var(--text)`
- answer-player names: `var(--text)`
- result-panel (winner): `background: var(--bg-surface)`, `border: 2px solid var(--glow)`, `box-shadow: 0 0 24px var(--glow-30)`
- winner-announcement: color `var(--glow)`, `text-shadow: 0 0 16px var(--glow-30)`
- 「結束對戰」button: outline style
- 「下一題」button: `background: var(--glow)`, color `#000d2b`
- 「跳過」button: `background: var(--warn)`, color `#000`

### 4.6 PlayersSection

- Section panel: `background: var(--bg-panel)`, `border: 1px solid var(--glow)`, `box-shadow: 0 0 20px var(--glow-10)`
- Player cards: `background: var(--bg-surface)`, `border: 1px solid var(--glow-30)`; hover: `border-color: var(--glow)`
- Player name (h4): `var(--text)`
- Meta text: `var(--text-muted)`
- Win-streak badge: `background: rgba(245,158,11,0.15)`, text `var(--warn)`
- Theme pills (active/selectable): `background: var(--glow-10)`, color `var(--glow)`, `border: 1px solid var(--glow-30)`; hover: `background: var(--glow-30)`
- Theme pills (consumed): `background: rgba(255,255,255,0.05)`, color `var(--text-muted)`
- Theme pills (temp-locked): `background: rgba(245,158,11,0.12)`, color `var(--warn)`, `cursor: not-allowed`
- Theme pills (revival-locked): same as consumed
- `.revival-btn`: `border: 1px solid var(--glow-30)`, color `var(--text-muted)`, transparent bg; hover: `border-color: var(--glow)`, color `var(--glow)`
- `.prop-btn`: `border: 2px solid var(--glow-30)`; hover: `border-color: var(--glow)`, `background: var(--glow-10)`
- `.status-indicator` (存活): `background: var(--glow-10)`, color `var(--glow)`, `border: 1px solid var(--glow-30)`
- `.status-indicator` (已淘汰): `background: rgba(255,70,85,0.1)`, color `var(--danger)`
- Eliminated card: `opacity: 0.5`, `border-color: var(--danger)`
- **`.host-fab`** (浮動按鈕): `background: var(--glow)`, color `#000d2b`, `box-shadow: 0 4px 16px var(--glow-30)`; hover: `background: #3df5ff`, `transform: translateY(-2px)`
- **`.host-panel`**: `background: var(--bg-panel)`, `border: 1px solid var(--glow-30)`, `box-shadow: 0 8px 30px rgba(0,0,0,0.4)`
- `.host-panel-header` border-bottom: `1px solid rgba(25,233,255,0.1)`
- `.host-panel-title`: color `var(--glow)`
- `.close-btn`: color `var(--text-muted)`; hover: color `var(--text)`
- `.panel-label`: color `var(--text-muted)`
- `.panel-select`: `background: var(--bg-surface)`, `border: 1px solid rgba(25,233,255,0.25)`, color `var(--text)`
- `.current-theme-hint`: color `var(--glow-30)` dimmed text
- **`.duel-btn`**: `background: var(--glow)`, color `#000d2b`; disabled: `opacity: 0.35`
- **Modal** (revival confirm): overlay `rgba(0,0,0,0.75)`; modal content `background: var(--bg-panel)`, `border: 1px solid var(--glow-30)`; h4 color `var(--text)`; p color `var(--text-muted)`
- `.cancel-btn`: `background: var(--bg-surface)`, color `var(--text-muted)`
- **`.confirm-btn`**: `background: var(--glow)`, color `#000d2b`

### 4.7 winStreakReward (DrawSection)

- Panel: same as other sections — `var(--bg-panel)` + `var(--glow)` border
- Select dropdown: `background: var(--bg-surface)`, `border: 1px solid rgba(25,233,255,0.25)`, color `var(--text)`
- Draw button: `background: var(--glow)`, color `#000d2b`
- Draw results: `var(--text-muted)` for old entries, `var(--text)` for latest

### 4.8 VoteView

- Tab navigation: `background: var(--bg-panel)`, `border: 1px solid rgba(25,233,255,0.15)`; active tab: color `var(--glow)`, `border-bottom: 2px solid var(--glow)`
- Section panels: `background: var(--bg-panel)`, `border: 1px solid var(--glow-30)`
- Section h3 underline: `border-bottom: 2px solid var(--glow)`
- **Vote buttons (兩個大按鈕)**: `background: var(--glow)`, color `#000d2b`, Chakra Petch, uppercase, `font-size: 1.1rem`; active: `scale(0.97)`
- Voted state: `background: var(--glow-10)`, `border: 2px solid var(--glow)`, color `var(--glow)` (outline, not fill — already voted, less dominant)
- Disabled vote buttons: `background: var(--bg-surface)`, `opacity: 0.4`
- 「暫無對決」placeholder: `background: var(--bg-surface)`, color `var(--text-muted)`
- 「投票成功」message: `background: var(--glow-10)`, color `var(--glow)`, `border: 1px solid var(--glow-30)`
- Vote result bar track: `background: var(--bg-surface)`
- Vote result bar fill: `background: var(--glow)`, `box-shadow: 0 0 8px var(--glow-30)`
- Voters list border: `border-left: 3px solid var(--glow)`
- Player cards: same as 4.6

---

## 5. Animation Keyframes

Defined in global `theme.css`:

```css
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 8px var(--glow); }
  50%       { box-shadow: 0 0 24px var(--glow), 0 0 40px var(--glow-30); }
}

@keyframes fade-slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

**Applied to:**
- `.login-card`: `animation: fade-slide-up 0.4s ease-out`
- `.timer.active`: `animation: glow-pulse 1s ease-in-out infinite`
- `.result-panel` (winner): `animation: fade-slide-up 0.3s ease-out`
---

## 6. Implementation Approach

1. **Create `src/assets/theme.css`** — CSS variables + `body` background + keyframe animations + Google Fonts `@import`
2. **Update `index.html`** — Add Google Fonts `<link>` for Chakra Petch + Noto Sans TC
3. **Update `src/main.ts`** — Import `./assets/theme.css`
4. **Update `src/App.vue`** — Navbar styles, remove `background-color: #f5f5f5` from `.app-container`
5. **Update `src/views/LoginView.vue`** — Full restyle
6. **Update `src/views/DashboardView.vue`** — Tab buttons, banner, section wrapper
7. **Update `src/components/Dashboard/GetChallengerSection.vue`** — Full restyle
8. **Update `src/components/Dashboard/BattleSection.vue`** — Full restyle including timer animation
9. **Update `src/components/Dashboard/PlayersSection.vue`** — Card + badge + pill styles
10. **Update `src/components/Dashboard/winStreakReward.vue`** — Panel + button + dropdown styles
11. **Update `src/views/VoteView.vue`** — Tab nav, vote buttons, bars, player cards

No structural (template/logic) changes — CSS only. Each file keeps its `<style scoped>`, values replaced to use CSS variables. The one exception: `index.html` gets `<link>` tags for Google Fonts (Chakra Petch + Noto Sans TC).
