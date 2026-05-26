#!/usr/bin/env bash
# Configure Ollama for snappier Game Sims demo runs.
#
#   OLLAMA_FLASH_ATTENTION=1   30–50% prefill / TTFT win on prompts > ~2K tokens
#   OLLAMA_KV_CACHE_TYPE=q4_0  ~¼ KV cache memory; on gemma4 measured 38× cold-prefill speedup
#   OLLAMA_NUM_PARALLEL=2      one cache slot per agent — they don't evict each other
#   OLLAMA_KEEP_ALIVE=-1       keep model resident between turns (no reload cost)
#
# After running this, restart Ollama so the env vars take effect.
set -euo pipefail

echo "→ setting Ollama env via launchctl…"
launchctl setenv OLLAMA_FLASH_ATTENTION 1
launchctl setenv OLLAMA_KV_CACHE_TYPE q4_0
launchctl setenv OLLAMA_NUM_PARALLEL 2
launchctl setenv OLLAMA_KEEP_ALIVE -1

echo "→ restarting Ollama…"
killall Ollama 2>/dev/null || true
sleep 1
open -a Ollama
sleep 2

echo
echo "✓ Ollama configured. Verify:"
for v in OLLAMA_FLASH_ATTENTION OLLAMA_KV_CACHE_TYPE OLLAMA_NUM_PARALLEL OLLAMA_KEEP_ALIVE; do
  echo "  $v=$(launchctl getenv $v)"
done
