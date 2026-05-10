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

## Tech Stack

- **Framework**: Vue 3
- **Build Tool**: Vite
- **State Management**: Pinia
- **Routing**: Vue Router
- **Language**: TypeScript
- **Styling**: Vue SFC Scoped Styles

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

## Usage

1. **Admin Users** → Navigate to `/dashboard` to manage the game
2. **Participants** → Navigate to `/vote` to participate and vote

The application uses Pinia for centralized state management, ensuring all data is synchronized between admin and participant views.
