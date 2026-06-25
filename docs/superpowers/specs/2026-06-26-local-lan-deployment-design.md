---
title: Local LAN Deployment Design
date: 2026-06-26
status: approved
---

## Overview

Deploy The Cat Floor for periodic in-person gatherings where all participants connect to the same phone hotspot. No cloud infrastructure needed.

## Context

- ~10 participants per session
- All devices on the same phone hotspot (LAN)
- Occasional use (gatherings only, not always-on)
- Host runs a laptop; participants use phones

## Architecture

```
Laptop (connected to phone hotspot)
└── Node.js server on :3001
    ├── express.static('dist/')   → serves built Vue SPA
    └── Socket.IO                 → handles WebSocket on same port

Phones (connected to same hotspot)
└── Browser → http://192.168.x.x:3001
    ├── loads Vue app (HTTP)
    └── socket.io connects back to same host automatically
```

Frontend and backend share one port. Socket.IO client uses a relative connection (`io()`) so no IP needs to be configured anywhere.

## Changes Required

### 1. Add express dependency
```
npm install express
```

### 2. `server.js` — add static file serving

Replace `createServer()` with an express-backed server:

```js
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'

const app = express()
app.use(express.static('dist'))
const httpServer = createServer(app)
const io = new Server(httpServer)  // CORS config removed (same origin)
```

### 3. `src/socket.ts` — remove hardcoded URL

```ts
// before
export const socket = io('http://localhost:3001')

// after
export const socket = io()
```

### 4. `package.json` — add start script

```json
"start": "node server.js"
```

## Gathering Startup Procedure

1. Connect laptop to phone hotspot
2. Run `npm run build` (one-time, or after any code change)
3. Run `npm start`
4. Run `ipconfig`, find the IPv4 address under wireless adapter (e.g. `192.168.137.5`)
5. Share `192.168.137.5:3001` with participants

## Constraints

- Participants must be on the same hotspot as the laptop
- Laptop must stay on and the server running for the duration
- State is in-memory only — restarting the server resets all vote state
- No HTTPS — fine for LAN use, browsers won't prompt security warnings on local IPs
