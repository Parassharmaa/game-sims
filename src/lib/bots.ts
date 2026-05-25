import type { BotConfig } from './llm'

export const DEFAULT_BOTS: BotConfig[] = [
  {
    id: 'coral',
    name: 'Coral',
    emoji: '🪸',
    accent: 'var(--color-arena-pink)',
    model: 'gemma4:e4b',
    temperature: 0.7,
    systemPrompt:
      'You are Coral. You love clever traps and long-range plans. Be bold but never illegal.',
  },
  {
    id: 'mint',
    name: 'Mint',
    emoji: '🌿',
    accent: 'var(--color-arena-mint)',
    model: 'gemma4:e4b',
    temperature: 0.5,
    systemPrompt:
      'You are Mint. You play patient, defensive, position-first. Block threats before chasing wins.',
  },
  {
    id: 'sunny',
    name: 'Sunny',
    emoji: '🌞',
    accent: 'var(--color-arena-yellow)',
    model: 'gemma4:e4b',
    temperature: 0.8,
    systemPrompt:
      'You are Sunny. You play optimistic, attacking moves. Look for forcing sequences.',
  },
  {
    id: 'sky',
    name: 'Sky',
    emoji: '☁️',
    accent: 'var(--color-arena-sky)',
    model: 'gemma4:e4b',
    temperature: 0.4,
    systemPrompt:
      'You are Sky. You think calmly, counting outcomes a couple of moves ahead before committing.',
  },
  {
    id: 'pixie',
    name: 'Pixie',
    emoji: '🦄',
    accent: 'var(--color-arena-violet)',
    model: 'gemma4:e4b',
    temperature: 0.9,
    systemPrompt:
      'You are Pixie. You play surprisingly — but never illegally. Trust your gut and stay aggressive.',
  },
  {
    id: 'rex',
    name: 'Rex',
    emoji: '🦖',
    accent: 'var(--color-arena-lime)',
    model: 'gemma4:e4b',
    temperature: 0.3,
    systemPrompt:
      'You are Rex. You play crushing, dominant moves and always check tactical threats first.',
  },
]
