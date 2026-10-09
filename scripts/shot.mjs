// 게임 화면 스크린샷. 통과/실패가 없는 도구다 — harness와 같은 성격이다.
//
// 장면은 `scripts/shots/*.json`에 시드 + 명령 로그로 고정한다. 진행 중 원정을 localStorage에
// 넣으면 재현으로 같은 화면이 되살아난다 (SPEC-roguelike R43, §18 끝). 키 입력 열을 더 줄 수도 있다.
//
// 의존성을 늘리지 않으려고 헤드리스 크롬을 CDP로 직접 몬다. Node 22부터 WebSocket이 내장이다.
//
//   vp run shot                          모든 장면 → .shots/
//   vp run shot -- pirate ashore         이름으로 고른 장면만
//   vp run shot -- --url http://…/       떠 있는 서버를 쓴다 (기본은 직접 띄운다)
//   CHROME_PATH=/path/to/chrome vp run shot
import { spawn } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { homedir, platform, tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { createServer } from 'vite'

const SCENE_DIR = new URL('./shots/', import.meta.url)
const ACTIVE_KEY = 'uw3.roguelike.active'
const META_KEY = 'uw3.roguelike.meta'
const VIEWPORT = { width: 1400, height: 900 }
const LAUNCH_TIMEOUT_MS = 10_000
// 한 장면의 읽기·명령 하나가 이보다 오래 걸리면 멈춘 것으로 본다. 크롬이 죽거나 서버가 없을 때 영원히 기다리지 않게.
const STEP_TIMEOUT_MS = 15_000
const POLL_MS = 100
// 첫 그림과 키 입력 뒤의 다시 그리기를 기다린다. 화면은 명령마다 동기로 그려서 길 필요가 없다.
const SETTLE_MS = 400

// `vp run shot -- …`는 `--`까지 넘긴다. 인자 구분자일 뿐이라 버린다.
const args = process.argv.slice(2).filter((arg) => arg !== '--')
const option = (name) => {
  const index = args.indexOf(`--${name}`)
  if (index === -1) {
    return undefined
  }
  const value = args.splice(index, 2)[1]
  if (value === undefined || value.startsWith('--')) {
    fail(`--${name}에 값이 없다`)
  }
  return value
}
const outDir = option('out') ?? '.shots'
const givenUrl = option('url')
const unknownFlag = args.find((arg) => arg.startsWith('--'))
if (unknownFlag !== undefined) {
  fail(`모르는 옵션이다: ${unknownFlag} (--out, --url만 받는다)`)
}
const wanted = new Set(args)

const scenes = readdirSync(SCENE_DIR)
  .filter((file) => file.endsWith('.json'))
  .map((file) => ({
    name: basename(file, '.json'),
    ...JSON.parse(readFileSync(new URL(file, SCENE_DIR), 'utf8')),
  }))
const known = new Set(scenes.map((scene) => scene.name))
const missing = [...wanted].filter((name) => !known.has(name))
if (missing.length > 0) {
  fail(`없는 장면이다: ${missing.join(', ')} (있는 것: ${[...known].join(', ')})`)
}
const chosen = scenes.filter((scene) => wanted.size === 0 || wanted.has(scene.name))
if (chosen.length === 0) {
  fail('장면이 없다 (scripts/shots 비었음)')
}

const executable = findChrome()
if (executable === null) {
  fail(
    '크롬을 찾지 못했다. CHROME_PATH를 주거나 `npx playwright install chromium-headless-shell`로 받는다',
  )
}

let server = null
let chrome = null
const profile = mkdtempSync(join(tmpdir(), 'uw3-shot-'))
try {
  if (givenUrl === undefined) {
    server = await createServer({ logLevel: 'error', server: { port: 0 } })
    await server.listen()
  }
  const baseUrl = givenUrl ?? server?.resolvedUrls?.local[0]
  chrome = spawn(
    executable,
    [
      '--headless',
      '--disable-gpu',
      '--no-first-run',
      '--hide-scrollbars',
      `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
      '--remote-debugging-port=0',
      `--user-data-dir=${profile}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  )
  // 실행 파일이 없거나 못 띄우면 'error'가 온다. 받지 않으면 정리 없이 죽는다.
  const launchFailed = new Promise((_, reject) => chrome.once('error', reject))
  const page = await connect(await Promise.race([devtoolsPort(profile), launchFailed]))
  await page.send('Page.enable')
  await page.send('Emulation.setDeviceMetricsOverride', {
    ...VIEWPORT,
    deviceScaleFactor: 1,
    mobile: false,
  })
  mkdirSync(outDir, { recursive: true })
  for (const scene of chosen) {
    const file = join(outDir, `${scene.name}.png`)
    await capture(page, scene, file, baseUrl)
    console.log(`${scene.name} → ${file}`)
  }
  page.close()
} finally {
  if (chrome !== null && chrome.exitCode === null) {
    // 크롬이 프로필에 쓰기를 마칠 때까지 기다려야 폴더를 지울 수 있다.
    const exited = new Promise((resolve) => chrome.once('exit', resolve))
    chrome.kill()
    await Promise.race([exited, sleep(LAUNCH_TIMEOUT_MS)])
  }
  await server?.close()
  rmSync(profile, { recursive: true, force: true, maxRetries: 3 })
}

function fail(message) {
  console.error(message)
  process.exit(1)
}

/** 약속이 이 시간 안에 풀리지 않으면 실패로 돌린다. */
function within(promise, what) {
  return Promise.race([
    promise,
    sleep(STEP_TIMEOUT_MS).then(() => {
      throw new Error(`${what}이 ${STEP_TIMEOUT_MS / 1000}초 안에 끝나지 않았다`)
    }),
  ])
}

/** 장면 하나: 저장소를 채우고, 다시 읽히고, 키를 누르고, 찍는다. */
async function capture(page, scene, file, baseUrl) {
  await navigate(page, baseUrl)
  const storage = {
    [ACTIVE_KEY]: { daily: null, ...scene.saved },
    ...(scene.meta === undefined ? {} : { [META_KEY]: scene.meta }),
  }
  await page.send('Runtime.evaluate', {
    expression: `localStorage.clear(); ${Object.entries(storage)
      .map(
        ([key, value]) =>
          `localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(JSON.stringify(value))})`,
      )
      .join('; ')}`,
  })
  await navigate(page, baseUrl)
  for (const key of scene.keys ?? []) {
    await press(page, key)
  }
  await sleep(SETTLE_MS)
  const { data } = await page.send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(file, Buffer.from(data, 'base64'))
}

async function navigate(page, url) {
  const loaded = page.once('Page.loadEventFired')
  const { errorText } = await page.send('Page.navigate', { url })
  if (errorText !== undefined) {
    throw new Error(`${url}을 열지 못했다: ${errorText}`)
  }
  await within(loaded, `${url} 읽기`)
  await sleep(SETTLE_MS)
}

/**
 * 키 하나. `Shift+KeyH`처럼 Shift를 붙일 수 있다.
 *
 * `code`는 그대로 보내고 `key`는 화면이 읽는 만큼만 흉내 낸다 — Shift+Digit1의 `key`는 실제 브라우저의 `!`가
 * 아니라 `1`이다. 화면의 시장 키는 `code`와 Shift만 본다.
 */
async function press(page, spec) {
  const shift = spec.startsWith('Shift+')
  const code = shift ? spec.slice('Shift+'.length) : spec
  const key = keyOf(code, shift)
  const base = {
    key,
    code,
    modifiers: shift ? 8 : 0,
    // 가상 키 코드는 글자·숫자만 문자 코드와 같다. '.'의 46은 Delete다.
    windowsVirtualKeyCode: /^[a-z0-9]$/i.test(key) ? key.toUpperCase().charCodeAt(0) : 0,
  }
  await page.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    ...base,
    text: key.length === 1 ? key : undefined,
  })
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', ...base })
}

function keyOf(code, shift) {
  if (code.startsWith('Key')) {
    const letter = code.slice('Key'.length).toLowerCase()
    return shift ? letter.toUpperCase() : letter
  }
  if (code.startsWith('Digit')) {
    return code.slice('Digit'.length)
  }
  return code === 'Period' ? '.' : code
}

/**
 * 크롬 실행 파일. CHROME_PATH → Playwright 캐시(가장 새 판) → 시스템 크롬 순이다.
 * Playwright 캐시 위치는 기계마다 다르므로 PLAYWRIGHT_BROWSERS_PATH와 OS 기본 위치를 본다.
 */
function findChrome() {
  if (process.env.CHROME_PATH !== undefined) {
    return process.env.CHROME_PATH
  }
  const caches = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    platform() === 'darwin' ? join(homedir(), 'Library/Caches/ms-playwright') : undefined,
    platform() === 'win32' ? join(process.env.LOCALAPPDATA ?? '', 'ms-playwright') : undefined,
    join(homedir(), '.cache/ms-playwright'),
  ].filter((dir) => dir !== undefined && existsSync(dir))
  const binaries =
    {
      darwin: ['chrome-headless-shell', 'Chromium.app/Contents/MacOS/Chromium'],
      linux: ['chrome-headless-shell', 'chrome'],
      win32: ['chrome-headless-shell.exe', 'chrome.exe'],
    }[platform()] ?? []
  for (const cache of caches) {
    const builds = readdirSync(cache)
      .filter((name) => /^chromium(_headless_shell)?-\d+$/.test(name))
      .sort((a, b) => Number(b.split('-').at(-1)) - Number(a.split('-').at(-1)))
    for (const build of builds) {
      for (const platformDir of readdirSync(join(cache, build))) {
        for (const binary of binaries) {
          const candidate = join(cache, build, platformDir, binary)
          if (existsSync(candidate)) {
            return candidate
          }
        }
      }
    }
  }
  const system = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/opt/homebrew/bin/chromium',
  ]
  return system.find((path) => existsSync(path)) ?? null
}

/** 크롬이 디버깅 포트를 열면 프로필 폴더에 적는다. 포트 0으로 띄워 충돌을 피한다. */
async function devtoolsPort(dir) {
  const file = join(dir, 'DevToolsActivePort')
  for (let waited = 0; waited < LAUNCH_TIMEOUT_MS; waited += POLL_MS) {
    if (existsSync(file)) {
      const [port] = readFileSync(file, 'utf8').split('\n')
      if (port) {
        return port
      }
    }
    await sleep(POLL_MS)
  }
  throw new Error('크롬이 디버깅 포트를 열지 않았다')
}

/** 첫 탭에 붙는다. 명령 하나에 응답 하나, 이벤트는 기다리는 쪽에 넘긴다. */
async function connect(port) {
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  const target = targets.find((entry) => entry.type === 'page')
  const socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  let nextId = 1
  const pending = new Map()
  const waiters = new Map()
  // 크롬이 죽어 소켓이 닫히면 기다리던 명령을 모두 실패로 돌린다. 그러지 않으면 영원히 기다린다.
  socket.addEventListener('close', () => {
    for (const { reject } of pending.values()) {
      reject(new Error('크롬과의 연결이 끊겼다'))
    }
    pending.clear()
  })
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data)
    if (message.id !== undefined) {
      const { resolve, reject } = pending.get(message.id)
      pending.delete(message.id)
      if (message.error === undefined) {
        resolve(message.result)
      } else {
        reject(new Error(message.error.message))
      }
    } else {
      waiters.get(message.method)?.shift()?.(message.params)
    }
  })
  return {
    send(method, params = {}) {
      const id = nextId++
      const reply = new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
      socket.send(JSON.stringify({ id, method, params }))
      return within(reply, method)
    },
    once(method) {
      return new Promise((resolve) =>
        waiters.set(method, [...(waiters.get(method) ?? []), resolve]),
      )
    },
    close: () => socket.close(),
  }
}
