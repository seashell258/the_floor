# Player Status UI Enhancement Design
**Date:** 2026-05-26

## 概述

強化玩家狀態頁面的互動體驗，包含挑戰者鎖定邏輯、復活題啟用機制、道具系統視覺化，以及主持人主題耗盡處理。變更同時套用於 `/dashboard` 和 `/vote` 兩個 view。

---

## 資料模型變更

### ThemeData — 新增 `isActivated`

```ts
export interface ThemeData {
  name: string
  photos: string[]
  answers: string[]
  isConsumed: boolean
  isActivated: boolean  // false = 復活題未啟用，鎖定灰色
}
```

- 所有玩家前三個主題初始為 `isActivated: true`
- 第四個主題初始為 `isActivated: false`
- 啟用後設為 `true`，之後依正常 `isConsumed` 邏輯運作
- `playersConfig.ts` 需同步更新初始化值

### Player — 道具欄位

```ts
export interface Player {
  name: string
  themeStack: ThemeStack
  correct: number
  eliminated: boolean
  winStreak: number
  prop: 'time' | 'shield' | null  // 取代原有的 reward: string | null
}
```

- 最多持有一個道具
- 連勝 3 場（門檻從 2 改為 3）後可透過現有抽籤系統獲得
- 未持有時為 `null`

---

## Store 變更（`src/pinia/store.ts`）

### 新增 computed：`selectableThemeKeys`

回傳 `Set<string>`，key 格式為 `"玩家名稱:主題名稱"`。

**主題可被選擇的條件（全部符合）：**
1. `theme.isActivated === true`
2. `theme.isConsumed === false`
3. 不是當前挑戰者（`currentChallenger`）自己的主題
4. 是該玩家的頂層可用主題（`themeStack.peekActive()` 的那個）

**主持人主題：**
- `isConsumed === false` 且 `isActivated === true` 即可選
- 被挑戰後 `isConsumed = true`（現有 `processBattleResult` 邏輯已處理）

### 新增 Actions

```ts
// 啟用復活題（第四個主題）
function activateRevivalTheme(playerName: string): void

// 消耗道具（使用後設為 null）
function consumeProp(playerName: string): void

// 使用時間道具：自動偵測玩家身份，加 3 秒到對應計時器
function applyTimeProp(playerName: string): void
// 判斷 playerName === currentBattle.player1Name → challengerTimer += 3
// 判斷 playerName === currentBattle.player2Name → defenderTimer += 3
// 同時呼叫 consumeProp(playerName)
```

### 修改：連勝門檻

將觸發抽獎的 `winStreak` 條件從 `>= 2` 改為 `>= 3`。

---

## UI 視覺與互動

### 主題卡片顏色狀態

| 狀態 | 顏色 | 互動 |
|------|------|------|
| 可選（正常） | 現有樣式 | 可點擊 |
| 暫時鎖定（挑戰者本人 / 非頂層主題） | 淡橘色 | `cursor-not-allowed`，點擊無效 |
| 復活題未啟用（`isActivated: false`） | 灰色 | `cursor-not-allowed`，點擊無效 |
| 已消耗（`isConsumed: true`） | 灰色（現有） | 不可點擊 |

### 復活題啟用按鈕

- 位置：第四個主題卡片右側，小型圖示按鈕（鎖頭或「解鎖」文字）
- 顯示條件：`isActivated === false`（啟用後消失）
- 點擊流程：
  1. 跳出確認 modal（與抽挑戰者相同風格）
  2. 確認後呼叫 `activateRevivalTheme(playerName)`
  3. 主題卡片進入正常可選狀態

### 道具顯示區

- 位置：主題列表與存活/淘汰狀態文字之間
- 持有道具時顯示對應圖示（圖示檔案待提供）
- 無道具時此區域不顯示
- 點擊行為：
  - **時間道具（`'time'`）**：呼叫 `applyTimeProp(playerName)`，自動加 3 秒並消耗道具
  - **盾牌道具（`'shield'`）**：呼叫 `consumeProp(playerName)`，純視覺消耗；對應遊戲規則（本次挑戰無效）由管理員口頭宣告執行，程式碼不自動取消對決

### 共用邏輯

- `selectableThemeKeys` 從 store 讀取，兩個 view 共享同一份計算結果
- 顏色判斷邏輯抽成 helper function（例如 `getThemeColorClass(theme, playerName, selectableKeys)`），避免重複

---

## 影響範圍

| 檔案 | 變更類型 |
|------|----------|
| `src/pinia/store.ts` | 新增 computed、actions；修改 Player 介面；連勝門檻 |
| `src/config/playersConfig.ts` | ThemeData 加 `isActivated` 欄位 |
| `src/components/Dashboard/PlayersSection.vue` | 套用顏色邏輯、復活按鈕、道具顯示 |
| `src/components/Vote/PlayerStatus.vue` | 同上 |
| `src/components/Dashboard/winStreakReward.vue` | `reward` 改為 `prop`，更新抽獎結果寫入邏輯 |
| （store 內）`applyWinReward` action | 重命名並改為寫入 `player.prop` |
