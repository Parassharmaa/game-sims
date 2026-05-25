export type PlayerSlot = 'A' | 'B'
export type GameStatus =
  | { kind: 'in_progress'; turn: PlayerSlot }
  | { kind: 'win'; winner: PlayerSlot }
  | { kind: 'draw' }

export interface MoveLogEntry {
  turn: number
  player: PlayerSlot
  reasoning: string
  raw: string
  move: unknown
  /** Human-readable summary of what just happened ("flipped 3 discs"). */
  outcome: string
  /** Score for both players AFTER this move. */
  scoreAfter: { A: number; B: number }
}

export interface ChatMessage {
  /** Which turn this message was sent on. */
  turn: number
  player: PlayerSlot
  text: string
  /** ISO timestamp string. */
  at: string
}

export interface GameEngine<State, Move> {
  id: string
  name: string
  emoji: string
  blurb: string
  difficulty: 1 | 2 | 3 | 4 | 5
  /** Player A always moves first. */
  initial(): State
  legalMoves(state: State): Move[]
  /** Returns null if the move is illegal. */
  apply(state: State, move: Move): State | null
  status(state: State): GameStatus
  /** Running score from both players' perspectives. */
  score(state: State): { A: number; B: number }
  /** Short description of what just happened ("flipped 3 discs", "won centre sub-board"). */
  describeOutcome(prev: State, move: Move, next: State, mover: PlayerSlot): string
  /** A short human-readable rules summary for the LLM. */
  rules(): string
  /** Render the state as text for the LLM prompt. */
  renderForLlm(state: State, you: PlayerSlot): string
  /** JSON-shape example given to the LLM. */
  schemaExample(): string
  /** Parse the LLM's JSON response into a move. */
  parseMove(value: unknown, legal: Move[]): Move | null
  /** A compact textual move (e.g. "C4" or "pit 3") for the log. */
  describeMove(move: Move): string
}
