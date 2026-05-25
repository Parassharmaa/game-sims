import { useEffect, useState } from 'react'
import { MoveLog } from './MoveLog'
import { ChatPanel } from './ChatPanel'
import type { ChatMessage, MoveLogEntry } from '@/games/types'
import type { BotConfig } from '@/lib/llm'
import { cn } from '@/lib/cn'

interface Props {
  log: MoveLogEntry[]
  chat: ChatMessage[]
  botA: BotConfig
  botB: BotConfig
  describeMove: (move: unknown) => string
  /** When set, the chat tab gets an input for the active human to send messages. */
  onSendChat?: (text: string) => void
  chatSenderHint?: string
}

type Tab = 'moves' | 'chat'

export function SidePanel({
  log,
  chat,
  botA,
  botB,
  describeMove,
  onSendChat,
  chatSenderHint,
}: Props) {
  const [tab, setTab] = useState<Tab>('moves')
  const [unread, setUnread] = useState(0)

  // Flash a counter on the chat tab when a new message lands while not viewing it.
  useEffect(() => {
    if (tab !== 'chat') setUnread((u) => u + 1)
    else setUnread(0)
    // We only want this to fire on chat.length growing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.length])

  useEffect(() => {
    if (tab === 'chat') setUnread(0)
  }, [tab])

  return (
    <div
      className="nb-card flex flex-col lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] min-h-[480px]"
      data-testid="side-panel"
    >
      <div className="flex border-b-[3px] border-black">
        <TabButton active={tab === 'moves'} onClick={() => setTab('moves')} testId="tab-moves">
          📝 Moves <span className="opacity-60">· {log.length}</span>
        </TabButton>
        <TabButton active={tab === 'chat'} onClick={() => setTab('chat')} testId="tab-chat">
          💬 Chat <span className="opacity-60">· {chat.length}</span>
          {unread > 0 && tab !== 'chat' && (
            <span
              className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full border-[2px] border-black"
              style={{ background: 'var(--color-arena-pink)', color: '#fff' }}
            >
              {unread}
            </span>
          )}
        </TabButton>
      </div>
      <div className="flex-1 min-h-0">
        {tab === 'moves' ? (
          <MoveLog entries={log} botA={botA} botB={botB} describeMove={describeMove} />
        ) : (
          <ChatPanel
            messages={chat}
            botA={botA}
            botB={botB}
            onSend={onSendChat}
            senderHint={chatSenderHint}
          />
        )}
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  testId,
  children,
}: {
  active: boolean
  onClick: () => void
  testId: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      data-active={active || undefined}
      className={cn(
        'flex-1 px-3 py-2.5 text-sm font-bold uppercase tracking-wider transition-colors',
        active ? '' : 'opacity-60 hover:opacity-100',
      )}
      style={{
        background: active ? 'var(--color-arena-yellow)' : 'transparent',
        borderRight: '3px solid #0a0a0a',
      }}
    >
      <span className="inline-flex items-center gap-1.5">{children}</span>
    </button>
  )
}
