# Local LAN Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the app self-contained on one port so 10 phones on a shared hotspot can connect to the laptop by IP with no configuration.

**Architecture:** Express serves the built Vue SPA from `dist/`. Socket.IO shares the same HTTP server and same port. The socket client connects with `io()` (no URL) so it always targets the host that served the page — no hardcoded IP anywhere.

**Tech Stack:** Node.js 18+, Express 4, Socket.IO 4, Vue 3 + Vite

## Global Constraints

- Single port: 3001
- No environment variables required — zero config at runtime
- State is in-memory; restarting the server resets vote state (acceptable)
- No HTTPS required for LAN use

---

### Task 1: Install express and add start script

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: `npm start` command that runs `node server.js`

- [ ] **Step 1: Install express**

```bash
npm install express
```

Expected output: express added to `dependencies` in `package.json`

- [ ] **Step 2: Add start script to package.json**

Open `package.json`. In the `"scripts"` block, add one line:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "server": "node server.js",
    "start": "node server.js"
  }
}
```

- [ ] **Step 3: Verify express installed**

```bash
node -e "import('express').then(() => console.log('ok'))"
```

Expected: `ok`

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add express dependency and npm start script"
```

---

### Task 2: Update server.js to serve static files

**Files:**
- Modify: `server.js`

**Interfaces:**
- Consumes: `dist/` folder produced by `npm run build`
- Produces: HTTP server on :3001 that serves static files AND handles Socket.IO

- [ ] **Step 1: Replace server.js with the new version**

Open `server.js` and replace the entire contents with:

```js
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'

const app = express()
app.use(express.static('dist'))

const httpServer = createServer(app)
const io = new Server(httpServer)

let voteState = {
  currentBattle: null,
  voteResults: { player1: '', player2: '', votes1: 0, votes2: 0, voters1: [], voters2: [] },
  battleWinner: null,
  battleStartedAt: null,
  playersSnapshot: null,
  hostThemesSnapshot: null
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
  console.log('Server running on port 3001')
})
```

- [ ] **Step 2: Build the Vue app so dist/ exists**

```bash
npm run build
```

Expected: `dist/` folder created with `index.html` and assets.

- [ ] **Step 3: Start the server and verify static serving**

```bash
npm start
```

Open browser at `http://localhost:3001`. Expected: Vue app loads (login page or dashboard).

- [ ] **Step 4: Stop the server (Ctrl+C) and commit**

```bash
git add server.js
git commit -m "feat: serve static dist/ via express on same port as socket.io"
```

---

### Task 3: Update socket client to use relative connection

**Files:**
- Modify: `src/socket.ts`

**Interfaces:**
- Consumes: Socket.IO server from Task 2 (same host, port 3001)
- Produces: `socket` export that connects to whatever host served the page

- [ ] **Step 1: Update src/socket.ts**

Replace the entire file contents with:

```ts
import { io } from 'socket.io-client'

export const socket = io()
```

- [ ] **Step 2: Rebuild and verify socket connects**

```bash
npm run build
npm start
```

Open `http://localhost:3001` in browser. Open browser DevTools → Console. Expected: no connection errors. Open Network tab → WS filter → should see a websocket connection to `localhost:3001`.

- [ ] **Step 3: Commit**

```bash
git add src/socket.ts
git commit -m "feat: use relative socket.io connection so any LAN IP works"
```

---

### Task 4: End-to-end LAN verification

This task has no code changes — it verifies the full gathering flow works.

- [ ] **Step 1: Find your local IP**

```bash
ipconfig
```

Look for `無線區域網路` → `IPv4 位址`. Example: `192.168.137.5`

- [ ] **Step 2: Open the app via IP (not localhost)**

In browser, go to `http://192.168.137.5:3001` (use your actual IP).

Expected: Vue app loads correctly.

- [ ] **Step 3: Verify socket connects via IP**

DevTools → Network → WS. The WebSocket connection should show as connected to `192.168.137.5:3001` (not localhost).

- [ ] **Step 4: Test on a second device (phone)**

Connect phone to the same WiFi/hotspot. Open `http://192.168.137.5:3001` in phone browser.

Expected: app loads and real-time vote sync works between laptop browser and phone browser.

- [ ] **Step 5: Final commit if any fixes were needed**

If no fixes needed, no commit required. If fixes were needed, commit them with a descriptive message.
