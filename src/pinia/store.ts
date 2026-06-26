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
  capturedFrom?: string // 從哪位玩家奪取來的
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
    return this.items.filter(t => !t.isConsumed && t.isActivated).length
  }

  peekActive(): ThemeData | undefined {
    for (let i = 0; i < this.items.length; i++) {
      if (!this.items[i].isConsumed && this.items[i].isActivated) return this.items[i]
    }
    return undefined
  }

  activeCount(): number {
    return this.items.filter(t => !t.isConsumed && t.isActivated).length
  }
}

export interface Player {
  name: string
  themeStack: ThemeStack
  correct: number
  eliminated: boolean
  winStreak: number
  prop: 'time' | 'shield' | null
  pendingTimeBonuses: number[]
}

interface VoteResult {
  player1: string
  player2: string
  votes1: number
  votes2: number
  voters1: string[]
  voters2: string[]
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
  timePropBonus: Record<string, number>
  battleStartedAt: number | null
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
    eliminatedPlayers: [],
    wheelPlayerNames: null,
    currentChallenger: null,
    challengerTimer: 45, // 請不要刪掉這註解。只是宣告一個初始值 實際開始battle的時候時間都會被調整成45 或 45+道具
    defenderTimer: 45, //但不能刪掉 這欄位至少要留著
    currentTimerPlayer: null,
    isTimerRunning: false,
    battleWinner: null,
    hostThemes: [],
    hostCurrentTheme: null,
    timePropBonus: {},
    battleStartedAt: null
  })

  // Getters
  const players = computed(() => state.value.players)
  const currentVoter = computed(() => state.value.currentVoter)
  const currentBattle = computed(() => state.value.currentBattle)
  const voteResults = computed(() => state.value.voteResults)
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
  const battleStartedAt = computed(() => state.value.battleStartedAt)
  const tournamentWinner = computed<string | null>(() => {
    const alive = activePlayers.value
    return alive.length === 1 ? alive[0].name : null
  })

  // Actions
  function login(userName: string) {
    state.value.currentVoter = { name: userName }
  }

  function logout() {
    state.value.currentVoter = null
  }

  function applyProp(playerName: string, prop: 'time' | 'shield') {
    const player = state.value.players.find(p => p.name === playerName)
    if (player) player.prop = prop
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

  function resetVotes() {
    if (state.value.voteResults) {
      state.value.voteResults.votes1 = 0
      state.value.voteResults.votes2 = 0
      state.value.voteResults.voters1 = []
      state.value.voteResults.voters2 = []
    }
  }

  function permanentlyRemovePlayer(playerName: string) {
    const player = state.value.players.find(p => p.name === playerName)
    if (player) player.eliminated = true
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

  function removeFromWheel(name: string) {
    if (!state.value.wheelPlayerNames) return
    state.value.wheelPlayerNames = state.value.wheelPlayerNames.filter(n => n !== name)
  }

  function resetWinStreak(playerName: string) {
    const player = state.value.players.find(p => p.name === playerName)
    if (!player) return
    player.winStreak = 0
    player.pendingTimeBonuses = []
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

  const selectableThemeKeys = computed<Set<string>>(() => {
    const keys = new Set<string>()
    const challengerName = state.value.currentChallenger?.challenger.name ?? null
    for (const player of state.value.players) {
      if (player.eliminated) continue
      if (player.name === challengerName) continue
      const items = player.themeStack.items
      for (let i = 0; i < items.length; i++) {
        const t = items[i]
        if (!t.isConsumed && t.isActivated) {
          keys.add(`${player.name}:${t.name}`)
          break
        }
      }
    }
    return keys
  })

  function activateRevivalTheme(playerName: string): void {
    const player = state.value.players.find(p => p.name === playerName)
    if (!player) return
    const revivalTheme = player.themeStack.items.find(t => !t.isActivated)
    if (revivalTheme) revivalTheme.isActivated = true
  }

  function consumeProp(playerName: string): void {
    const player = state.value.players.find(p => p.name === playerName)
    if (player) player.prop = null
  }

  function consumePendingBonus(playerName: string, seconds: number): void {
    const player = state.value.players.find(p => p.name === playerName)
    if (!player) return
    const idx = player.pendingTimeBonuses.indexOf(seconds)
    if (idx !== -1) player.pendingTimeBonuses.splice(idx, 1)
  }

  function applyTimeProp(playerName: string, seconds: number): void {
    state.value.timePropBonus[playerName] = (state.value.timePropBonus[playerName] ?? 0) + seconds
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
      prop: null,
      pendingTimeBonuses: []
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
    const challengerBonus = state.value.timePropBonus[challengerName] ?? 0
    const defenderBonus   = state.value.timePropBonus[defenderName]   ?? 0
    state.value.currentBattle = {
      player1Name: challengerName,
      player2Name: defenderName,
      image: photos[0] || ''
    }
    state.value.challengerTimer = 12 + challengerBonus
    state.value.defenderTimer   = 12 + defenderBonus
    delete state.value.timePropBonus[challengerName]
    delete state.value.timePropBonus[defenderName]
    state.value.currentTimerPlayer = challengerName
    state.value.isTimerRunning = true
    state.value.battleStartedAt = Date.now()
    state.value.battleWinner = null
    if (state.value.voteResults) {
      state.value.voteResults.player1 = challengerName
      state.value.voteResults.player2 = defenderName
      state.value.voteResults.votes1 = 0
      state.value.voteResults.votes2 = 0
      state.value.voteResults.voters1 = []
      state.value.voteResults.voters2 = []
    }
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

  function incrementCorrectVoters(winnerName: string): void {
    const battle = state.value.currentBattle
    const vr = state.value.voteResults
    if (!battle || !vr) return
    const correctVoters = winnerName === battle.player1Name ? vr.voters1 : vr.voters2
    for (const voterName of correctVoters) {
      const player = state.value.players.find(p => p.name === voterName)
      if (player) player.correct += 1
    }
  }

  function processBattleResult(winnerName: string) {
    const battle = state.value.currentBattle
    if (!battle || state.value.battleWinner) return

    const player1Name = battle.player1Name
    const player2Name = battle.player2Name
    const isHostInvolved = player1Name === '主持人' || player2Name === '主持人'

    if (isHostInvolved) {
      if (state.value.hostCurrentTheme) {
        state.value.hostCurrentTheme.isConsumed = true
      }
      incrementCorrectVoters(winnerName)
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
      const challengerTopTheme = loser.themeStack.peekActive()
      if (defenderTopTheme) defenderTopTheme.isConsumed = true
      if (challengerTopTheme) {
        challengerTopTheme.isConsumed = true
        winner.themeStack.items.unshift({ ...challengerTopTheme, isConsumed: false, capturedFrom: loserName })
      }
    } else {
      const defenderTopTheme = defender.themeStack.peekActive()
      if (defenderTopTheme) defenderTopTheme.isConsumed = true
    }

    if (loser.themeStack.activeCount() === 0) loser.eliminated = true

    winner.winStreak += 1
    if (winner.winStreak === 4) {
      winner.pendingTimeBonuses.push(7)
    } else if (winner.winStreak === 2) {
      winner.pendingTimeBonuses.push(3)
    }
    if (loser.eliminated) {
      winner.pendingTimeBonuses.push(5)
    }

    loser.winStreak = 0
    loser.pendingTimeBonuses = []
    incrementCorrectVoters(winnerName)
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
    state.value.challengerTimer = 45
    state.value.defenderTimer = 45
    state.value.currentTimerPlayer = null
    state.value.isTimerRunning = false
    state.value.battleWinner = null
    state.value.timePropBonus = {}
    state.value.battleStartedAt = null
  }

  function applyVoteState(incoming: {
    currentBattle: GameState['currentBattle']
    voteResults: NonNullable<GameState['voteResults']>
    battleWinner: string | null
    battleStartedAt: number | null
    playersSnapshot?: Array<{
      name: string
      eliminated: boolean
      winStreak: number
      prop: 'time' | 'shield' | null
      correct?: number
      themeItems: Array<{ name: string; isConsumed: boolean; isActivated: boolean; capturedFrom?: string }>
    }> | null
    hostThemesSnapshot?: Array<{
      name: string
      isConsumed: boolean
    }> | null
  }) {
    state.value.currentBattle = incoming.currentBattle
    state.value.voteResults = incoming.voteResults
    state.value.battleWinner = incoming.battleWinner
    state.value.battleStartedAt = incoming.battleStartedAt ?? null

    if (state.value.currentVoter !== null) {
      if (incoming.playersSnapshot) {
        for (const snap of incoming.playersSnapshot) {
          const player = state.value.players.find(p => p.name === snap.name)
          if (!player) continue
          player.eliminated = snap.eliminated
          player.winStreak = snap.winStreak
          player.prop = snap.prop
          if (snap.correct !== undefined) player.correct = snap.correct
          // Sync theme flags by name; preserve existing photos/answers.
          // If a theme is new (winner gained loser's theme), push it with empty media —
          // vote page only renders theme names, so empty photos/answers are fine there.
          for (const snapTheme of snap.themeItems) {
            const existing = player.themeStack.items.find(t => t.name === snapTheme.name)
            if (existing) {
              existing.isConsumed = snapTheme.isConsumed
              existing.isActivated = snapTheme.isActivated
              if (snapTheme.capturedFrom !== undefined) existing.capturedFrom = snapTheme.capturedFrom
            } else {
              player.themeStack.items.push({
                name: snapTheme.name,
                photos: [],
                answers: [],
                isConsumed: snapTheme.isConsumed,
                isActivated: snapTheme.isActivated,
                capturedFrom: snapTheme.capturedFrom
              })
            }
          }
        }
      }

      if (incoming.hostThemesSnapshot) {
        for (const snap of incoming.hostThemesSnapshot) {
          const theme = state.value.hostThemes.find(t => t.name === snap.name)
          if (theme) {
            theme.isConsumed = snap.isConsumed
          } else {
            state.value.hostThemes.push({
              name: snap.name,
              photos: [],
              answers: [],
              isConsumed: snap.isConsumed,
              isActivated: true
            })
          }
        }
      }
    }
  }

  return {
    state,
    players,
    currentVoter,
    currentBattle,
    voteResults,
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
    battleStartedAt,
    tournamentWinner,
    login,
    logout,
    startBattle,
    endBattle,
    recordVote,
    applyProp,
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
    removeFromWheel,
    resetWinStreak,
    setHostCurrentTheme,
    initializeHostThemes,
    hostThemes,
    selectableThemeKeys,
    activateRevivalTheme,
    consumeProp,
    applyTimeProp,
    consumePendingBonus,
    applyVoteState,
    incrementCorrectVoters
  }
})
