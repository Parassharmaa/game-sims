import { useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '@/games/types'
import type { BotConfig } from '@/lib/llm'
import { botIcon, Send } from './icons'

interface Props {
  messages: ChatMessage[]
  botA: BotConfig
  botB: BotConfig
  /** If provided, shows a small input at the bottom; calling sends as that human player. */
  onSend?: (text: string) => void
  /** Hint shown next to the send input (e.g. "as Tester"). */
  senderHint?: string
}

export function ChatPanel({ messages, botA, botB, onSend, senderHint }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState('')
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  const send = () => {
    const trimmed = draft.trim()
    if (!trimmed || !onSend) return
    onSend(trimmed)
    setDraft('')
  }

  return (
    <div className="h-full flex flex-col">
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-3"
        data-testid="chat-panel"
      >
        {messages.length === 0 && (
          <div className="text-sm italic opacity-60 text-center py-6">
            No chatter yet — maybe they’re plotting silently.
          </div>
        )}
        {messages.map((m, i) => {
          const bot = m.player === 'A' ? botA : botB
          const Icon = botIcon(bot.id)
          const align = m.player === 'A' ? 'self-start' : 'self-end'
          const tail = m.player === 'A' ? 'rounded-tl-sm' : 'rounded-tr-sm'
          return (
            <div key={i} className={`max-w-[88%] ${align}`}>
              <div className="flex items-center gap-2 mb-1 text-xs font-bold uppercase tracking-wider opacity-80">
                {m.player === 'A' ? (
                  <>
                    <Icon size={16} weight="duotone" />
                    <span>{bot.name}</span>
                    <span className="opacity-50">turn {m.turn}</span>
                  </>
                ) : (
                  <>
                    <span className="ml-auto opacity-50">turn {m.turn}</span>
                    <span>{bot.name}</span>
                    <Icon size={16} weight="duotone" />
                  </>
                )}
              </div>
              <div
                className={`nb-card p-2.5 ${tail}`}
                style={{ background: bot.accent }}
              >
                <p className="text-sm leading-snug whitespace-pre-wrap">{m.text}</p>
              </div>
            </div>
          )
        })}
      </div>
      {onSend && (
        <form
          className="border-t-[3px] border-black p-2 flex gap-2 items-center"
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
          data-testid="chat-send-form"
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={senderHint ? `Say something ${senderHint}…` : 'Say something…'}
            maxLength={280}
            className="flex-1 px-2.5 py-1.5 rounded-lg border-[2.5px] border-black text-sm bg-white"
            data-testid="chat-input"
          />
          <button
            type="submit"
            className="border-[2.5px] border-black rounded-lg p-1.5 bg-black text-white"
            data-testid="chat-send"
            aria-label="Send chat"
          >
            <Send size={18} weight="fill" />
          </button>
        </form>
      )}
    </div>
  )
}
