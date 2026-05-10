📌 一、專案目標
開發一個簡單的網頁應用，支援：
Admin 使用者：在 /dashboard 查看對決狀態、投票結果、抽籤結果、玩家狀態等。
Participant 使用者：在 /vote 頁面進行投票、參與抽籤、查看個人狀態。
不需要複雜的權限管理，透過路由分隔功能。
📁 二、專案結構規劃

Apply
src/
├── assets/            # 存放圖片、圖標、字型等靜態資源
├── components/        # 存放通用組件
│   ├── Dashboard/     # /dashboard 頁面的組件
│   │   ├── StatusCard.vue
│   │   ├── VoteResult.vue
│   │   └── PlayerStatus.vue
│   ├── Vote/          # /vote 頁面的組件
│   │   ├── VoteForm.vue
│   │   ├── DrawResult.vue
│   │   └── PlayerStatus.vue
│   └── Shared/        # 共用的組件（如抽籤結果、倒數計時器等）
├── pinia/             # Pinia 狀態管理
│   └── store.ts       # 管理遊戲狀態
├── App.vue            # 主組件（只負責切換路由）
├── main.ts            # Vue 3 入口檔
├── router.ts          # Vue Router 配置檔（/dashboard 與 /vote）
└── main.js            # 若使用 Vue 2（不建議）

📋 三、功能需求詳細說明
🎮 1. /dashboard（Admin 使用者）
🧩 功能需求
顯示所有玩家的對決狀態（如當前圖片、倒數計時器、答對或跳過後的答案文字）
顯示投票結果（如玩家1 vs 玩家2 的得票數）
顯示玩家狀態（如命数、主題狀態、是否淘汰、連勝獎勵）
顯示抽籤結果（如計時器優勢、保護性獎勵）
可以啟動抽籤（Admin 頁面提供按鈕）
📦 狀態管理（Pinia）
使用 useGameStore 管理：
玩家資料（名字、命数、主題狀態、連勝獎勵）
投票結果（玩家1 vs 玩家2 的得票數）
抽籤結果（計時器優勢 or 保護性獎勵）
當前對決狀態（圖片、倒數計時器、答對或跳過後的答案）
🗳 2. /vote（Participant 使用者）
🧩 功能需求
顯示當前對決雙方名字
未參與玩家可按鈕投票預測勝者
顯示目前投票結果（與 /dashboard 同步）
顯示個人狀態（如答對次數、是否可啟動復活）
可參與抽籤（Participant 頁面提供按鈕）
抽籤結果自動同步至 /dashboard（與 Admin 共享狀態）
📦 狀態管理（Pinia）
使用 useGameStore 管理：
投票結果（玩家1 vs 玩家2 的得票數）
玩家答對次數（可手動或自動累加）
抽籤結果（計時器優勢 or 保護性獎勵）
玩家狀態（如是否答對、是否淘汰）
📦 四、Pinia 狀態管理模組（store.ts）
Ts

Apply
// pinia/store.ts
import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
  state: () => ({
    players: [
      {
        name: '',
        lives: 3,
        themes: [
          { id: 1, status: 'active' },
          { id: 2, status: 'completed' },
          { id: 3, status: 'lost' },
        ],
        consecutiveWins: 0,
        rewards: [],
      },
      {
        name: '',
        lives: 3,
        themes: [
          { id: 1, status: 'active' },
          { id: 2, status: 'completed' },
          { id: 3, status: 'lost' },
        ],
        consecutiveWins: 0,
        rewards: [],
      },
    ],
    votes: {
      player1: 0,
      player2: 0,
    },
    playerCorrectAnswers: {
      player1: 0,
      player2: 0,
    },
    consecutiveWinReward: null, // 抽選結果（計時器優勢 or 保護性獎勵）
    currentImage: '', // 畫面1的圖片
    answerText: '', // 答案文字
    countdown1: 30, // 玩家1的倒數
    countdown2: 30, // 玩家2的倒數
    currentTheme: null, // 當前主題（從畫面2傳入）
    drawResult: null, // 抽選結果
    rewardApplied: false, // 是否已同步至畫面2
  }),
  actions: {
    // 倒數計時器邏輯
    startCountdown(player: 'player1' | 'player2') {
      let timer = 30
      const interval = setInterval(() => {
        if (player === 'player1') {
          this.countdown1 = timer
        } else {
          this.countdown2 = timer
        }
        timer--
        if (timer < 0) {
          clearInterval(interval)
        }
      }, 1000)
    },
    // 抽選獎勵邏輯
    drawConsecutiveReward() {
      const rewards = ['計時器優勢', '保護性獎勵']
      this.consecutiveWinReward = rewards[Math.floor(Math.random() * rewards.length)]
    },
    // 同步抽選結果至畫面2
    applyConsecutiveWinReward() {
      if (this.consecutiveWinReward) {
        this.players[0].rewards.push(this.consecutiveWinReward)
        this.rewardApplied = true
      }
    },
  },
})
📌 五、路由設定（router.ts）
Ts

Apply
// router.ts
import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from './views/Dashboard.vue'
import Vote from './views/Vote.vue'

const routes = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
  },
  {
    path: '/vote',
    name: 'Vote',
    component: Vote,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router