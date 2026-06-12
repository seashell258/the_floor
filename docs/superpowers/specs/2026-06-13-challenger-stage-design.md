# 抽挑戰者頁面重設計 — Design Spec

**Goal:** 強化觀眾觀看主持人操作時的投入感。主持人熟悉操作，設計重點在於「舞台感」，不在操作提示。

**File:** `src/components/Dashboard/GetChallengerSection.vue`

---

## 三個頁面狀態

### A. 待抽狀態（pre-draw）
- 候選池佔主要版面，格狀排列
- 每張候選卡有獨立 staggered glow pulse 動畫（3-4s 循環，各卡 delay 不同）
- 「開始抽籤」是頁面最大行動元素
- 「開始下一輪」與「移除陣亡者」縮小移至角落

### B. 揭示後狀態（post-reveal）
- 頁面上方出現「挑戰者主位」：小標籤 + 大名字 + glow
- 名字以短動畫落入（blur + scale → 清晰正常，0.4s）
- 主位下方細分隔線
- 候選池縮小變暗（opacity 0.4, scale 0.95, transition）
- 被選中者從候選池移除，出現在主位

### C. 池子已空狀態
- 候選池區顯示空白提示
- 「開始下一輪」升為主要按鈕

---

## 候選卡設計

- 比現在 pill chip 更大：`padding: 0.85rem 1.25rem`
- 方形感：`border-radius: 8px`
- 邊框：`1px solid rgba(25, 233, 255, 0.25)`
- 底色：`var(--bg-surface)`
- 名字：Chakra Petch, font-weight 600, color var(--text)
- Glow pulse 動畫：`box-shadow` 在低/中 glow 之間循環，3.5s ease-in-out infinite
- 每張卡的 `animation-delay` 由 index 計算，錯開呼吸節奏
- 格狀：`grid-template-columns: repeat(auto-fill, minmax(120px, 1fr))`

**Post-reveal 時的候選卡：**
- `opacity: 0.4`, `transform: scale(0.95)`, `transition: all 0.5s ease`

---

## 挑戰者主位（post-reveal 上方區域）

- 標籤：`本輪挑戰者`，0.7rem, letter-spacing 0.3em, uppercase, opacity 0.5, color var(--glow)
- 名字：`clamp(2.4rem, 8vw, 4rem)`, font-weight 700, color white
- Text-shadow：`0 0 20px var(--glow), 0 0 50px rgba(25,233,255,0.3)`
- 出現動畫 `challenger-land`：from `opacity 0, scale(0.88), blur(8px)` → to `opacity 1, scale(1), blur(0)`，0.4s cubic-bezier(0.16, 1, 0.3, 1)
- 下方 1px 分隔線：`rgba(25, 233, 255, 0.15)`
- 無「下一步」提示文字

---

## 按鈕層級

| 按鈕 | 狀態 A | 狀態 B | 狀態 C |
|------|--------|--------|--------|
| 開始抽籤 | 主要，全寬 | 次要，縮小 | 隱藏/disabled |
| 開始下一輪 | 小字，角落 | 小字，角落 | 主要，全寬 |
| 移除陣亡者 | icon + 小字，角落 | icon + 小字，角落 | icon + 小字，角落 |

---

## 不做的事

- 不加「請切換到選擇挑戰對象」引導文字
- 不加 hover tooltip 說明（主持人已熟悉）
- 不改動 draw overlay 動畫（已經很好）
- 不做 pool 縮小的逐出動畫（低張力）
