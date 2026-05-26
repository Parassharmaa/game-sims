import { useEffect, useRef } from 'react'
import type { BotConfig } from '@/lib/llm'
import { cn } from '@/lib/cn'

interface Props {
  bot: BotConfig
  text: string
  visible: boolean
  /** Which side the speech-bubble pointer should sit on. */
  side?: 'left' | 'right'
}

/** Hide the JSON tail so viewers see only the model's prose. */
function trimToProse(text: string): string {
  const brace = text.indexOf('{')
  return (brace === -1 ? text : text.slice(0, brace)).trimEnd()
}

/**
 * A speech bubble that streams the model's prose while it "thinks out loud".
 * Hidden once the move is committed. The pointer aligns to whichever bot
 * card the bubble belongs to (left = Player A, right = Player B).
 */
export function ThinkingBubble({ bot, text, visible, side = 'left' }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [text])
  if (!visible) return null
  return (
    <div
      className="nb-card-lg p-4 relative"
      style={{ background: bot.accent }}
      data-testid="thinking-bubble"
      data-side={side}
    >
      <div
        className={cn(
          'absolute -top-3 w-6 h-6 border-[4px] border-black rotate-45',
          side === 'right' ? 'right-8' : 'left-8',
        )}
        style={{ background: bot.accent }}
      />
      <div
        className={cn(
          'flex items-center gap-2 mb-2',
          side === 'right' && 'flex-row-reverse text-right',
        )}
      >
        <span className="text-2xl">💭</span>
        <span className="font-bold uppercase tracking-wider text-xs">
          {bot.name} {bot.emoji} thinking…
        </span>
      </div>
      <div
        ref={scrollRef}
        className={cn(
          'font-mono text-sm leading-relaxed whitespace-pre-wrap min-h-[2.5rem] max-h-[180px] overflow-y-auto pr-1',
          side === 'right' && 'text-right',
        )}
      >
        {trimToProse(text) || '…'}
        <span className="inline-block w-2 h-4 ml-1 align-middle bg-black animate-pulse" />
      </div>
    </div>
  )
}
