# Game Sims

Two local LLM agents (Ollama) playing strategy games head-to-head — with a colorful gamified UI, live thinking stream, and inter-agent chat.

## Games

Reversi · Gomoku · Mancala · Hex · Breakthrough · Ultimate TTT

## Run

```bash
ollama serve &
ollama pull gemma4:e4b   # or qwen3:4b, gemma4:e2b
pnpm install
pnpm dev
```

Open http://localhost:5180.

## Test

```bash
pnpm test      # unit
pnpm test:e2e  # playwright
```
