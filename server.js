import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST']
  }
})

let voteState = {
  currentBattle: null,
  voteResults: { player1: '', player2: '', votes1: 0, votes2: 0, voters1: [], voters2: [] },
  battleWinner: null,
  battleStartedAt: null
}

io.on('connection', (socket) => {
  console.log('client connected:', socket.id)
  socket.emit('voteState', voteState)

  socket.on('pushVoteState', (state) => {
    if (!state || typeof state !== 'object') return
    voteState = state
    socket.broadcast.emit('voteState', voteState)
  })

  socket.on('recordVote', ({ playerChoice, voterName }) => {
    if (!voterName) return
    const vr = voteState.voteResults
    if (!vr) return

    const hasVotedFor1 = vr.voters1.includes(voterName)
    const hasVotedFor2 = vr.voters2.includes(voterName)

    if (hasVotedFor1 && playerChoice !== 1) {
      vr.votes1--
      vr.voters1 = vr.voters1.filter(n => n !== voterName)
    } else if (hasVotedFor2 && playerChoice !== 2) {
      vr.votes2--
      vr.voters2 = vr.voters2.filter(n => n !== voterName)
    }

    if (playerChoice === 1 && !hasVotedFor1) {
      vr.votes1++
      vr.voters1.push(voterName)
    } else if (playerChoice === 2 && !hasVotedFor2) {
      vr.votes2++
      vr.voters2.push(voterName)
    }

    io.emit('voteState', voteState)
  })

  socket.on('disconnect', () => {
    console.log('client disconnected:', socket.id)
  })
})

httpServer.listen(3001, () => {
  console.log('Socket server running on port 3001')
})
