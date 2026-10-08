import { LANGUAGE_LABELS } from '../../content/content.types'
import { findPort } from '../../content/ports'
import type { Game } from '../../sim/world/world.types'
import { supplyDays } from '../../sim/voyage/voyage'
import { supplyCapacity } from '../../sim/world/world'
import type { Gauge } from './hud.types'

function tone(ratio: number): Gauge['tone'] {
  if (ratio > 0.5) {
    return 'good'
  }
  return ratio > 0.2 ? 'warn' : 'bad'
}

function invertedTone(ratio: number): Gauge['tone'] {
  if (ratio < 0.4) {
    return 'good'
  }
  return ratio < 0.7 ? 'warn' : 'bad'
}

export function formatLatitude(lat: number): string {
  const hemisphere = lat >= 0 ? 'N' : 'S'
  const abs = Math.abs(lat)
  const minutes = Math.round((abs % 1) * 60)
  return `${Math.floor(abs)}°${String(minutes).padStart(2, '0')}′${hemisphere}`
}

export function formatLongitude(lon: number): string {
  const hemisphere = lon >= 0 ? 'E' : 'W'
  const abs = Math.abs(lon)
  const minutes = Math.round((abs % 1) * 60)
  return `${Math.floor(abs)}°${String(minutes).padStart(2, '0')}′${hemisphere}`
}

export function buildGauges(game: Game): readonly Gauge[] {
  const { voyage, shipClass } = game
  const capacity = supplyCapacity(shipClass.capacityTons)
  const days = supplyDays(voyage)
  const healthy = voyage.crew - voyage.sick

  return [
    {
      label: '식량',
      value: voyage.food,
      max: capacity,
      text: `${Math.round(voyage.food)} (${days}일분)`,
      tone: tone(voyage.food / capacity),
    },
    {
      label: '물',
      value: voyage.water,
      max: capacity,
      text: `${Math.round(voyage.water)}`,
      tone: tone(voyage.water / capacity),
    },
    {
      label: '선체',
      value: voyage.hull,
      max: voyage.hullMax,
      text: `${Math.round(voyage.hull)} / ${voyage.hullMax}`,
      tone: tone(voyage.hull / voyage.hullMax),
    },
    {
      label: '선원',
      value: healthy,
      max: shipClass.crewMax,
      text: voyage.sick > 0 ? `${healthy}명 (환자 ${voyage.sick})` : `${healthy}명`,
      tone: tone(healthy / shipClass.crewMin),
    },
    {
      label: '피로',
      value: voyage.fatigue,
      max: 1,
      text: `${Math.round(voyage.fatigue * 100)}%`,
      tone: invertedTone(voyage.fatigue),
    },
    {
      label: '규율',
      value: voyage.discipline,
      max: 1,
      text: `${Math.round(voyage.discipline * 100)}%`,
      tone: tone(voyage.discipline),
    },
  ]
}

export function describeLocation(game: Game): string {
  const { voyage } = game
  if (voyage.atPortId === null) {
    return voyage.daysAtSea === 0 ? '출항 준비' : `항해 ${voyage.daysAtSea}일째`
  }
  const port = findPort(voyage.atPortId)
  if (port === undefined) {
    return '정박 중'
  }
  return `${port.name} 정박 · ${port.nation} · ${LANGUAGE_LABELS[port.language]}`
}
