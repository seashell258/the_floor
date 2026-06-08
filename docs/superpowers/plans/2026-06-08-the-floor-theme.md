# The Floor Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the "The Floor" dark TV-broadcast theme (#001741 navy + glowing #19E9FF cyan) across all views and components — pure CSS changes, no template or logic modifications.

**Architecture:** Create a single `src/assets/theme.css` with CSS custom properties, keyframe animations, and body background. Import it globally via `main.ts`. Each Vue component's `<style scoped>` is rewritten to use those variables.

**Tech Stack:** Vue 3, Vite, CSS custom properties, Google Fonts (Chakra Petch + Noto Sans TC)

---

## File Map

| Action | File |
|--------|------|
| **Create** | `src/assets/theme.css` |
| **Modify** | `index.html` |
| **Modify** | `src/main.ts` |
| **Modify** | `src/App.vue` |
| **Modify** | `src/views/LoginView.vue` |
| **Modify** | `src/views/DashboardView.vue` |
| **Modify** | `src/components/Dashboard/GetChallengerSection.vue` |
| **Modify** | `src/components/Dashboard/BattleSection.vue` |
| **Modify** | `src/components/Dashboard/PlayersSection.vue` |
| **Modify** | `src/components/Dashboard/winStreakReward.vue` |
| **Modify** | `src/views/VoteView.vue` |

---

## Task 1: Global theme foundation

**Files:**
- Create: `src/assets/theme.css`
- Modify: `src/main.ts`

- [ ] **Step 1: Create `src/assets/theme.css`**

```css
:root {
  --bg:         #001741;
  --bg-panel:   #000d2b;
  --bg-surface: #021b4a;
  --glow:       #19E9FF;
  --glow-30:    rgba(25, 233, 255, 0.30);
  --glow-10:    rgba(25, 233, 255, 0.10);
  --text:       #e2f4f8;
  --text-muted: rgba(226, 244, 248, 0.50);
  --danger:     #ff4655;
  --warn:       #f59e0b;
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 8px var(--glow); }
  50%       { box-shadow: 0 0 24px var(--glow), 0 0 40px var(--glow-30); }
}

@keyframes fade-slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
  background-color: var(--bg);
  background-image:
    radial-gradient(ellipse at 50% -20%, rgba(25, 233, 255, 0.10) 0%, transparent 55%),
    radial-gradient(circle, rgba(25, 233, 255, 0.12) 1px, transparent 1px),
    radial-gradient(circle, rgba(25, 233, 255, 0.12) 1px, transparent 1px);
  background-size: 100% 100%, 28px 48px, 28px 48px;
  background-position: 0 0, 0 0, 14px 24px;
  background-attachment: fixed;
  color: var(--text);
  min-height: 100vh;
}
```

- [ ] **Step 2: Add Google Fonts import to top of `src/assets/theme.css`**

Add this as the very first line of `theme.css` (before `:root`):

```css
@import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&family=Noto+Sans+TC:wght@400;700&display=swap');
```

- [ ] **Step 3: Import theme.css in `src/main.ts`**

Find the existing imports in `main.ts` and add the theme import. It must come **before** any component styles so variables are defined first:

```ts
import './assets/theme.css'
```

Add it as the first import in the file (before `./assets/main.css` if that exists, or before the Vue/App imports).

- [ ] **Step 4: Commit**

```bash
git add src/assets/theme.css src/main.ts
git commit -m "feat: add The Floor theme tokens, hex grid background, and keyframe animations"
```

---

## Task 2: Navbar — App.vue

**Files:**
- Modify: `src/App.vue` — `<style scoped>` section only

- [ ] **Step 1: Replace the entire `<style scoped>` block in `src/App.vue`**

The template and script stay unchanged. Replace everything between `<style scoped>` and `</style>` with:

```css
.app-container {
  min-height: 100vh;
}

.navbar {
  background-color: var(--bg-panel);
  color: var(--text);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--glow);
  box-shadow: 0 1px 16px var(--glow-30);
  gap: 2rem;
}

.navbar h1 {
  margin: 0;
  font-size: 1.5rem;
  white-space: nowrap;
  color: var(--glow);
  text-shadow: 0 0 16px var(--glow-30);
  font-family: 'Chakra Petch', sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: auto;
}

.user-name {
  font-weight: bold;
  white-space: nowrap;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text);
}

.logout-btn {
  padding: 0.5rem 1rem;
  background-color: transparent;
  color: var(--glow);
  border: 1px solid var(--glow);
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-family: 'Chakra Petch', sans-serif;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.logout-btn:hover {
  background-color: var(--glow-10);
}

main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .navbar {
    padding: 1rem;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .navbar h1 {
    font-size: 1.2rem;
    width: 100%;
  }
  .nav-user {
    width: 100%;
  }
  .logout-btn {
    padding: 0.5rem 0.8rem;
    font-size: 0.9rem;
  }
  main {
    padding: 1rem;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/App.vue
git commit -m "feat: apply Floor theme to navbar"
```

---

## Task 3: Login page

**Files:**
- Modify: `src/views/LoginView.vue` — `<style scoped>` only

- [ ] **Step 1: Replace the entire `<style scoped>` block in `src/views/LoginView.vue`**

```css
.login-page {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
}

.login-card {
  background: var(--bg-panel);
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid var(--glow);
  box-shadow: 0 0 40px var(--glow-30);
  width: 90%;
  max-width: 400px;
  text-align: center;
  animation: fade-slide-up 0.4s ease-out;
}

h1 {
  margin: 0 0 0.5rem 0;
  color: var(--glow);
  font-size: 2rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 0 24px var(--glow-30);
}

.subtitle {
  margin: 0 0 2rem 0;
  color: var(--text-muted);
  font-size: 1rem;
}

.input-group {
  margin-bottom: 2rem;
}

.name-input {
  width: 100%;
  padding: 1rem;
  background: var(--bg-surface);
  border: 1px solid rgba(25, 233, 255, 0.25);
  border-radius: 8px;
  font-size: 1rem;
  color: var(--text);
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
  box-sizing: border-box;
  transition: all 0.3s;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.name-input:focus {
  outline: none;
  border-color: var(--glow);
  box-shadow: 0 0 0 3px var(--glow-10);
}

.name-input::placeholder {
  color: var(--text-muted);
}

.login-btn {
  width: 100%;
  padding: 1rem;
  background: var(--glow);
  color: #000d2b;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 700;
  font-family: 'Chakra Petch', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.2s;
  touch-action: manipulation;
}

.login-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.login-btn:hover:not(:disabled) {
  background: #3df5ff;
}

.login-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

@media (min-width: 768px) {
  .login-card {
    padding: 3rem;
  }
  h1 {
    font-size: 2.5rem;
  }
  .login-btn {
    padding: 1.2rem;
    font-size: 1.1rem;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/views/LoginView.vue
git commit -m "feat: apply Floor theme to login page"
```

---

## Task 4: Dashboard tabs and banner

**Files:**
- Modify: `src/views/DashboardView.vue` — `<style scoped>` only

- [ ] **Step 1: Replace the entire `<style scoped>` block in `src/views/DashboardView.vue`**

```css
.dashboard {
  width: 100%;
}

h2 {
  margin-bottom: 2rem;
  color: var(--text);
  font-family: 'Chakra Petch', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.dashboard-header {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  border-bottom: 1px solid rgba(25, 233, 255, 0.15);
  padding-bottom: 0.75rem;
}

.dashboard-header button {
  padding: 0.9rem 1.2rem;
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-family: 'Chakra Petch', sans-serif;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.9rem;
  transition: color 0.2s, border-color 0.2s;
}

.dashboard-header button.active,
.dashboard-header button:hover {
  color: var(--glow);
  border-bottom-color: var(--glow);
  background: transparent;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.tournament-winner-banner {
  background: var(--glow);
  color: #000d2b;
  text-align: center;
  padding: 1rem;
  font-size: 1.5rem;
  font-weight: bold;
  font-family: 'Chakra Petch', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-radius: 8px;
  margin-bottom: 1rem;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/views/DashboardView.vue
git commit -m "feat: apply Floor theme to dashboard tabs and winner banner"
```

---

## Task 5: GetChallengerSection

**Files:**
- Modify: `src/components/Dashboard/GetChallengerSection.vue` — `<style scoped>` only

- [ ] **Step 1: Replace the entire `<style scoped>` block in `src/components/Dashboard/GetChallengerSection.vue`**

```css
.section {
  background: var(--bg-panel);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--glow);
  box-shadow: 0 0 20px var(--glow-10);
}

.section h3 {
  margin: 0 0 0 0;
  color: var(--text);
  font-family: 'Chakra Petch', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 1rem;
}

.wheel-inner {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1rem;
}

.wheel-controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.wheel-btn {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Chakra Petch', sans-serif;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.wheel-btn:first-child {
  background: var(--glow);
  color: #000d2b;
  border: none;
}

.wheel-btn:first-child:hover:not(:disabled) {
  background: #3df5ff;
}

.wheel-btn:not(:first-child) {
  background: transparent;
  color: var(--glow);
  border: 1px solid var(--glow);
}

.wheel-btn:not(:first-child):hover:not(:disabled) {
  background: var(--glow-10);
}

.wheel-btn:disabled {
  background: var(--bg-surface);
  color: var(--text-muted);
  border-color: transparent;
  cursor: not-allowed;
}

.wheel-display {
  min-height: 200px;
  border: 1px dashed rgba(25, 233, 255, 0.35);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-players {
  text-align: center;
  color: var(--text-muted);
}

.wheel-players {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
}

.wheel-player {
  background: var(--bg-surface);
  border: 1px solid var(--glow-30);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: bold;
  color: var(--glow);
  font-family: 'Chakra Petch', sans-serif;
}

.drawn-result {
  text-align: center;
  padding: 1rem;
  background: var(--bg-surface);
  border-radius: 8px;
  border: 1px solid var(--glow);
  box-shadow: 0 0 12px var(--glow-30);
}

.drawn-result p {
  margin: 0;
  font-size: 1.2rem;
  color: var(--glow);
  font-family: 'Chakra Petch', sans-serif;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-panel);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--glow-30);
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.modal-content h4 {
  margin: 0 0 1rem 0;
  color: var(--text);
  font-family: 'Chakra Petch', sans-serif;
}

.player-list-modal {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.player-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid rgba(25, 233, 255, 0.1);
  color: var(--text);
}

.player-item:last-child {
  border-bottom: none;
}

.remove-btn {
  padding: 0.25rem 0.5rem;
  background: var(--danger);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.remove-btn:hover {
  opacity: 0.85;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  background: var(--bg-surface);
  color: var(--text-muted);
  border: 1px solid rgba(25, 233, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Chakra Petch', sans-serif;
  transition: color 0.15s;
}

.cancel-btn:hover {
  color: var(--text);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Dashboard/GetChallengerSection.vue
git commit -m "feat: apply Floor theme to GetChallengerSection"
```

---

## Task 6: BattleSection with timer animation

**Files:**
- Modify: `src/components/Dashboard/BattleSection.vue` — `<style scoped>` only

- [ ] **Step 1: Replace the entire `<style scoped>` block in `src/components/Dashboard/BattleSection.vue`**

Note: `.timer.active` uses the `glow-pulse` keyframe defined in `theme.css`. The `fade-slide-up` animation on `.result-panel` is also from `theme.css`.

```css
.section {
  background: var(--bg-panel);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--glow);
  box-shadow: 0 0 20px var(--glow-10);
}

.section h3 {
  margin: 0 0 1rem 0;
  color: var(--text);
  font-family: 'Chakra Petch', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.battle-section {
  min-height: 720px;
  display: flex;
  flex-direction: column;
}

.battle-stage {
  flex: 1;
  display: flex;
  align-items: stretch;
}

.battle-card,
.no-battle.large {
  width: 100%;
  border-radius: 12px;
  background: var(--bg-panel);
  border: 1px solid var(--glow-30);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.battle-card {
  overflow: hidden;
}

.battle-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.battle-meta > div {
  flex: 1 1 0;
  min-width: 0;
}

.theme-meta {
  text-align: center;
}

.battle-meta .label {
  display: block;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-family: 'Chakra Petch', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.battle-meta strong {
  color: var(--text);
  font-family: 'Chakra Petch', sans-serif;
}

.theme-meta strong {
  color: var(--glow);
}

.timer {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: var(--bg-surface);
  border-radius: 8px;
  font-weight: bold;
  color: var(--text-muted);
  text-align: center;
  font-family: 'Chakra Petch', sans-serif;
  font-size: 1.4rem;
  transition: all 0.3s ease;
}

.timer.active {
  background: var(--glow-10);
  color: var(--glow);
  box-shadow: 0 0 16px var(--glow);
  animation: glow-pulse 1s ease-in-out infinite;
}

.battle-image {
  width: 80%;
  max-height: 470px;
  object-fit: cover;
  border-radius: 12px;
  margin: 0 auto 1rem;
  display: block;
}

.answer-panel {
  margin-top: 1.5rem;
  border-radius: 12px;
  background: var(--bg-surface);
  border: 1px solid rgba(25, 233, 255, 0.15);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  min-height: 220px;
}

.answer-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.answer-side {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.answer-side.right {
  align-items: flex-end;
}

.answer-player {
  font-weight: bold;
  color: var(--text);
  font-family: 'Chakra Petch', sans-serif;
}

.answer-votes {
  font-size: 0.95rem;
  color: var(--text-muted);
}

.answer-body {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  min-height: 48px;
  background: var(--bg-panel);
  border-radius: 10px;
  color: var(--text);
  text-align: center;
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
}

.answer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.skip-btn {
  padding: 0.8rem 1.2rem;
  background: var(--warn);
  color: #000;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-family: 'Chakra Petch', sans-serif;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.skip-btn:disabled {
  background: var(--bg-surface);
  color: var(--text-muted);
  cursor: not-allowed;
}

.skip-btn:hover:not(:disabled) {
  opacity: 0.85;
}

.next-btn {
  padding: 0.8rem 1.2rem;
  background: var(--glow);
  color: #000d2b;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-family: 'Chakra Petch', sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.next-btn:disabled {
  background: var(--bg-surface);
  color: var(--text-muted);
  cursor: not-allowed;
}

.next-btn:hover:not(:disabled) {
  background: #3df5ff;
}

.no-battle.large {
  min-height: 100%;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-muted);
}

.result-panel {
  margin-top: 1rem;
  padding: 1.2rem;
  background: var(--bg-surface);
  border: 2px solid var(--glow);
  border-radius: 12px;
  box-shadow: 0 0 24px var(--glow-30);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
  animation: fade-slide-up 0.3s ease-out;
}

.winner-announcement {
  font-size: 1.4rem;
  font-weight: bold;
  color: var(--glow);
  text-shadow: 0 0 16px var(--glow-30);
  font-family: 'Chakra Petch', sans-serif;
  text-transform: uppercase;
}

.result-detail {
  font-size: 0.95rem;
  color: var(--text-muted);
}

.loser-name {
  font-weight: 600;
  color: var(--text);
}

.end-battle-btn {
  padding: 0.7rem 1.8rem;
  background: transparent;
  color: var(--glow);
  border: 1px solid var(--glow);
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  transition: background 0.2s;
}

.end-battle-btn:hover {
  background: var(--glow-10);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Dashboard/BattleSection.vue
git commit -m "feat: apply Floor theme to BattleSection with glowing timer animation"
```

---

## Task 7: PlayersSection (most complex — FAB, host panel, modals)

**Files:**
- Modify: `src/components/Dashboard/PlayersSection.vue` — `<style scoped>` only

- [ ] **Step 1: Replace the entire `<style scoped>` block in `src/components/Dashboard/PlayersSection.vue`**

```css
.section {
  background: var(--bg-panel);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--glow);
  box-shadow: 0 0 20px var(--glow-10);
}

.section h3 {
  margin: 0 0 1rem 0;
  color: var(--text);
  font-family: 'Chakra Petch', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.player-list {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1rem;
}

.player-card {
  padding: 1rem;
  background-color: var(--bg-surface);
  border-radius: 14px;
  border: 1px solid var(--glow-30);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.player-card:hover {
  transform: translateY(-2px);
  border-color: var(--glow);
}

.player-card.eliminated {
  opacity: 0.5;
  border-color: var(--danger);
}

.player-card-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.player-card-header h4 {
  margin: 0 0 0.35rem 0;
  color: var(--text);
  font-size: 1.15rem;
  font-family: 'Chakra Petch', sans-serif;
}

.player-meta {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.player-badge {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 0.55rem 0.85rem;
  background: rgba(245, 158, 11, 0.15);
  border-radius: 999px;
}

.player-badge span {
  color: var(--warn);
  font-size: 0.8rem;
  font-family: 'Chakra Petch', sans-serif;
}

.player-badge strong {
  color: var(--warn);
  font-size: 1rem;
  font-family: 'Chakra Petch', sans-serif;
}

.theme-list {
  display: grid;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.theme-pill {
  padding: 0.75rem 0.9rem;
  border-radius: 999px;
  background: var(--glow-10);
  color: var(--glow);
  border: 1px solid var(--glow-30);
  font-weight: 700;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
}

.theme-pill:hover {
  transform: translateY(-1px);
  background: var(--glow-30);
}

.theme-pill.consumed {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  border-color: transparent;
  cursor: default;
}

.theme-pill.consumed:hover {
  transform: none;
  background: rgba(255, 255, 255, 0.05);
}

.theme-name {
  flex: 1;
  text-align: center;
}

.theme-pill.temp-locked {
  background: rgba(245, 158, 11, 0.12);
  color: var(--warn);
  border-color: rgba(245, 158, 11, 0.3);
  cursor: not-allowed;
  opacity: 0.75;
}

.theme-pill.temp-locked:hover {
  transform: none;
  background: rgba(245, 158, 11, 0.12);
}

.theme-pill.revival-locked {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  border-color: transparent;
  cursor: not-allowed;
}

.theme-pill.revival-locked:hover {
  transform: none;
  background: rgba(255, 255, 255, 0.05);
}

.revival-btn {
  background: none;
  border: 1px solid var(--glow-30);
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.1rem 0.3rem;
  flex-shrink: 0;
  line-height: 1;
  color: var(--text-muted);
  transition: border-color 0.15s, color 0.15s;
}

.revival-btn:hover {
  border-color: var(--glow);
  color: var(--glow);
}

.prop-area {
  margin-bottom: 0.75rem;
  display: flex;
  gap: 0.5rem;
}

.prop-btn {
  font-size: 1.5rem;
  background: none;
  border: 2px solid var(--glow-30);
  border-radius: 8px;
  padding: 0.25rem 0.6rem;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  line-height: 1;
}

.prop-btn:hover {
  border-color: var(--glow);
  background: var(--glow-10);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal-content {
  background: var(--bg-panel);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--glow-30);
  max-width: 360px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.modal-content h4 {
  margin: 0 0 0.75rem 0;
  color: var(--text);
  font-family: 'Chakra Petch', sans-serif;
}

.modal-content p {
  margin: 0 0 1.25rem 0;
  color: var(--text-muted);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  background: var(--bg-surface);
  color: var(--text-muted);
  border: 1px solid rgba(25, 233, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Chakra Petch', sans-serif;
  transition: color 0.15s;
}

.cancel-btn:hover {
  color: var(--text);
}

.confirm-btn {
  padding: 0.5rem 1rem;
  background: var(--glow);
  color: #000d2b;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Chakra Petch', sans-serif;
  font-weight: 700;
}

.confirm-btn:hover {
  background: #3df5ff;
}

.status-indicator {
  display: inline-block;
  padding: 0.35rem 0.7rem;
  background: rgba(255, 255, 255, 0.05);
  color: var(--danger);
  border-radius: 5px;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: 'Chakra Petch', sans-serif;
}

.status-indicator.active {
  background: var(--glow-10);
  color: var(--glow);
  border: 1px solid var(--glow-30);
}

.host-fab {
  position: fixed;
  bottom: 1.5rem;
  left: 1.5rem;
  z-index: 100;
  padding: 0.6rem 1.1rem;
  background: var(--glow);
  color: #000d2b;
  border-radius: 999px;
  font-weight: 700;
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 0 4px 16px var(--glow-30);
  transition: background 0.2s, transform 0.15s;
  user-select: none;
}

.host-fab:hover {
  background: #3df5ff;
  transform: translateY(-2px);
}

.host-panel {
  position: fixed;
  bottom: 1.5rem;
  left: 1.5rem;
  width: min(340px, calc(100% - 2.5rem));
  background: var(--bg-panel);
  border: 1px solid var(--glow-30);
  border-radius: 14px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  z-index: 10;
}

.host-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid rgba(25, 233, 255, 0.1);
}

.host-panel-title {
  font-weight: 700;
  color: var(--glow);
  font-size: 0.95rem;
  font-family: 'Chakra Petch', sans-serif;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1rem;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  transition: color 0.15s;
}

.close-btn:hover {
  color: var(--text);
}

.host-panel-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.panel-row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.panel-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-family: 'Chakra Petch', sans-serif;
}

.panel-select {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid rgba(25, 233, 255, 0.25);
  border-radius: 8px;
  font-size: 0.95rem;
  color: var(--text);
  background: var(--bg-surface);
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
}

.current-theme-hint {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.duel-btn {
  width: 100%;
  padding: 0.75rem;
  background: var(--glow);
  color: #000d2b;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.95rem;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  transition: background 0.2s;
}

.duel-btn:hover:not(:disabled) {
  background: #3df5ff;
}

.duel-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

@media (min-width: 768px) {
  .player-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .player-list {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Dashboard/PlayersSection.vue
git commit -m "feat: apply Floor theme to PlayersSection including FAB and host panel"
```

---

## Task 8: winStreakReward (DrawSection)

**Files:**
- Modify: `src/components/Dashboard/winStreakReward.vue` — `<style scoped>` only

- [ ] **Step 1: Replace the entire `<style scoped>` block in `src/components/Dashboard/winStreakReward.vue`**

```css
.section {
  background: var(--bg-panel);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--glow);
  box-shadow: 0 0 20px var(--glow-10);
}

.section h3 {
  margin: 0 0 1rem 0;
  color: var(--text);
  font-family: 'Chakra Petch', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.draw-inner {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.label {
  font-weight: bold;
  color: var(--text-muted);
  font-family: 'Chakra Petch', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 0.85rem;
}

.player-select {
  width: 100%;
  padding: 0.95rem 1rem;
  border: 1px solid rgba(25, 233, 255, 0.25);
  border-radius: 8px;
  font-size: 1rem;
  color: var(--text);
  background: var(--bg-surface);
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
}

.draw-btn {
  margin: 1rem 0;
  padding: 0.75rem 1rem;
  width: 100%;
  background: var(--glow);
  color: #000d2b;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-family: 'Chakra Petch', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  transition: background 0.2s;
}

.draw-btn:hover {
  background: #3df5ff;
}

.draw-result {
  padding: 1rem;
  background: var(--bg-surface);
  border-radius: 8px;
  border: 1px solid var(--glow-30);
  color: var(--text);
}

.draw-result strong {
  color: var(--glow);
}

.no-result {
  padding: 1rem;
  background: var(--bg-surface);
  border-radius: 4px;
  text-align: center;
  color: var(--text-muted);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Dashboard/winStreakReward.vue
git commit -m "feat: apply Floor theme to winStreakReward (DrawSection)"
```

---

## Task 9: VoteView

**Files:**
- Modify: `src/views/VoteView.vue` — `<style scoped>` only

- [ ] **Step 1: Replace the entire `<style scoped>` block in `src/views/VoteView.vue`**

```css
.vote-page {
  width: 100%;
  max-width: 100%;
}

.tab-navigation {
  display: flex;
  gap: 0;
  margin-bottom: 1.5rem;
  border-radius: 10px;
  overflow: hidden;
  background: var(--bg-panel);
  border: 1px solid rgba(25, 233, 255, 0.2);
}

.tab-button {
  flex: 1;
  padding: 1rem 0;
  text-align: center;
  border: none;
  background: transparent;
  font-weight: bold;
  font-family: 'Chakra Petch', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.25s ease;
  border-bottom: 2px solid transparent;
}

.tab-button.active {
  color: var(--glow);
  background: var(--glow-10);
  border-bottom-color: var(--glow);
}

.tab-button:hover {
  color: var(--text);
  background: rgba(25, 233, 255, 0.05);
}

.vote-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section {
  background: var(--bg-panel);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--glow-30);
}

.section h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: var(--text);
  font-size: 1.1rem;
  font-family: 'Chakra Petch', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-bottom: 2px solid var(--glow);
  padding-bottom: 0.75rem;
}

.vote-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.vote-btn {
  padding: 1.2rem 1rem;
  background: var(--glow);
  color: #000d2b;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  transition: all 0.2s;
  font-size: 1rem;
  touch-action: manipulation;
}

.vote-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.vote-btn:hover:not(:disabled):not(.voted) {
  background: #3df5ff;
}

.vote-btn.voted {
  background: var(--glow-10);
  border: 2px solid var(--glow);
  color: var(--glow);
}

.vote-btn:disabled:not(.voted) {
  background: var(--bg-surface);
  color: var(--text-muted);
  cursor: not-allowed;
  opacity: 0.4;
}

.voting-disabled {
  padding: 1.5rem 1rem;
  background: var(--bg-surface);
  border-radius: 6px;
  text-align: center;
  color: var(--text-muted);
  font-size: 1rem;
}

.voted-message {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--glow-10);
  color: var(--glow);
  border: 1px solid var(--glow-30);
  border-radius: 6px;
  text-align: center;
  font-weight: bold;
  font-family: 'Chakra Petch', sans-serif;
}

.vote-results {
  padding: 0;
}

.result-item {
  margin-bottom: 1.5rem;
}

.result-item:last-child {
  margin-bottom: 0;
}

.player-name {
  display: block;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: var(--text);
  font-size: 1rem;
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
}

.result-bar {
  height: 40px;
  background: var(--bg-surface);
  border-radius: 6px;
  overflow: hidden;
  margin: 0.75rem 0;
}

.bar-fill {
  height: 100%;
  background: var(--glow);
  box-shadow: 0 0 8px var(--glow-30);
  transition: width 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000d2b;
  font-weight: bold;
  font-size: 0.9rem;
  min-width: 30px;
}

.vote-number {
  display: block;
  font-size: 0.95rem;
  color: var(--text);
  font-weight: bold;
  font-family: 'Chakra Petch', sans-serif;
}

.voters-list {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-surface);
  border-radius: 4px;
  font-size: 0.85rem;
  border-left: 3px solid var(--glow);
}

.voters-label {
  color: var(--text-muted);
  font-weight: bold;
  display: block;
  margin-bottom: 0.3rem;
  font-family: 'Chakra Petch', sans-serif;
}

.voters-names {
  color: var(--text);
  word-break: break-word;
}

.player-list {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1rem;
}

.player-card {
  padding: 1rem;
  background: var(--bg-surface);
  border-radius: 14px;
  border: 1px solid var(--glow-30);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.player-card:hover {
  transform: translateY(-2px);
}

.player-card.eliminated {
  opacity: 0.5;
  border-color: var(--danger);
}

.player-card-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.player-card-header h4 {
  margin: 0 0 0.35rem 0;
  color: var(--text);
  font-size: 1.15rem;
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
}

.player-meta {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.player-badge {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 0.55rem 0.85rem;
  background: rgba(245, 158, 11, 0.15);
  border-radius: 999px;
}

.player-badge span {
  color: var(--warn);
  font-size: 0.8rem;
  font-family: 'Chakra Petch', sans-serif;
}

.player-badge strong {
  color: var(--warn);
  font-size: 1rem;
  font-family: 'Chakra Petch', sans-serif;
}

.theme-list {
  display: grid;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.theme-pill {
  padding: 0.75rem 0.9rem;
  border-radius: 999px;
  background: var(--glow-10);
  color: var(--glow);
  border: 1px solid var(--glow-30);
  font-weight: 700;
  text-align: center;
  font-family: 'Chakra Petch', 'Noto Sans TC', sans-serif;
}

.theme-pill.consumed {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  border-color: transparent;
}

.theme-pill.temp-locked {
  background: rgba(245, 158, 11, 0.12);
  color: var(--warn);
  border-color: rgba(245, 158, 11, 0.3);
  opacity: 0.75;
}

.theme-pill.revival-locked {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  border-color: transparent;
}

.prop-area {
  margin-bottom: 0.75rem;
}

.prop-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.status-badge {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  background: rgba(255, 255, 255, 0.05);
  color: var(--danger);
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: bold;
  font-family: 'Chakra Petch', sans-serif;
}

.status-badge.active {
  background: var(--glow-10);
  color: var(--glow);
  border: 1px solid var(--glow-30);
}

@media (min-width: 768px) {
  .vote-container {
    gap: 2rem;
  }
  .section {
    padding: 2rem;
  }
  .result-bar {
    height: 50px;
  }
  .player-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .player-list {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/views/VoteView.vue
git commit -m "feat: apply Floor theme to VoteView"
```

---

## Self-Review Checklist

- [x] All 11 files from spec covered
- [x] CSS variables consistent — all use `var(--bg-panel)`, `var(--glow)`, etc.
- [x] `glow-pulse` and `fade-slide-up` keyframes defined in Task 1, consumed in Tasks 6+
- [x] `#3df5ff` used for hover-lighter-cyan consistently across all buttons
- [x] `#000d2b` used as text color on cyan fill buttons consistently
- [x] No placeholders, TODOs, or "similar to Task N" references
- [x] Google Fonts import via CSS `@import` in theme.css (not via `index.html`) — simpler, no HTML change needed
- [x] No template/logic modifications in any task
