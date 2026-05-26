import { useEffect, useState } from 'react'
import { MoveLog } from './MoveLog'
import { ChatPanel } from './ChatPanel'
import { ChatCircle, ListBullets, ArrowLeft, ArrowRight } from './icons'
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
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (tab !== 'chat') setUnread((u) => u + 1)
    else setUnread(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.length])

  useEffect(() => {
    if (tab === 'chat') setUnread(0)
  }, [tab])

  if (collapsed) {
    return (
      <div
        className="nb-card flex flex-col items-center gap-3 py-3 px-1.5 lg:sticky lg:top-4 h-fit"
        data-testid="side-panel"
        data-collapsed="true"
      >
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="nb-btn !p-2 !shadow-[3px_3px_0_0_#0a0a0a]"
          aria-label="Expand side panel"
          title="Expand panel"
          data-testid="side-panel-expand"
        >
          <ArrowLeft size={16} weight="bold" />
        </button>
        <CollapsedBadge
          icon={<ListBullets size={14} weight="bold" />}
          count={log.length}
          onClick={() => {
            setTab('moves')
            setCollapsed(false)
          }}
        />
        <CollapsedBadge
          icon={<ChatCircle size={14} weight="bold" />}
          count={chat.length}
          unread={unread}
          onClick={() => {
            setTab('chat')
            setCollapsed(false)
          }}
        />
      </div>
    )
  }

  return (
    <div
      className="nb-card flex flex-col lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] min-h-[480px] w-full lg:w-[360px] max-w-full"
      data-testid="side-panel"
    >
      <div className="flex border-b-[3px] border-black">
        <TabButton active={tab === 'moves'} onClick={() => setTab('moves')} testId="tab-moves">
          <ListBullets size={14} weight="bold" />
          Moves <span className="opacity-60">· {log.length}</span>
        </TabButton>
        <TabButton active={tab === 'chat'} onClick={() => setTab('chat')} testId="tab-chat">
          <ChatCircle size={14} weight="bold" />
          Chat <span className="opacity-60">· {chat.length}</span>
          {unread > 0 && tab !== 'chat' && (
            <span
              className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full border-[2px] border-black"
              style={{ background: 'var(--color-arena-pink)', color: '#fff' }}
            >
              {unread}
            </span>
          )}
        </TabButton>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="px-2.5 hover:bg-black/5 transition-colors"
          aria-label="Collapse side panel"
          title="Collapse panel"
          data-testid="side-panel-collapse"
        >
          <ArrowRight size={16} weight="bold" />
        </button>
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

function CollapsedBadge({
  icon,
  count,
  unread,
  onClick,
}: {
  icon: React.ReactNode
  count: number
  unread?: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-col items-center gap-0.5 p-1.5 rounded-md hover:bg-black/5 transition-colors"
    >
      {icon}
      <span className="text-[10px] font-bold opacity-80">{count}</span>
      {unread != null && unread > 0 && (
        <span
          className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-bold rounded-full border-[2px] border-black"
          style={{ background: 'var(--color-arena-pink)', color: '#fff' }}
        >
          {unread}
        </span>
      )}
    </button>
  )
}
