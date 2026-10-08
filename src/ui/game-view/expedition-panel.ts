import { findPort } from '../../content/ports'
import { compareRecords } from '../../game/expedition/expedition'
import type { MetaState, RunRecord } from '../../game/expedition/expedition.types'
import type { RunState } from '../../game/run/run.types'
import { END_LABEL } from './game-view.utils'

const BOARD_LIMIT = 5

function portName(portId: string | undefined): string {
  return portId === undefined ? '—' : (findPort(portId)?.name ?? portId)
}

function recordLine(record: RunRecord): string {
  const route = `${portName(record.config.startPortId)} → ${portName(record.config.goalPortId)}`
  const result =
    record.outcome === 'arrived'
      ? `${record.days}일 · 선원 ${record.crewLeft}/${record.crewAtStart}`
      : `${END_LABEL[record.outcome]} · ${record.days}일째`
  const tag = record.daily === null ? '' : `<span class="rl-board__tag">${record.daily}</span> `
  return `<li class="rl-board__item rl-board__item--${record.outcome === 'arrived' ? 'good' : 'bad'}">${tag}${route} · ${result}</li>`
}

/**
 * 원정 패널. 계약을 보여 주고, 원정이 끝났거나 아직 떠나지 않았으면 새 원정 버튼을 낸다.
 *
 * 진행 중인 원정은 버릴 수 없다 — 버튼은 첫 명령 전이나 끝난 뒤에만 나온다. 퍼머데스의 뜻이다.
 */
export function renderExpeditionPanel(
  run: RunState,
  daily: string | null,
  meta: MetaState,
  todayKey: string,
): string {
  const contract = `${portName(run.config.startPortId)} → <strong>${portName(run.config.goalPortId)}</strong>`
  const mode = daily === null ? '자유 원정' : `오늘의 원정 ${daily}`
  const canStart = run.ended !== null || run.commands.length === 0
  const dailyDone = meta.records.some((record) => record.daily === todayKey)
  const buttons = canStart
    ? `<div class="rl-expedition__actions">
        <button type="button" data-start="free">새 자유 원정</button>
        <button type="button" data-start="daily" ${dailyDone ? 'disabled' : ''}>
          오늘의 원정${dailyDone ? ' (오늘 완료)' : ''}
        </button>
      </div>`
    : ''
  const board = [...meta.records].sort(compareRecords).slice(0, BOARD_LIMIT)
  const known = meta.knownPortIds.map(portName).join(', ') || '없음'
  return `
    <p class="rl-expedition__contract">${mode} · ${contract}</p>
    ${buttons}
    <p class="rl-expedition__meta">아는 항구: ${known} · 원정 ${meta.records.length}회</p>
    ${board.length > 0 ? `<ol class="rl-board">${board.map(recordLine).join('')}</ol>` : ''}
  `
}
