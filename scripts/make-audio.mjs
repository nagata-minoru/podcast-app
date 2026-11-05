// 架空のエピソードの音声を、VOICEVOX で読み上げて作る。
// 原稿は scripts/audio/<エピソード ID>.txt、出力は assets/audio/<エピソード ID>.m4a。
// 番組ごとに話者を変え、アートワークがなくても聞き分けやすくする。
// 原稿の行の頭に「はう：」のような名前があれば、その行はその話者が読む（掛け合いの番組）。
// 使い方: VOICEVOX を起動してから node scripts/make-audio.mjs を実行する（エンジンは 127.0.0.1:50021）。
// 生成した音声は、各話者の規約に従い「VOICEVOX:話者名」のクレジットを表記して使う（README の「音声のクレジット」）。
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ENGINE = 'http://127.0.0.1:50021'
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
/** 台詞のあとに置く間（秒） */
const PAUSE = 0.4

/** 話者の名前と VOICEVOX のスタイル ID */
const SPEAKERS = { ひまり: 14, 宗麟: 53, 雌雄: 21, はう: 10, 武宏: 11 }

/** エピソードごとに、名前のない行を読む話者 */
const NARRATOR = { e1: 'ひまり', e2: 'ひまり', e3: '宗麟', e4: '宗麟', e5: '雌雄', e6: 'はう' }

/**
 * エンジンに POST し、応答を返す。
 * @param {string} path パスとクエリ
 * @param {unknown} [body] JSON にして送る本文
 * @returns {Promise<Response>} 応答
 * @throws 応答が成功でないとき
 */
const post = async (path, body) => {
  const res = await fetch(`${ENGINE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`VOICEVOX が ${res.status} を返しました: ${path}`)
  return res
}

/**
 * 1行を読み上げた WAV を作る。
 * @param {string} text 読む文
 * @param {number} speaker スタイル ID
 * @returns {Promise<Buffer>} WAV
 */
const speak = async (text, speaker) => {
  const query = await (await post(`/audio_query?${new URLSearchParams({ text, speaker })}`)).json()
  const res = await post(`/synthesis?speaker=${speaker}`, { ...query, postPhonemeLength: PAUSE })
  return Buffer.from(await res.arrayBuffer())
}

/**
 * 原稿の1行を、話者と文に分ける。行の頭に「名前：」がなければ、エピソードの語り手が読む。
 * @param {string} line 原稿の行
 * @param {string} narrator 語り手の名前
 * @returns {{ speaker: number, text: string }} 話者のスタイル ID と文
 * @throws SPEAKERS にない名前のとき
 */
const parseLine = (line, narrator) => {
  const m = /^([^：]{1,8})：(.*)$/.exec(line)
  if (!m) return { speaker: SPEAKERS[narrator], text: line }
  if (!(m[1] in SPEAKERS)) throw new Error(`知らない話者です: ${m[1]}`)
  return { speaker: SPEAKERS[m[1]], text: m[2] }
}

/**
 * エピソードの原稿を読み上げ、m4a にして、長さ（秒）を返す。
 * @param {string} txt 原稿のパス
 * @param {string} work 作業用のフォルダ
 * @returns {Promise<string>} 長さ（秒）
 */
const makeEpisode = async (txt, work) => {
  const id = basename(txt, '.txt')
  const lines = readFileSync(txt, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean)
  const waves = []
  for (const line of lines) {
    const { speaker, text } = parseLine(line, NARRATOR[id])
    waves.push((await speak(text, speaker)).toString('base64'))
  }
  const wav = join(work, `${id}.wav`)
  writeFileSync(wav, Buffer.from(await (await post('/connect_waves', waves)).arrayBuffer()))
  const out = join(ROOT, 'assets', 'audio', `${id}.m4a`)
  // 声だけなのでモノラル 48kbps の AAC で十分
  execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '48000', '-c', '1', wav, out])
  return /estimated duration: ([\d.]+)/.exec(execFileSync('afinfo', [out], { encoding: 'utf8' }))?.[1] ?? '?'
}

const work = mkdtempSync(join(tmpdir(), 'make-audio-'))
try {
  const dir = join(ROOT, 'scripts', 'audio')
  for (const name of readdirSync(dir).filter((f) => f.endsWith('.txt')).sort()) {
    console.log(`${basename(name, '.txt')}\t${await makeEpisode(join(dir, name), work)}秒`)
  }
} finally {
  rmSync(work, { recursive: true, force: true })
}
