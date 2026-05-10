import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface Voter {
  name: string
}

// Theme 数据结构
export interface ThemeData {
  name: string
  photos: string[] // 35 ~ 50 张照片
  isConsumed: boolean // 已使用/消耗的主題
}

// Theme Stack类 - 存储ThemeData对象
export class ThemeStack {
  items: ThemeData[] = []

  constructor(themes: ThemeData[] = []) {
    this.items = [...themes]
  }

  push(theme: ThemeData): void {
    this.items.push(theme)
  }

  pop(): ThemeData | undefined {
    return this.items.pop()
  }

  peek(): ThemeData | undefined {
    return this.items[this.items.length - 1]
  }

  size(): number {
    return this.items.length
  }

  isEmpty(): boolean {
    return this.items.length === 0
  }

  getAll(): ThemeData[] {
    return [...this.items]
  }
}

interface Player {
  name: string
  themeStack: ThemeStack
  correct: number
  eliminated: boolean
  winStreak: number
  reward: string | null
}

interface VoteResult {
  player1: string
  player2: string
  votes1: number
  votes2: number
  voters1: string[]
  voters2: string[]
}

interface DrawResult {
  winner: string
  reward: string | null
}

interface ChallengerResult {
  challenger: Player
}

interface GameState {
  currentVoter: Voter | null
  players: Player[]
  currentBattle: {
    player1Name: string
    player2Name: string
    image: string
    timeRemaining: number
  } | null
  voteResults: VoteResult | null
  drawResults: DrawResult | null
  wheelPlayers: Player[] // 輪盤中的玩家
  eliminatedPlayers: string[] // 永久移除的玩家名稱
  currentChallenger: ChallengerResult | null
}

export const useGameStore = defineStore('game', () => {
  // State
  const state = ref<GameState>({
    currentVoter: null,
    players: [], // 将通过config初始化
    currentBattle: null,
    voteResults: {
      player1: 'Player 1',
      player2: 'Player 2',
      votes1: 0,
      votes2: 0,
      voters1: [],
      voters2: []
    },
    drawResults: null,
    wheelPlayers: [], // 初始為空，稍後初始化
    eliminatedPlayers: [],
    currentChallenger: null
  })

  // Getters
  const players = computed(() => state.value.players)
  const currentVoter = computed(() => state.value.currentVoter)
  const currentBattle = computed(() => state.value.currentBattle)
  const voteResults = computed(() => state.value.voteResults)
  const drawResults = computed(() => state.value.drawResults)
  const activePlayers = computed(() => state.value.players.filter(p => !p.eliminated))
  const wheelPlayers = computed(() => state.value.wheelPlayers)
  const currentChallenger = computed(() => state.value.currentChallenger)

  // Actions
  function login(userName: string) {
    state.value.currentVoter = { name: userName }
  }

  function logout() {
    state.value.currentVoter = null
  }

  function addPlayer(player: Player) {
    state.value.players.push(player)
  }

  function updatePlayer(name: string, updates: Partial<Player>) {
    const player = state.value.players.find(p => p.name === name)
    if (player) {
      Object.assign(player, updates)
    }
  }

  function applyWinReward(playerName: string, reward: string) {
    const player = state.value.players.find(p => p.name === playerName)
    if (player) {
      player.reward = reward
    }
  }

  function startBattle(player1Name: string, player2Name: string, image: string) {
    state.value.currentBattle = {
      player1Name,
      player2Name,
      image,
      timeRemaining: 10
    }
  }

  function endBattle() {
    state.value.currentBattle = null
  }

  function recordVote(playerChoice: number, voterName: string) {
    if (!state.value.voteResults) return

    // 检查用户是否已经投过票
    const hasVotedFor1 = state.value.voteResults.voters1.includes(voterName)
    const hasVotedFor2 = state.value.voteResults.voters2.includes(voterName)

    // 如果用户已经投过票，先从之前的选项中移除
    if (hasVotedFor1 && playerChoice !== 1) {
      state.value.voteResults.votes1 -= 1
      state.value.voteResults.voters1 = state.value.voteResults.voters1.filter(name => name !== voterName)
    } else if (hasVotedFor2 && playerChoice !== 2) {
      state.value.voteResults.votes2 -= 1
      state.value.voteResults.voters2 = state.value.voteResults.voters2.filter(name => name !== voterName)
    }

    // 为新的选项投票
    if (playerChoice === 1 && !hasVotedFor1) {
      state.value.voteResults.votes1 += 1
      state.value.voteResults.voters1.push(voterName)
    } else if (playerChoice === 2 && !hasVotedFor2) {
      state.value.voteResults.votes2 += 1
      state.value.voteResults.voters2.push(voterName)
    }
  }

  function recordDrawResult(winner: string, reward: string) {
    state.value.drawResults = {
      winner,
      reward
    }
  }

  function resetVotes() {
    if (state.value.voteResults) {
      state.value.voteResults.votes1 = 0
      state.value.voteResults.votes2 = 0
      state.value.voteResults.voters1 = []
      state.value.voteResults.voters2 = []
    }
  }

  function initializeWheel() {
    state.value.wheelPlayers = state.value.players.filter(p => !state.value.eliminatedPlayers.includes(p.name))
  }

  function drawFromWheel(): Player | null {
    if (state.value.wheelPlayers.length === 0) return null
    const randomIndex = Math.floor(Math.random() * state.value.wheelPlayers.length)
    const selectedPlayer = state.value.wheelPlayers[randomIndex]
    state.value.wheelPlayers.splice(randomIndex, 1)
    return selectedPlayer
  }

  function resetWheel() {
    state.value.wheelPlayers = state.value.players.filter(p => !state.value.eliminatedPlayers.includes(p.name))
  }

  function permanentlyRemovePlayer(playerName: string) {
    if (!state.value.eliminatedPlayers.includes(playerName)) {
      state.value.eliminatedPlayers.push(playerName)
    }
    // 從輪盤中移除
    state.value.wheelPlayers = state.value.wheelPlayers.filter(p => p.name !== playerName)
  }

  function setChallenger(player: Player) {
    state.value.currentChallenger = { challenger: player }
  }

  function clearChallenger() {
    state.value.currentChallenger = null
  }

  /**
   * 创建一个新玩家
   * @param name 玩家名字
   * @param themes 四个主题的数组
   */
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

  /**
   * 从config配置初始化所有玩家
   * @param playersConfig 玩家配置数组
   */
  function initializePlayersFromConfig(playersConfig: Array<{ name: string; themes: Array<{ name: string; photos: string[]; isConsumed: boolean }> }>): void {
    const initializedPlayers: Player[] = playersConfig.map(playerConfig => {
      const themeDataArray: ThemeData[] = playerConfig.themes.map(theme => ({
        name: theme.name,
        photos: theme.photos,
        isConsumed: theme.isConsumed ?? false
      }))
      return createPlayer(playerConfig.name, themeDataArray)
    })
    
    state.value.players = initializedPlayers
    state.value.wheelPlayers = [...initializedPlayers]
    // state.value.voteResults.player1 = initializedPlayers[0]?.name || ''
    // state.value.voteResults.player2 = initializedPlayers[1]?.name || ''
  }

  /**
   * 当玩家输了一次后，pop掉最上面的主题
   * @param playerName 玩家名字
   */
  function popThemeForLoser(playerName: string): ThemeData | undefined {
    const player = state.value.players.find(p => p.name === playerName)
    if (player && !player.themeStack.isEmpty()) {
      return player.themeStack.pop()
    }
    return undefined
  }

  /**
   * 获取玩家的剩余lives（即stack中剩余的theme数）
   * @param playerName 玩家名字
   */
  function getPlayerLives(playerName: string): number {
    const player = state.value.players.find(p => p.name === playerName)
    return player ? player.themeStack.size() : 0
  }

  return {
    state,
    players,
    currentVoter,
    currentBattle,
    voteResults,
    drawResults,
    activePlayers,
    wheelPlayers,
    currentChallenger,
    login,
    logout,
    addPlayer,
    updatePlayer,
    startBattle,
    endBattle,
    recordVote,
    applyWinReward,
    recordDrawResult,
    resetVotes,
    initializeWheel,
    drawFromWheel,
    resetWheel,
    permanentlyRemovePlayer,
    setChallenger,
    clearChallenger,
    createPlayer,
    initializePlayersFromConfig,
    popThemeForLoser,
    getPlayerLives
  }
})
