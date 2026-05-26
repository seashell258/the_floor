# Player Status UI Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add challenger locking, revival theme activation, a typed prop system, and theme color states to both /dashboard and /vote player status views.

**Architecture:** Store holds all selectability logic via a `selectableThemeKeys` computed (Set<string>); a shared `getThemeClass` helper maps theme state to CSS class names; a `timePropBonus` record bridges the "prop clicked before battle starts" timing gap. No test framework is present — verify via `npm run dev`.

**Tech Stack:** Vue 3 (Composition API), Pinia, TypeScript, Vite.

---

## File Map

| File | Action |
|------|--------|
| `src/pinia/store.ts` | Modify: ThemeData + Player interfaces, GameState, new computed + actions |
| `src/config/playersConfig.ts` | Modify: add `isActivated` to every theme entry |
| `src/utils/themeUtils.ts` | Create: `getThemeClass` helper |
| `src/components/Dashboard/PlayersSection.vue` | Modify: color classes, revival button + modal, prop icon |
| `src/views/VoteView.vue` | Modify: color classes, prop icon (display-only) in status tab |
| `src/views/DashboardView.vue` | Modify: `drawReward` uses `applyProp` |
| `src/components/Dashboard/winStreakReward.vue` | No code changes needed — display string comes from `recordDrawResult` |

---

### Task 1: Add `isActivated` to ThemeData and update config

**Files:**
- Modify: `src/pinia/store.ts`
- Modify: `src/config/playersConfig.ts`

- [ ] **Step 1: Update `ThemeData` interface in store.ts**

Find the `ThemeData` interface (~line 7). Change:
```ts
export interface ThemeData {
  name: string
  photos: string[]
  answers: string[]
  isConsumed: boolean
}
```
to:
```ts
export interface ThemeData {
  name: string
  photos: string[]
  answers: string[]
  isConsumed: boolean
  isActivated: boolean
}
```

- [ ] **Step 2: Update `initializePlayersFromConfig` to forward `isActivated`**

Find `initializePlayersFromConfig` in store.ts. Change the inner map:
```ts
const themeDataArray: ThemeData[] = playerConfig.themes.map(theme => ({
  name: theme.name,
  photos: theme.photos,
  answers: theme.answers,
  isConsumed: theme.isConsumed ?? false
}))
```
to:
```ts
const themeDataArray: ThemeData[] = playerConfig.themes.map(theme => ({
  name: theme.name,
  photos: theme.photos,
  answers: theme.answers,
  isConsumed: theme.isConsumed ?? false,
  isActivated: theme.isActivated ?? true
}))
```

- [ ] **Step 3: Update `initializeHostThemes` to set `isActivated: true`**

Find `initializeHostThemes` in store.ts. Change the inner map:
```ts
state.value.hostThemes = themes.map(t => ({
  name: t.name,
  photos: t.photos,
  answers: t.answers,
  isConsumed: false
}))
```
to:
```ts
state.value.hostThemes = themes.map(t => ({
  name: t.name,
  photos: t.photos,
  answers: t.answers,
  isConsumed: false,
  isActivated: true
}))
```

- [ ] **Step 4: Update `HostThemeConfig` interface in playersConfig.ts**

Change:
```ts
export interface HostThemeConfig {
    name: string
    photos: string[]
    answers: string[]
}
```
to:
```ts
export interface HostThemeConfig {
    name: string
    photos: string[]
    answers: string[]
    isActivated: boolean
}
```

- [ ] **Step 5: Update `PlayerConfig` theme shape in playersConfig.ts**

Change:
```ts
export interface PlayerConfig {
    name: string
    themes: {
        name: string
        photos: string[]
        answers: string[]
        isConsumed: boolean
    }[]
}
```
to:
```ts
export interface PlayerConfig {
    name: string
    themes: {
        name: string
        photos: string[]
        answers: string[]
        isConsumed: boolean
        isActivated: boolean
    }[]
}
```

- [ ] **Step 6: Add `isActivated: true` to all `hostConfig` entries**

Replace the entire `hostConfig` array:
```ts
export const hostConfig: HostThemeConfig[] = [
    { name: '角落生物', photos: generatePhotoPaths('主持人', '角落生物', 48), answers: ['答案1', '答案2'], isActivated: true },
    { name: '寵物',     photos: generatePhotoPaths('主持人', '寵物',     48), answers: ['答案1'],          isActivated: true },
    { name: '風景',     photos: generatePhotoPaths('主持人', '風景',     48), answers: ['答案1'],          isActivated: true },
    { name: '運動',     photos: generatePhotoPaths('主持人', '運動',     48), answers: ['答案1'],          isActivated: true }
]
```

- [ ] **Step 7: Add `isActivated` to all player theme entries in `playersConfig`**

For every player, the first 3 themes get `isActivated: true` and the 4th gets `isActivated: false`. Apply to all 5 players. Full replacement of `playersConfig`:

```ts
export const playersConfig: PlayerConfig[] = [
    {
        name: '李長鴻',
        themes: [
            { name: '美國卡通',     photos: generatePhotoPaths('李長鴻', '美國卡通',     30), answers: ['答案1', '答案2'], isConsumed: false, isActivated: true  },
            { name: '單機遊戲',     photos: generatePhotoPaths('李長鴻', '單機遊戲',     30), answers: ['答案3'],          isConsumed: false, isActivated: true  },
            { name: '希臘神話人物', photos: generatePhotoPaths('李長鴻', '希臘神話人物', 30), answers: ['答案4'],          isConsumed: false, isActivated: true  },
            { name: '哲學家語錄',   photos: generatePhotoPaths('李長鴻', '哲學家語錄',   30), answers: ['答案5'],          isConsumed: false, isActivated: false }
        ]
    },
    {
        name: '怡臻',
        themes: [
            { name: '後宮甄嬛傳經典臺詞', photos: generatePhotoPaths('怡臻', '後宮甄嬛傳經典臺詞', 30), answers: ['答案1', '答案2'], isConsumed: false, isActivated: true  },
            { name: '食物',               photos: generatePhotoPaths('怡臻', '食物',               30), answers: ['答案3'],          isConsumed: false, isActivated: true  },
            { name: '動漫',               photos: generatePhotoPaths('怡臻', '動漫',               30), answers: ['答案4'],          isConsumed: false, isActivated: true  },
            { name: '彩妝',               photos: generatePhotoPaths('怡臻', '彩妝',               35), answers: ['答案5'],          isConsumed: false, isActivated: false }
        ]
    },
    {
        name: '逸弘',
        themes: [
            { name: '國家對首都',   photos: generatePhotoPaths('逸弘', '國家對首都',   48), answers: ['答案1', '答案2'], isConsumed: false, isActivated: true  },
            { name: '遊戲王角色',   photos: generatePhotoPaths('逸弘', '遊戲王角色',   48), answers: ['答案3'],          isConsumed: false, isActivated: true  },
            { name: '臺灣老歌歌手', photos: generatePhotoPaths('逸弘', '臺灣老歌歌手', 48), answers: ['答案4'],          isConsumed: false, isActivated: true  },
            { name: '臺灣政治人物', photos: generatePhotoPaths('逸弘', '臺灣政治人物', 48), answers: ['答案5'],          isConsumed: false, isActivated: false }
        ]
    },
    {
        name: '戴笠',
        themes: [
            { name: '文化節慶',         photos: generatePhotoPaths('戴笠', '文化節慶',         48), answers: ['答案1', '答案2'], isConsumed: false, isActivated: true  },
            { name: '世界知名自然景觀', photos: generatePhotoPaths('戴笠', '世界知名自然景觀', 48), answers: ['答案3'],          isConsumed: false, isActivated: true  },
            { name: '宗教神祇',         photos: generatePhotoPaths('戴笠', '宗教神祇',         48), answers: ['答案4'],          isConsumed: false, isActivated: true  },
            { name: '動植物',           photos: generatePhotoPaths('戴笠', '動植物',           48), answers: ['答案5'],          isConsumed: false, isActivated: false }
        ]
    },
    {
        name: 'VJ',
        themes: [
            { name: '西方奇幻小說', photos: generatePhotoPaths('VJ', '西方奇幻小說', 48), answers: ['答案1', '答案2'], isConsumed: false, isActivated: true  },
            { name: '電腦遊戲',     photos: generatePhotoPaths('VJ', '電腦遊戲',     48), answers: ['答案3'],          isConsumed: false, isActivated: true  },
            { name: '網路迷因',     photos: generatePhotoPaths('VJ', '網路迷因',     48), answers: ['答案4'],          isConsumed: false, isActivated: true  },
            { name: 'pending',      photos: generatePhotoPaths('VJ', 'pending',      48), answers: ['答案5'],          isConsumed: false, isActivated: false }
        ]
    }
]
```

- [ ] **Step 8: Commit**

```bash
git add src/pinia/store.ts src/config/playersConfig.ts
git commit -m "feat: add isActivated to ThemeData — 4th theme starts locked"
```

---

### Task 2: Update Player interface — rename `reward` → `prop`

**Files:**
- Modify: `src/pinia/store.ts`

- [ ] **Step 1: Change `Player` interface**

Change:
```ts
export interface Player {
  name: string
  themeStack: ThemeStack
  correct: number
  eliminated: boolean
  winStreak: number
  reward: string | null
}
```
to:
```ts
export interface Player {
  name: string
  themeStack: ThemeStack
  correct: number
  eliminated: boolean
  winStreak: number
  prop: 'time' | 'shield' | null
}
```

- [ ] **Step 2: Update `createPlayer`**

Change:
```ts
function createPlayer(name: string, themes: ThemeData[]): Player {
  return {
    name,
    themeStack: new ThemeStack(themes),
    correct: 0,
    eliminated: false,
    winStreak: 0,
    reward: null
  }
}
```
to:
```ts
function createPlayer(name: string, themes: ThemeData[]): Player {
  return {
    name,
    themeStack: new ThemeStack(themes),
    correct: 0,
    eliminated: false,
    winStreak: 0,
    prop: null
  }
}
```

- [ ] **Step 3: Rename `applyWinReward` to `applyProp`**

Change:
```ts
function applyWinReward(playerName: string, reward: string) {
  const player = state.value.players.find(p => p.name === playerName)
  if (player) {
    player.reward = reward
  }
}
```
to:
```ts
function applyProp(playerName: string, prop: 'time' | 'shield') {
  const player = state.value.players.find(p => p.name === playerName)
  if (player) player.prop = prop
}
```

- [ ] **Step 4: Update `return` block**

In the `return { ... }` at the bottom of `useGameStore`, replace `applyWinReward` with `applyProp`.

- [ ] **Step 5: Commit**

```bash
git add src/pinia/store.ts
git commit -m "feat: rename reward→prop with typed union on Player interface"
```

---

### Task 3: Add `timePropBonus`, `selectableThemeKeys`, and prop actions to store

**Files:**
- Modify: `src/pinia/store.ts`

- [ ] **Step 1: Add `timePropBonus` to `GameState` interface**

Add this field to the `GameState` interface:
```ts
timePropBonus: Record<string, number>
```

Add its initial value in the `state = ref<GameState>({...})` block:
```ts
timePropBonus: {}
```

- [ ] **Step 2: Update `startBattleWithChallenger` to consume time bonuses**

Change the function to pick up any pending bonus before resetting timers:
```ts
function startBattleWithChallenger(challengerName: string, defenderName: string, photos: string[]) {
  const challengerBonus = state.value.timePropBonus[challengerName] ?? 0
  const defenderBonus   = state.value.timePropBonus[defenderName]   ?? 0
  state.value.currentBattle = {
    player1Name: challengerName,
    player2Name: defenderName,
    image: photos[0] || ''
  }
  state.value.challengerTimer = 5 + challengerBonus
  state.value.defenderTimer   = 5 + defenderBonus
  delete state.value.timePropBonus[challengerName]
  delete state.value.timePropBonus[defenderName]
  state.value.currentTimerPlayer = challengerName
  state.value.isTimerRunning = true
  state.value.battleWinner = null
}
```

- [ ] **Step 3: Add `selectableThemeKeys` computed**

After the existing `const hostThemes = computed(...)` line, add:
```ts
const selectableThemeKeys = computed<Set<string>>(() => {
  const keys = new Set<string>()
  const challengerName = state.value.currentChallenger?.challenger.name ?? null
  for (const player of state.value.players) {
    if (player.eliminated) continue
    if (player.name === challengerName) continue
    const items = player.themeStack.items
    for (let i = items.length - 1; i >= 0; i--) {
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

- [ ] **Step 4: Add `activateRevivalTheme` action**

```ts
function activateRevivalTheme(playerName: string): void {
  const player = state.value.players.find(p => p.name === playerName)
  if (!player) return
  const revivalTheme = player.themeStack.items.find(t => !t.isActivated)
  if (revivalTheme) revivalTheme.isActivated = true
}
```

- [ ] **Step 5: Add `consumeProp` action**

```ts
function consumeProp(playerName: string): void {
  const player = state.value.players.find(p => p.name === playerName)
  if (player) player.prop = null
}
```

- [ ] **Step 6: Add `applyTimeProp` action**

```ts
function applyTimeProp(playerName: string): void {
  state.value.timePropBonus[playerName] = (state.value.timePropBonus[playerName] ?? 0) + 3
  consumeProp(playerName)
}
```

- [ ] **Step 7: Export new symbols from store return block**

Add to `return { ... }`:
```ts
selectableThemeKeys,
activateRevivalTheme,
consumeProp,
applyTimeProp,
```

- [ ] **Step 8: Commit**

```bash
git add src/pinia/store.ts
git commit -m "feat: add selectableThemeKeys, prop actions, and timePropBonus to store"
```

---

### Task 4: Create shared `getThemeClass` helper

**Files:**
- Create: `src/utils/themeUtils.ts`

- [ ] **Step 1: Create the file**

```ts
import type { ThemeData } from '../pinia/store'

// Returns a CSS class name for a theme pill based on its state and selectability.
// Pass selectableKeys=null when no challenger is active (no temp-locking applied).
export function getThemeClass(
  theme: ThemeData,
  playerName: string,
  selectableKeys: Set<string> | null
): string {
  if (theme.isConsumed) return 'consumed'
  if (!theme.isActivated) return 'revival-locked'
  if (selectableKeys !== null && !selectableKeys.has(`${playerName}:${theme.name}`)) return 'temp-locked'
  return ''
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/themeUtils.ts
git commit -m "feat: add getThemeClass helper for theme pill color states"
```

---

### Task 5: Update `PlayersSection.vue` (Dashboard)

**Files:**
- Modify: `src/components/Dashboard/PlayersSection.vue`

- [ ] **Step 1: Replace `<script setup>` section**

Replace the entire `<script setup lang="ts">` block with:
```ts
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '../../pinia/store'
import { getThemeClass } from '../../utils/themeUtils'

const props = defineProps<{
  players: Array<any>
  onThemeClick: (player: any, theme: any) => void
  onStartHostBattle: (challengerName: string) => void
}>()

const gameStore = useGameStore()
const isPanelOpen = ref(false)
const selectedChallengerName = ref('')
const selectedHostThemeKey = ref('')
const revivalConfirmPlayer = ref<string | null>(null)

const selectableKeys = computed(() =>
  gameStore.currentChallenger ? gameStore.selectableThemeKeys : null
)

function themeClass(theme: any, playerName: string): string {
  return getThemeClass(theme, playerName, selectableKeys.value)
}

function handleThemeClick(player: any, theme: any): void {
  const cls = themeClass(theme, player.name)
  if (cls === 'consumed' || cls === 'revival-locked' || cls === 'temp-locked') return
  props.onThemeClick(player, theme)
}

function propLabel(prop: 'time' | 'shield'): string {
  return prop === 'time' ? '⏱' : '🛡'
}

function handlePropClick(player: any): void {
  if (!player.prop) return
  if (player.prop === 'time') {
    gameStore.applyTimeProp(player.name)
  } else {
    gameStore.consumeProp(player.name)
  }
}

function openRevivalConfirm(playerName: string): void {
  revivalConfirmPlayer.value = playerName
}

function confirmRevival(): void {
  if (revivalConfirmPlayer.value) {
    gameStore.activateRevivalTheme(revivalConfirmPlayer.value)
    revivalConfirmPlayer.value = null
  }
}

function openPanel() {
  if (!selectedChallengerName.value && gameStore.activePlayers.length > 0) {
    selectedChallengerName.value = gameStore.activePlayers[0].name
  }
  if (!selectedHostThemeKey.value && gameStore.state.hostCurrentTheme) {
    selectedHostThemeKey.value = gameStore.state.hostCurrentTheme.name
  }
  isPanelOpen.value = true
}

function onHostThemeChange() {
  const found = gameStore.hostThemes.find(t => t.name === selectedHostThemeKey.value)
  gameStore.setHostCurrentTheme(found ?? null)
}

function handleStartDuel() {
  if (!selectedChallengerName.value || !gameStore.state.hostCurrentTheme) return
  props.onStartHostBattle(selectedChallengerName.value)
  isPanelOpen.value = false
}
</script>
```

- [ ] **Step 2: Replace the `<div class="theme-list">` block in the template**

Change:
```html
<div class="theme-list">
  <div
    v-for="theme in [...player.themeStack.items].reverse()"
    :key="theme.name"
    class="theme-pill"
    :class="{ consumed: theme.isConsumed }"
    @click="onThemeClick(player, theme)">
    {{ theme.name }}
  </div>
</div>
```
to:
```html
<div class="theme-list">
  <div
    v-for="theme in [...player.themeStack.items].reverse()"
    :key="theme.name"
    class="theme-pill"
    :class="themeClass(theme, player.name)"
    @click="handleThemeClick(player, theme)">
    <span class="theme-name">{{ theme.name }}</span>
    <button
      v-if="!theme.isActivated"
      class="revival-btn"
      @click.stop="openRevivalConfirm(player.name)"
      title="啟用復活題"
    >🔓</button>
  </div>
</div>
```

- [ ] **Step 3: Replace the prop/reward display line**

Change:
```html
<p v-if="player.reward" class="player-reward"><strong>Reward:</strong> {{ player.reward }}</p>
```
to:
```html
<div v-if="player.prop" class="prop-area">
  <button
    class="prop-btn"
    @click="handlePropClick(player)"
    :title="player.prop === 'time' ? '使用：時間+3秒' : '使用：盾牌'"
  >{{ propLabel(player.prop) }}</button>
</div>
```

- [ ] **Step 4: Add revival confirmation modal**

Before the closing `</section>` tag (just before `</template>`), add:
```html
<!-- Revival activation confirm modal -->
<div v-if="revivalConfirmPlayer" class="modal-overlay" @click.self="revivalConfirmPlayer = null">
  <div class="modal-content">
    <h4>啟用復活題？</h4>
    <p>確認啟用 <strong>{{ revivalConfirmPlayer }}</strong> 的第四主題嗎？</p>
    <div class="modal-actions">
      <button class="cancel-btn" @click="revivalConfirmPlayer = null">取消</button>
      <button class="confirm-btn" @click="confirmRevival">確認啟用</button>
    </div>
  </div>
</div>
```

- [ ] **Step 5: Add new CSS rules to `<style scoped>`**

Add after the existing `.theme-pill.consumed` rule:
```css
.theme-pill {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.theme-name {
  flex: 1;
  text-align: center;
}

/* Temporarily locked: not the top theme, or challenger's own themes */
.theme-pill.temp-locked {
  background: #fde68a;
  color: #92400e;
  cursor: not-allowed;
  opacity: 0.75;
}

.theme-pill.temp-locked:hover {
  transform: none;
  background: #fde68a;
}

/* Revival theme not yet activated */
.theme-pill.revival-locked {
  background: #cbd5e1;
  color: #475569;
  cursor: not-allowed;
}

.theme-pill.revival-locked:hover {
  transform: none;
  background: #cbd5e1;
}

.revival-btn {
  background: none;
  border: 1px solid #94a3b8;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.1rem 0.3rem;
  flex-shrink: 0;
  line-height: 1;
}

.revival-btn:hover {
  background: #e2e8f0;
}

/* Prop display area */
.prop-area {
  margin-bottom: 0.75rem;
  display: flex;
  gap: 0.5rem;
}

.prop-btn {
  font-size: 1.5rem;
  background: none;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.25rem 0.6rem;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  line-height: 1;
}

.prop-btn:hover {
  border-color: #f59e0b;
  background: #fffbeb;
}

/* Confirm modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal-content {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  max-width: 360px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-content h4 {
  margin: 0 0 0.75rem 0;
  color: #1f2937;
}

.modal-content p {
  margin: 0 0 1.25rem 0;
  color: #374151;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  background: #e5e7eb;
  color: #374151;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.cancel-btn:hover {
  background: #d1d5db;
}

.confirm-btn {
  padding: 0.5rem 1rem;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.confirm-btn:hover {
  background: #6d28d9;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/Dashboard/PlayersSection.vue
git commit -m "feat: add theme color states, revival button, and prop display to PlayersSection"
```

---

### Task 6: Update `VoteView.vue` — player status tab

**Files:**
- Modify: `src/views/VoteView.vue`

- [ ] **Step 1: Add imports and computed to `<script setup>`**

In the existing `<script setup lang="ts">`, add after the existing imports:
```ts
import { getThemeClass } from '../utils/themeUtils'
```

Add after `const activeTab = ref(...)`:
```ts
const selectableKeys = computed(() =>
  gameStore.currentChallenger ? gameStore.selectableThemeKeys : null
)
```

Make sure `computed` is imported from `'vue'` — it already is.

- [ ] **Step 2: Update theme-list in status tab**

Find the status tab's theme-list block (~line 95). Change:
```html
<div class="theme-list">
  <div
    v-for="theme in [...player.themeStack.items].reverse()"
    :key="theme.name"
    class="theme-pill"
    :class="{ consumed: theme.isConsumed }"
  >
    {{ theme.name }}
  </div>
</div>
```
to:
```html
<div class="theme-list">
  <div
    v-for="theme in [...player.themeStack.items].reverse()"
    :key="theme.name"
    class="theme-pill"
    :class="getThemeClass(theme, player.name, selectableKeys)"
  >
    {{ theme.name }}
  </div>
</div>
```

- [ ] **Step 3: Add prop display area**

After the `</div>` closing the `theme-list` div and before `<div class="status-badge"...>`, add:
```html
<div v-if="player.prop" class="prop-area">
  <span class="prop-icon" :title="player.prop === 'time' ? '時間+3秒' : '盾牌'">
    {{ player.prop === 'time' ? '⏱' : '🛡' }}
  </span>
</div>
```

- [ ] **Step 4: Add CSS**

In `<style scoped>`, add after the `.theme-pill.consumed` rule:
```css
.theme-pill.temp-locked {
  background: #fde68a;
  color: #92400e;
  opacity: 0.75;
}

.theme-pill.revival-locked {
  background: #cbd5e1;
  color: #475569;
}

.prop-area {
  margin-bottom: 0.75rem;
}

.prop-icon {
  font-size: 1.5rem;
  line-height: 1;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/views/VoteView.vue
git commit -m "feat: apply theme color states and prop display to vote player status"
```

---

### Task 7: Update `DashboardView.vue` — use `applyProp`

**Files:**
- Modify: `src/views/DashboardView.vue`

- [ ] **Step 1: Update `rewardOptions` type**

Change:
```ts
const rewardOptions = ['對方秒數-3秒', '拒絕一次對戰邀請']
```
to:
```ts
const rewardOptions: Array<'time' | 'shield'> = ['time', 'shield']
```

- [ ] **Step 2: Update `drawReward` function**

Change:
```ts
function drawReward() {
  if (!confirm('是否要開始抽獎？')) return

  const reward = rewardOptions[Math.floor(Math.random() * rewardOptions.length)]
  const player = gameStore.players.find(p => p.name === drawSelectedPlayerName.value)
  if (!player) return

  gameStore.applyWinReward(player.name, reward)
  gameStore.recordDrawResult(player.name, reward)
}
```
to:
```ts
function drawReward() {
  if (!confirm('是否要開始抽獎？')) return

  const prop = rewardOptions[Math.floor(Math.random() * rewardOptions.length)]
  const player = gameStore.players.find(p => p.name === drawSelectedPlayerName.value)
  if (!player) return

  gameStore.applyProp(player.name, prop)
  gameStore.recordDrawResult(player.name, prop === 'time' ? '⏱ 時間+3秒' : '🛡 盾牌')
}
```

- [ ] **Step 3: Commit**

```bash
git add src/views/DashboardView.vue
git commit -m "feat: update drawReward to use typed prop system"
```

---

### Task 8: Build check and manual verification

**Files:** None — verification only.

- [ ] **Step 1: Run TypeScript build check**

```bash
npm run build
```
Expected: exits with code 0, no type errors. If errors appear, fix them before proceeding.

- [ ] **Step 2: Start dev server**

```bash
npm run dev
```

- [ ] **Step 3: Verify Dashboard — player status tab**

Open `/dashboard` → 選擇挑戰對象 tab:

1. Without a challenger drawn: all themes show normal orange (except consumed = gray, 4th theme = gray with 🔓 button)
2. Draw a challenger in the 抽挑戰者 tab, then return to 選擇挑戰對象:
   - Challenger's own themes → light yellow-orange, unclickable
   - Other players' non-top themes → light yellow-orange, unclickable
   - Other players' top active theme → normal orange, clickable → starts battle
3. Click 🔓 on a 4th theme → modal appears → click 確認啟用 → theme turns normal orange, 🔓 disappears
4. Use `/dashboard` → 抽連勝獎勵 → draw a reward → player card shows ⏱ or 🛡 icon
5. Click ⏱ icon → icon disappears; start a battle for that player → their timer starts at 8s instead of 5s
6. Click 🛡 icon → icon disappears (no other automatic effect)

- [ ] **Step 4: Verify Vote — player status tab**

Open `/vote` → 玩家狀態 tab:

1. Same color states as dashboard (no click behavior needed)
2. Prop icons display correctly, no click handler

- [ ] **Step 5: Commit any remaining fixes**

```bash
git add -p
git commit -m "fix: resolve any issues found during manual verification"
```
