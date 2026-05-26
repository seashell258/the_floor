import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface Voter {
  name: string
}

// Theme 数据结构
export interface ThemeData {
  name: string
  photos: string[] // 35 ~ 50 张照片
  answers: string[] // 答案
  isConsumed: boolean // 已使用/消耗的主題
  isActivated: boolean
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

  activeLives(): number {
    return this.items.filter(t => !t.isConsumed).length
  }

  peekActive(): ThemeData | undefined {
    for (let i = this.items.length - 1; i >= 0; i--) {
      if (!this.items[i].isConsumed) return this.items[i]
    }
    return undefined
  }
}

export interface Player {
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
  } | null
  voteResults: VoteResult | null
  drawResults: DrawResult | null
  eliminatedPlayers: string[] // 永久移除的玩家名稱
  wheelPlayerNames: string[] | null // null = 未初始化；[] = 全部抽完
  currentChallenger: ChallengerResult | null
  challengerTimer: number // 挑戰者剩餘時間
  defenderTimer: number // 被挑戰者剩餘時間
  currentTimerPlayer: string | null // 當前計時的玩家名字
  isTimerRunning: boolean // 是否正在計時
  battleWinner: string | null // 對戰勝利者
  hostThemes: ThemeData[]            // 主持人所有可用主題（從 config 載入）
  hostCurrentTheme: ThemeData | null // 主持人當前應戰主題
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
    eliminatedPlayers: [],
    wheelPlayerNames: null,
    currentChallenger: null,
    challengerTimer: 30,
    defenderTimer: 30,
    currentTimerPlayer: null,
    isTimerRunning: false,
    battleWinner: null,
    hostThemes: [],
    hostCurrentTheme: null
  })

  // Getters
  const players = computed(() => state.value.players)
  const currentVoter = computed(() => state.value.currentVoter)
  const currentBattle = computed(() => state.value.currentBattle)
  const voteResults = computed(() => state.value.voteResults)
  const drawResults = computed(() => state.value.drawResults)
  const activePlayers = computed(() => state.value.players.filter(p => !p.eliminated))
  const eliminatedPlayers = computed(() => state.value.eliminatedPlayers)
  const wheelPlayers = computed<Player[]>(() => {
    if (state.value.wheelPlayerNames === null) return []
    return state.value.wheelPlayerNames
      .map(name => state.value.players.find(p => p.name === name))
      .filter((p): p is Player => p !== undefined)
  })
  const wheelInitialized = computed(() => state.value.wheelPlayerNames !== null)
  const currentChallenger = computed(() => state.value.currentChallenger)
  const challengerTimer = computed(() => state.value.challengerTimer)
  const defenderTimer = computed(() => state.value.defenderTimer)
  const currentTimerPlayer = computed(() => state.value.currentTimerPlayer)
  const isTimerRunning = computed(() => state.value.isTimerRunning)
  const battleWinner = computed(() => state.value.battleWinner)

  // Actions
  function login(userName: string) {
    state.value.currentVoter = { name: userName }
  }

  function logout() {
    state.value.currentVoter = null
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
      image
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

    // 
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

  function permanentlyRemovePlayer(playerName: string) {
    if (!state.value.eliminatedPlayers.includes(playerName)) {
      state.value.eliminatedPlayers.push(playerName)
    }
    if (state.value.wheelPlayerNames) {
      state.value.wheelPlayerNames = state.value.wheelPlayerNames.filter(n => n !== playerName)
    }
  }

  function initWheel() {
    state.value.wheelPlayerNames = state.value.players
      .filter(p => !state.value.eliminatedPlayers.includes(p.name))
      .map(p => p.name)
  }

  function drawFromWheel(): Player | undefined {
    if (!state.value.wheelPlayerNames || state.value.wheelPlayerNames.length === 0) return undefined
    const idx = Math.floor(Math.random() * state.value.wheelPlayerNames.length)
    const name = state.value.wheelPlayerNames.splice(idx, 1)[0]
    return state.value.players.find(p => p.name === name)
  }

  function resetWheel() {
    state.value.wheelPlayerNames = state.value.players
      .filter(p => !state.value.eliminatedPlayers.includes(p.name))
      .map(p => p.name)
    state.value.currentChallenger = null
  }

  function setChallenger(player: Player) {
    state.value.currentChallenger = { challenger: player }
  }

  function clearChallenger() {
    state.value.currentChallenger = null
  }

  function setHostCurrentTheme(theme: ThemeData | null) {
    state.value.hostCurrentTheme = theme
  }

  function initializeHostThemes(themes: Array<{ name: string; photos: string[]; answers: string[]; isActivated: boolean }>): void {
    state.value.hostThemes = themes.map(t => ({
      name: t.name,
      photos: t.photos,
      answers: t.answers,
      isConsumed: false,
      isActivated: true
    }))
  }

  const hostThemes = computed(() => state.value.hostThemes)

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
  function initializePlayersFromConfig(playersConfig: Array<{ name: string; themes: Array<{ name: string; photos: string[]; answers: string[]; isConsumed: boolean; isActivated: boolean }> }>): void {
    const initializedPlayers: Player[] = playersConfig.map(playerConfig => {
      const themeDataArray: ThemeData[] = playerConfig.themes.map(theme => ({
        name: theme.name,
        photos: theme.photos,
        answers: theme.answers,
        isConsumed: theme.isConsumed ?? false,
        isActivated: theme.isActivated ?? true
      }))
      return createPlayer(playerConfig.name, themeDataArray)
    })

    state.value.players = initializedPlayers
  }

  function startBattleWithChallenger(challengerName: string, defenderName: string, photos: string[]) {
    state.value.currentBattle = {
      player1Name: challengerName,
      player2Name: defenderName,
      image: photos[0] || ''
    }
    state.value.challengerTimer = 5
    state.value.defenderTimer = 5
    state.value.currentTimerPlayer = challengerName
    state.value.isTimerRunning = true
    state.value.battleWinner = null
  }

  function startTimer(playerName: string) {
    state.value.currentTimerPlayer = playerName
    state.value.isTimerRunning = true
  }

  function pauseTimer() {
    state.value.isTimerRunning = false
  }

  function switchTimer() {
    if (state.value.currentTimerPlayer === state.value.currentBattle?.player1Name) {
      state.value.currentTimerPlayer = state.value.currentBattle?.player2Name || null
    } else {
      state.value.currentTimerPlayer = state.value.currentBattle?.player1Name || null
    }
  }

  function processBattleResult(winnerName: string) {
    const battle = state.value.currentBattle
    if (!battle || state.value.battleWinner) return

    const player1Name = battle.player1Name
    const player2Name = battle.player2Name
    const isHostInvolved = player1Name === '主持人' || player2Name === '主持人'

    if (isHostInvolved) {
      // Host battle: consume the host's current active theme regardless of outcome
      const activeHostTheme = state.value.hostThemes.find(t => !t.isConsumed)
      if (activeHostTheme) activeHostTheme.isConsumed = true
      state.value.battleWinner = winnerName
      return
    }

    // Regular player-vs-player battle
    const defenderName = player2Name
    const challengerName = player1Name
    const isDefenderWin = winnerName === defenderName
    const loserName = isDefenderWin ? challengerName : defenderName

    const defender = state.value.players.find(p => p.name === defenderName)
    const loser = state.value.players.find(p => p.name === loserName)
    const winner = state.value.players.find(p => p.name === winnerName)

    if (!defender || !loser || !winner) return

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

    winner.winStreak += 1
    loser.winStreak = 0
    state.value.battleWinner = winnerName
  }

  function updateTimers() {
    if (!state.value.isTimerRunning || !state.value.currentTimerPlayer) return

    if (state.value.currentTimerPlayer === state.value.currentBattle?.player1Name) {
      if (state.value.challengerTimer > 0) {
        state.value.challengerTimer -= 1
      } else {
        state.value.isTimerRunning = false
        processBattleResult(state.value.currentBattle.player2Name) // challenger time up → defender wins
      }
    } else if (state.value.currentTimerPlayer === state.value.currentBattle?.player2Name) {
      if (state.value.defenderTimer > 0) {
        state.value.defenderTimer -= 1
      } else {
        state.value.isTimerRunning = false
        processBattleResult(state.value.currentBattle.player1Name) // defender time up → challenger wins
      }
    }
  }

  function penalizeTimer(seconds: number) {
    if (!state.value.isTimerRunning || !state.value.currentTimerPlayer) return
    const battle = state.value.currentBattle
    if (!battle) return

    if (state.value.currentTimerPlayer === battle.player1Name) {
      state.value.challengerTimer -= seconds
      if (state.value.challengerTimer <= 0) {
        state.value.challengerTimer = 0
        state.value.isTimerRunning = false
        processBattleResult(battle.player2Name)
      }
    } else if (state.value.currentTimerPlayer === battle.player2Name) {
      state.value.defenderTimer -= seconds
      if (state.value.defenderTimer <= 0) {
        state.value.defenderTimer = 0
        state.value.isTimerRunning = false
        processBattleResult(battle.player1Name)
      }
    }
  }

  function resetBattle() {
    state.value.currentBattle = null
    state.value.challengerTimer = 30
    state.value.defenderTimer = 30
    state.value.currentTimerPlayer = null
    state.value.isTimerRunning = false
    state.value.battleWinner = null
  }

  return {
    state,
    players,
    currentVoter,
    currentBattle,
    voteResults,
    drawResults,
    activePlayers,
    eliminatedPlayers,
    wheelPlayers,
    wheelInitialized,
    currentChallenger,
    challengerTimer,
    defenderTimer,
    currentTimerPlayer,
    isTimerRunning,
    battleWinner,
    login,
    logout,
    startBattle,
    endBattle,
    recordVote,
    applyWinReward,
    recordDrawResult,
    resetVotes,
    permanentlyRemovePlayer,
    setChallenger,
    clearChallenger,
    createPlayer,
    initializePlayersFromConfig,
    startBattleWithChallenger,
    startTimer,
    pauseTimer,
    switchTimer,
    updateTimers,
    resetBattle,
    processBattleResult,
    penalizeTimer,
    initWheel,
    drawFromWheel,
    resetWheel,
    setHostCurrentTheme,
    initializeHostThemes,
    hostThemes
  }
})
