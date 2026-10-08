import type { Game } from '../../sim/world/world.types'

export interface HudOptions {
  root: HTMLElement
  game: Game
}

export interface Hud {
  render(): void
}

export interface Gauge {
  label: string
  value: number
  max: number
  text: string
  tone: 'good' | 'warn' | 'bad'
}
