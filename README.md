1. **Admin Users** → Navigate to `/dashboard` to manage the game
2. **Participants** → Navigate to `/vote` to participate and vote

The application uses Pinia for centralized state management, ensuring all data is synchronized between admin and participant views.

/vote 那邊應該要先登入 ( line 上面名字 )
然後進去 vote 之後可以投票、看看玩家 status (看status的功能，主畫面也有，兩邊要一致)

主要的事情都發生在 dashboard。 
抽挑戰者 -> 挑戰者去"玩家狀態" 頁面挑戰它自己以外的玩家 -> 開始battle (這次遊戲的主題就會是被選中的玩家的第一個主題)

battle 規則:
理論上一開始顯示的是遊玩主題的 1.jpg 按下下一題後應該要顯示2.jpg 一路往下 直到有一方秒數耗盡

battle 後
被挑戰方如果勝利，被挑戰方第一個主題會變為 對方的第一順位主題 。
挑戰者的第一順位主題則會被消耗掉 (給他一個 false boolean，並且玩家狀態 section 裡面渲染時，將 false 的theme渲染為灰色)

挑戰方如果勝利，挑戰方的第一個主題不會有變化，而被挑戰方(輸了)的第一主題會被消耗掉(一樣給他一個flase boolean .... 同上)

一個玩家還剩餘的主題就等於它還持有的命。 命被消耗完就被淘汰了

那點選挑戰者的時候 就直接讓他點玩家就代表要挑戰他了吧 不用讓挑戰者還要點特定的主題 因為其實他只能固定挑戰stack最頂層的主題 

# The Cat Floor - Game Application

A Vue 3 + Pinia web application for managing a competitive cat-themed game with Admin Dashboard and Participant Voting interfaces.

## Project Structure

```
src/
├── assets/                      # Static resources
├── components/
│   ├── Dashboard/              # Admin dashboard components
│   │   ├── StatusCard.vue
│   │   ├── VoteResult.vue
│   │   └── PlayerStatus.vue
│   ├── Vote/                   # Participant voting components
│   │   ├── VoteForm.vue
│   │   ├── DrawResult.vue
│   │   └── PlayerStatus.vue
│   └── Shared/                 # Shared components
│       └── CountdownTimer.vue
├── pinia/
│   └── store.ts                # Game state management
├── views/
│   ├── DashboardView.vue       # Admin page
│   └── VoteView.vue            # Participant page
├── App.vue                      # Root component
├── main.ts                      # Entry point
└── router.ts                    # Vue Router config
```

## Features

### Admin Dashboard (/dashboard)
- View current battle status
- Monitor voting results in real-time
- Track player status (lives, correct answers, win streak)
- View draw results
- Start demo battles

### Participant Voting (/vote)
- Vote for matchup predictions
- See live vote counts
- Participate in draws
- View personal stats



