import { formatGameDate, seasonOf } from '../../sim/calendar/calendar'
import { currentAt, describeCurrentDirection } from '../../sim/current/current'
import { relativeWindAngle } from '../../sim/geo/geo.utils'
import { WIND_REGIME_LABELS, describeWindDirection, windAt } from '../../sim/wind/wind'
import type { Hud, HudOptions } from './hud.types'
import { buildGauges, describeLocation, formatLatitude, formatLongitude } from './hud.utils'

const SEASON_LABELS: Record<string, string> = {
  winter: '겨울',
  spring: '봄',
  summer: '여름',
  autumn: '가을',
}

const JOURNAL_LIMIT = 40

export function createHud(options: HudOptions): Hud {
  const { root, game } = options

  return {
    render(): void {
      const { voyage } = game
      const wind = windAt(voyage.position, voyage.day)
      const current = currentAt(voyage.position)
      const relAngle = relativeWindAngle(voyage.headingDeg, wind.fromDeg)

      const gauges = buildGauges(game)
        .map((gauge) => {
          const percent = Math.max(0, Math.min(100, (gauge.value / gauge.max) * 100))
          return `
            <div class="gauge">
              <span class="gauge__label">${gauge.label}</span>
              <span class="gauge__bar"><i class="gauge__fill gauge__fill--${gauge.tone}" style="width:${percent}%"></i></span>
              <span class="gauge__text">${gauge.text}</span>
            </div>`
        })
        .join('')

      const journal = game.journal
        .slice(-JOURNAL_LIMIT)
        .reverse()
        .map(
          (entry) =>
            `<li class="journal__item journal__item--${entry.kind}"><span>${formatGameDate(entry.day)}</span>${entry.text}</li>`,
        )
        .join('')

      root.innerHTML = `
        <header class="hud__header">
          <h1>${formatGameDate(voyage.day)}</h1>
          <p>${describeLocation(game)} · ${SEASON_LABELS[seasonOf(voyage.day)] ?? ''}</p>
        </header>

        <dl class="readout">
          <div><dt>위치</dt><dd>${formatLatitude(voyage.position.lat)} ${formatLongitude(voyage.position.lon)}</dd></div>
          <div><dt>침로</dt><dd>${Math.round(voyage.headingDeg)}° ${voyage.steering === 'manual' ? '(수동)' : '(항해사)'}</dd></div>
          <div><dt>바람</dt><dd>${describeWindDirection(wind.fromDeg)} ${wind.speedKnots.toFixed(1)}kn</dd></div>
          <div><dt>풍계</dt><dd>${WIND_REGIME_LABELS[wind.regime]}</dd></div>
          <div class="readout__wide"><dt>해류</dt><dd>${current.speedKnots < 0.05 ? '없음' : `${current.name.replace(/\s*해류$/, '')} ${describeCurrentDirection(current.toDeg)} ${current.speedKnots.toFixed(1)}kn`}</dd></div>
          <div><dt>풍향각</dt><dd>${Math.round(relAngle)}° ${relAngle < 35 ? '(정풍)' : relAngle > 140 ? '(순풍)' : '(횡풍)'}</dd></div>
          <div><dt>선급</dt><dd>${game.shipClass.name}</dd></div>
          <div><dt>자재 / 탄약</dt><dd>${Math.round(voyage.timber)} / ${Math.round(voyage.ammo)}</dd></div>
          <div><dt>자금</dt><dd>${game.gold} 두카트</dd></div>
        </dl>

        <section class="gauges">${gauges}</section>

        <ul class="journal">${journal}</ul>
      `
    },
  }
}
