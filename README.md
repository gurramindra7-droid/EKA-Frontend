# EKA — Enterprise Knowledge Assistant

Frontend for EKA by CW AI Labs. React + Vite + TypeScript + Material UI, Firebase Authentication,
and a React Three Fiber cinematic intro. Strictly monochrome (black / white / grey) in every mode.

```
React (this app) → Node.js / Express gateway → FastAPI RAG backend
```

The frontend only talks to the gateway through `src/services/api.ts`. It never calls the vector
database, embedding model, LLM or document pipeline directly.

## Run

```bash
npm install
cp .env.example .env.local   # optional — defaults run in mock + demo mode
npm run dev
```

- `?intro` — replay the intro (it otherwise plays once per browser session; also Settings → Replay intro)
- `?intro&introAt=7.5` — dev only: freeze the intro at a given second for visual QA
- Mock chat: ask anything; include "simulate error" to exercise the error + retry state

## Environment

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Gateway base URL (default `/api`) |
| `VITE_USE_MOCK` | `false` to use the real SSE gateway (`POST {base}/chat/stream`) |
| `VITE_FIREBASE_*` | Firebase Auth config. Unset → demo session, no login screen |

## Intro timeline (≈13 s)

| Time | Scene |
| --- | --- |
| 0 – 2 s | Black → 3D knowledge space emerges (scattered documents, nodes) |
| 2 s | ENTERPRISE / KNOWLEDGE ASSISTANT |
| 4 s | ENGINEERED BY / CODE WITH AI LABS |
| 6 s | ONE PLACE FOR / ENTERPRISE KNOWLEDGE — information starts organizing |
| 8 s | EKA — structure converges (lattice core + document ring) |
| 9 s | ENTER EKA |
| 13 s | Transition into the application |

One `requestAnimationFrame` clock drives both layers; only one text block is ever mounted, so major
text cannot overlap. The 3D canvas is the background layer only — all typography is HTML. Skip with
the SKIP INTRO control or `Esc`. Reduced-motion users get the same story with minimal movement;
without WebGL a static monochrome backdrop is shown.

## Structure

```
src/
  components/
    intro/     IntroScreen, IntroTimeline (pure timeline), KnowledgeScene (R3F), knowledgeField
    layout/    AppLayout, Sidebar, TopBar
    chat/      ChatWindow, ChatMessage, ChatInput, EmptyState, StreamingIndicator, FeedbackControls
    sources/   SourceList, SourceCard
    common/    ThemeToggle, UserMenu, SettingsDialog, ProfileDialog
    auth/      LoginScreen
  pages/       IntroPage, LoginPage, ChatPage
  services/    api (gateway + SSE), firebase, intro
  hooks/       useAuth, useChat, useTheme
  theme/       theme (light/dark tokens: palette.eka.*)
  types/       chat
```
