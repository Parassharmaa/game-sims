import { useState } from 'react'
import type { BotConfig } from '@/lib/llm'
import type { GameEngine } from '@/games/types'
import { cn } from '@/lib/cn'

interface Props {
  bot: BotConfig
  legalMoves: unknown[]
  engine: GameEngine<unknown, unknown>
  onSendChat: (text: string) => void
  onSubmitMove: (move: unknown) => void
  /** Disable inputs (e.g. when game is paused). */
  disabled?: boolean
}

export function HumanMoveInput({
  bot,
  legalMoves,
  engine,
  onSendChat,
  onSubmitMove,
  disabled,
}: Props) {
  const [moveText, setMoveText] = useState('')
  const [chatText, setChatText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submitMove = () => {
    setError(null)
    const trimmed = moveText.trim()
    if (!trimmed) {
      setError('Type a move first.')
      return
    }
    const parsed = engine.parseMove({ move: trimmed }, legalMoves)
    if (!parsed) {
      setError(`"${trimmed}" is not a legal move.`)
      return
    }
    setMoveText('')
    onSubmitMove(parsed)
  }

  const sendChat = () => {
    const trimmed = chatText.trim()
    if (!trimmed) return
    onSendChat(trimmed)
    setChatText('')
  }

  const sampleLegal = legalMoves
    .slice(0, 8)
    .map((m) => engine.describeMove(m))
    .join(', ')

  return (
    <div
      className="nb-card-lg p-4 relative flex flex-col gap-3"
      style={{ background: bot.accent }}
      data-testid="human-input"
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">🎮</span>
        <span className="font-bold uppercase tracking-wider text-xs">
          {bot.name} {bot.emoji} — your turn
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={chatText}
          onChange={(e) => setChatText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendChat()
          }}
          disabled={disabled}
          placeholder="Say something to your opponent (optional)…"
          className="flex-1 px-3 py-2 rounded-xl border-[3px] border-black text-sm bg-white"
          data-testid="human-chat-input"
        />
        <button
          type="button"
          className="nb-btn"
          onClick={sendChat}
          disabled={disabled}
          data-testid="human-chat-send"
        >
          💬 Send
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={moveText}
          onChange={(e) => setMoveText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitMove()
          }}
          disabled={disabled}
          placeholder={`Your move (e.g. ${
            legalMoves[0] ? engine.describeMove(legalMoves[0]) : 'D3'
          })`}
          className="flex-1 px-3 py-2 rounded-xl border-[3px] border-black text-sm bg-white font-mono"
          data-testid="human-move-input"
        />
        <button
          type="button"
          className={cn('nb-btn')}
          style={{ background: '#0a0a0a', color: '#fff' }}
          onClick={submitMove}
          disabled={disabled}
          data-testid="human-move-submit"
        >
          ▶ Submit move
        </button>
      </div>

      {error && (
        <div className="text-xs font-bold text-red-900 bg-white/70 px-2 py-1 rounded">
          ⚠ {error}
        </div>
      )}

      <div className="text-[11px] opacity-80">
        <b>Legal moves</b> ({legalMoves.length}): {sampleLegal}
        {legalMoves.length > 8 && ` … +${legalMoves.length - 8} more`}
      </div>
    </div>
  )
}
