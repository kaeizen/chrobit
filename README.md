# Routine

Routine is a progressive web app for building and running timed routines. Create a sequence of tasks with durations, group repeating blocks, and play through them with a guided timer—audio cues, pause/skip, and screen wake lock included. Use it for workouts, cooking, skincare, cleaning, focus blocks, or any step-by-step activity that needs a clock.

## Features

- **Routine builder** — Drag-and-drop editor for tasks and repeating groups, with optional transition steps between items
- **Guided player** — Visual timer ring, play/pause/skip, step labels, and audio feedback when steps advance or finish
- **Share & import** — Export routines as JSON or compact QR codes; scan or open a link to import on another device
- **Offline-first PWA** — Installable on phone and desktop; routines are stored locally in the browser

## Project layout

| Package | Description |
|---------|-------------|
| [`packages/web`](packages/web) | React + Vite frontend (PWA) |
| [`packages/shared`](packages/shared) | Shared TypeScript types |

The repo also includes a backend package (`packages/api`) for a future release with accounts and cloud sync. Early versions use the web app only and do not require a server.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 10+

## Quick start

1. **Install dependencies** (from the repo root)

   ```bash
   pnpm install
   ```

2. **Run the web app**

   ```bash
   pnpm --filter @routine/web dev
   ```

   Open [http://localhost:5173](http://localhost:5173).

3. **Production build**

   ```bash
   pnpm --filter @routine/web build
   pnpm --filter @routine/web preview
   ```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm --filter @routine/web dev` | Start the dev server |
| `pnpm --filter @routine/web build` | Production build |
| `pnpm typecheck` | Typecheck all packages |

## How routines work

A **routine** is an ordered list of **items**:

- **Task** — A named step with a duration in seconds
- **Group** — A named block of tasks that repeats a set number of times

**Transition tasks** can be attached to a routine or group; the player inserts them automatically between steps during playback.

The player flattens groups into a linear step list (with labels like “Round 2 of 3”) and advances the timer automatically when each step completes.

## Tech stack

- **Frontend:** React 18, React Router, Zustand, Tailwind CSS 4, Vite, vite-plugin-pwa
- **DnD:** @dnd-kit (routine builder)
- **Sharing:** QR codes via `qrcode`
- **Storage:** Browser `localStorage`

## License

Private — not licensed for redistribution unless otherwise noted.
