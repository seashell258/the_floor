# 快問快答競賽系統 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修正主題消長邏輯 bug，並在最後一名玩家存活時顯示冠軍橫幅。

**Architecture:** 全部改動集中在 Pinia store（資料邏輯）和 DashboardView（UI 顯示）兩個檔案。`processBattleResult` 目前被挑戰者贏的分支邏輯是反的，需要同步修正淘汰判斷條件。`tournamentWinner` 作為 computed 被動偵測，不需要新的 action 或狀態。

**Tech Stack:** Vue 3 Composition API, Pinia, TypeScript

---

## 背景知識

- `battle.player1Name` = 挑戰者（challenger），`battle.player2Name` = 被挑戰者（defender）
- 主題一律從**被挑戰者**的 `themeStack.peekActive()` 取得（最優先可用主題）
- `peekActive()` 只回傳 `!isConsumed && isActivated` 的主題
- `ThemeStack.push()` 將新主題加入 items 陣列末端

---

### Task 1: 修正 `processBattleResult` 主題消長邏輯

**Files:**
- Modify: `src/pinia/store.ts:414-424`

**現有錯誤行為（被挑戰者贏時）：**
- 消耗的是挑戰者的主題（應消耗被挑戰者的）
- 把被挑戰者的主題推給挑戰者（應推給被挑戰者/winner）

**正確規則：**
1. 任何情況：本場主題（被挑戰者的頂層主題）在被挑戰者那邊灰掉
2. 被挑戰者贏：額外把挑戰者的頂層主題掠奪到被挑戰者的 stack（補回命數）
3. 挑戰者贏：只有被挑戰者的主題灰掉，挑戰者不得任何主題
4. 淘汰判斷：需加上 `isActivated` 條件（未啟用的第四主題不算存活命數）

- [ ] **Step 1: 找到並替換 `processBattleResult` 的 if/else 段落**

在 `src/pinia/store.ts` 找到第 414-424 行，將整段替換為：

```ts
    if (isDefenderWin) {
      const defenderTopTheme = defender.themeStack.peekActive()
      const challengerTopTheme = loser.themeStack.peekActive()
      if (defenderTopTheme) defenderTopTheme.isConsumed = true
      if (challengerTopTheme) {
        challengerTopTheme.isConsumed = true
        winner.themeStack.push({ ...challengerTopTheme, isConsumed: false })
      }
    } else {
      const defenderTopTheme = defender.themeStack.peekActive()
      if (defenderTopTheme) defenderTopTheme.isConsumed = true
    }

    if (loser.themeStack.items.filter(t => !t.isConsumed && t.isActivated).length === 0) loser.eliminated = true
```

原本的程式碼（供對照確認）：
```ts
    if (isDefenderWin) {
      const defenderTopTheme = defender.themeStack.peekActive()
      const loserTopTheme = loser.themeStack.peekActive()
      if (loserTopTheme) loserTopTheme.isConsumed = true
      if (defenderTopTheme) loser.themeStack.push({ ...defenderTopTheme, isConsumed: false })
    } else {
      const defenderTopTheme = defender.themeStack.peekActive()
      if (defenderTopTheme) defenderTopTheme.isConsumed = true
    }

    if (loser.themeStack.items.filter(t => !t.isConsumed).length === 0) loser.eliminated = true
```

- [ ] **Step 2: 手動驗證 build 無誤**

```bash
npm run build
```

Expected: 無 TypeScript 錯誤，build 成功。

- [ ] **Step 3: Commit**

```bash
git add src/pinia/store.ts
git commit -m "fix: correct processBattleResult theme steal logic and elimination check"
```

---

### Task 2: 新增 `tournamentWinner` computed

**Files:**
- Modify: `src/pinia/store.ts`（在 `battleWinner` computed 附近新增，並加入 return block）

- [ ] **Step 1: 新增 computed**

在 `src/pinia/store.ts` 找到 `battleWinner` computed（位於 return block 前的 computed 區塊），在其後加入：

```ts
  const tournamentWinner = computed<string | null>(() => {
    const alive = state.value.players.filter(p => !p.eliminated)
    return alive.length === 1 ? alive[0].name : null
  })
```

- [ ] **Step 2: 加入 return block**

在 `src/pinia/store.ts` 的 return block（第 483 行附近），在 `battleWinner,` 這行後面加上：

```ts
    tournamentWinner,
```

- [ ] **Step 3: 手動驗證 build 無誤**

```bash
npm run build
```

Expected: 無 TypeScript 錯誤。

- [ ] **Step 4: Commit**

```bash
git add src/pinia/store.ts
git commit -m "feat: add tournamentWinner computed to detect last survivor"
```

---

### Task 3: Dashboard 勝利橫幅

**Files:**
- Modify: `src/views/DashboardView.vue`

- [ ] **Step 1: 在 template 加入橫幅**

在 `src/views/DashboardView.vue` 的 template，找到：

```html
    <div class="dashboard-header">
```

在其正上方插入：

```html
    <div v-if="gameStore.tournamentWinner" class="tournament-winner-banner">
      🏆 {{ gameStore.tournamentWinner }} 是最後存活者！
    </div>
```

- [ ] **Step 2: 加入 CSS**

在 `src/views/DashboardView.vue` 的 `<style scoped>` 區塊末尾加入：

```css
.tournament-winner-banner {
  background: #16a34a;
  color: white;
  text-align: center;
  padding: 1rem;
  font-size: 1.5rem;
  font-weight: bold;
  border-radius: 8px;
  margin-bottom: 1rem;
}
```

- [ ] **Step 3: 手動驗證**

啟動 dev server：
```bash
npm run dev
```

開啟 `/dashboard` → 切到「選擇挑戰對象」tab → 對每位玩家點擊「永久移除」，直到只剩一位。
Expected: 頁面頂部出現綠色橫幅「🏆 [最後玩家名字] 是最後存活者！」。

重新整理頁面（重置狀態），確認橫幅在全員存活時**不顯示**。

- [ ] **Step 4: Commit**

```bash
git add src/views/DashboardView.vue
git commit -m "feat: show tournament winner banner when last player survives"
```
