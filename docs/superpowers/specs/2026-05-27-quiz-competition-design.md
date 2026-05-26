# 快問快答競賽系統 設計文件

**Date:** 2026-05-27

---

## 系統概述

供**現場活動**使用的 web 競賽平台。所有參賽者實體在場，透過網站進行即時對戰。

---

## 核心玩法：快問快答對戰

### 對戰流程

- 兩名玩家**同時在線**進行即時對戰
- 對戰主題為**認圖片**（Image Recognition 快問快答）
- 採**輪流答題**機制：
  - 每人各有一個**獨立的倒數計時器（30 秒）**
  - 輪到誰答題，誰的計時器就開始消耗
  - **答對一題（下一題）→ 換對方答題**，計時器切換
  - **答不出來可以跳過** → 扣當前答題者 3 秒，**不換人**，計時器繼續消耗，再出新題給同一方
  - **一定要答對一題才會換人**
- **先把計時器消耗到 0 的人輸**

---

## 主題（Theme）系統

### 主題是什麼

- 主題 = 題目的**分類**
- 每位玩家有 4 個主題，在設定檔（`playersConfig.ts`）中預先設定，不支援報名時動態選擇

### 主題優先順序

- 優先順序 = 設定檔中的排列順序（由上到下）
- 第 1 個主題優先級最高，第 4 個最低

### 第四主題（復活題）

- 初始狀態為 `isActivated: false`（灰色鎖定）
- 需由 admin 手動啟用（復活題按鈕 + 確認 modal）
- 啟用後與其他主題相同運作邏輯

### 挑戰時的主題選擇

- 任何玩家可以挑戰任何人（公開賽制）
- 發起挑戰時，**自動帶入被挑戰者的最優先可用主題**（`peekActive()` 的那個）
- 被挑戰者無法拒絕（現場活動強制接受）

---

## 主題消長規則（核心設計）

| 情況 | 結果 |
|------|------|
| 一場對戰結束 | 本場使用的主題（被挑戰者的）在**被挑戰者**那邊灰掉（`isConsumed = true`） |
| **被挑戰者贏** | 被挑戰者從挑戰者那邊**掠奪一個主題**（補回自己被消耗的命數） |
| **挑戰者贏** | 被挑戰者的主題灰掉；**挑戰者不獲得任何新主題** |

**設計意圖：**
- 每場對戰都消耗被挑戰者的一個主題（因為主題從被挑戰者身上取）
- 被挑戰者若贏，等於打退挑戰並補回命數（從挑戰者那邊奪回）
- 挑戰者若贏，只是成功消耗對方一命，自己不獲益

---

## 淘汰條件

- 玩家失去**最後一個已啟用且未消耗**的主題時，判定為淘汰（`eliminated = true`）
- 判斷式：`themeStack.items.filter(t => !t.isConsumed && t.isActivated).length === 0`
- 未啟用的第四主題不計入存活條件（即使未啟用，只要最後一個啟用主題消耗，即淘汰）
- 因此玩家可能輸 3 場淘汰（前三主題都啟用）或 4 場淘汰（第四主題也啟用後再輸）

---

## 賽制終點

- 全場只剩一名未淘汰玩家時，宣告該玩家為勝利者
- 偵測邏輯：`tournamentWinner` computed，`players.filter(p => !p.eliminated).length === 1` 時回傳玩家名字
- UI：Dashboard 頂部顯示全寬綠底橫幅「🏆 [玩家名字] 是最後存活者！」
- 不提供程式化重置（admin 自行決定後續）

---

## 主題庫

- 主題與題目維持在 `playersConfig.ts` 中管理（靜態設定檔）
- 不需要動態新增/管理介面

---

## 技術實作範圍

### 需修正的 Bug

1. **`processBattleResult` 被挑戰者贏的邏輯**（`store.ts` 第 414-418 行）：
   - 現狀：錯誤地消耗挑戰者主題、把被挑戰者主題推給挑戰者
   - 修正：先把被挑戰者的頂層主題灰掉，再把挑戰者的頂層主題搶過來加到被挑戰者的 stack

2. **淘汰判斷缺少 `isActivated` 條件**（`store.ts` 第 424 行）：
   - 現狀：`filter(t => !t.isConsumed).length === 0`
   - 修正：`filter(t => !t.isConsumed && t.isActivated).length === 0`

### 需新增的功能

3. **初始計時器改為 30 秒**（`store.ts` `startBattleWithChallenger`）：
   - 現狀：`5 + timePropBonus`
   - 修正：`30 + timePropBonus`

4. **`tournamentWinner` computed**（`store.ts`）：
   ```ts
   const tournamentWinner = computed(() => {
     const alive = state.value.players.filter(p => !p.eliminated)
     return alive.length === 1 ? alive[0].name : null
   })
   ```
   需加入 return block export。

5. **Dashboard 勝利橫幅**（`DashboardView.vue` 或 `PlayersSection.vue`）：
   - 當 `tournamentWinner !== null` 時，在玩家列表頂部顯示全寬橫幅
   - 文字：`🏆 [玩家名字] 是最後存活者！`
   - 樣式：綠底白字，全寬

### 已確認不需實作

- 每題時限（無單題計時）
- 動態主題庫管理介面
- 程式化重置整場功能
- 被挑戰者拒絕機制

---

## 影響範圍

| 檔案 | 變更類型 |
|------|----------|
| `src/pinia/store.ts` | 修正 `processBattleResult`、淘汰判斷、初始計時器；新增 `tournamentWinner` computed |
| `src/components/Dashboard/PlayersSection.vue` 或 `src/views/DashboardView.vue` | 新增勝利橫幅 UI |

---

## Brainstorm 進度

- [x] 了解核心玩法（計時器對戰、輪流答題、跳過機制）
- [x] 了解主題系統（設定檔預設 4 個、優先順序、挑戰自動選題）
- [x] 了解主題消長規則（核心修正已確認）
- [x] 釐清剩餘問題（全部 7 個已解答）
- [x] 提出 2-3 個架構方案（選定方案 B）
- [x] 完成設計並請使用者確認
- [ ] 撰寫 writing-plans
