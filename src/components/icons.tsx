import {
  Plant,
  Leaf,
  Sun,
  Cloud,
  Sparkle,
  Lightning,
  User,
  Robot,
  CircleHalf,
  Circle,
  Dot,
  Hexagon,
  FlagPennant,
  SquaresFour,
  Play,
  Stop,
  ArrowsClockwise,
  Trophy,
  Handshake,
  Target,
  LightbulbFilament,
  PaperPlaneTilt,
  ChatCircle,
  ListBullets,
  Sword,
  Warning,
  Check,
  GameController,
  Strategy,
  ArrowLeft,
  ArrowRight,
  CaretRight,
  MapTrifold,
  Star,
  X,
  Eye,
  EyeSlash,
  type Icon,
  type IconWeight,
} from '@phosphor-icons/react'

export type { Icon }

// Bot id → icon component
export const BOT_ICONS: Record<string, Icon> = {
  coral: Plant,
  mint: Leaf,
  sunny: Sun,
  sky: Cloud,
  pixie: Sparkle,
  rex: Lightning,
}

export function botIcon(id: string): Icon {
  if (id.startsWith('human')) return User
  return BOT_ICONS[id] ?? Robot
}

// Game id → icon component
export const GAME_ICONS: Record<string, Icon> = {
  reversi: CircleHalf,
  gomoku: Circle,
  mancala: Dot,
  hex: Hexagon,
  breakthrough: FlagPennant,
  utttt: SquaresFour,
}

export function gameIcon(id: string): Icon {
  return GAME_ICONS[id] ?? Star
}

// UI icons — re-exported for convenience
export {
  Play,
  Stop,
  ArrowsClockwise as Reset,
  Trophy,
  Handshake,
  Target,
  LightbulbFilament as Lightbulb,
  PaperPlaneTilt as Send,
  ChatCircle,
  ListBullets,
  Sword,
  Warning,
  Check,
  GameController,
  Strategy,
  ArrowLeft,
  ArrowRight,
  CaretRight,
  MapTrifold,
  Robot,
  User,
  Star,
  X,
  Eye,
  EyeSlash,
}

export const ICON_WEIGHTS: Record<string, IconWeight> = {
  default: 'bold',
  fill: 'fill',
  duotone: 'duotone',
}
