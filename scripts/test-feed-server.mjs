// E2E テスト用に、架空の番組「試し聴きラジオ」の RSS フィードと音声を配るローカルサーバー。
// 音声は assets/audio の読み上げ音声（架空の原稿）を使う。AVPlayer が求める Range 要求に応える。
// 使い方: node scripts/test-feed-server.mjs [ポート]（既定は 8090）。127.0.0.1 だけで待ち受ける
import { createReadStream, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = Number(process.argv[2] ?? 8090)
const HOST = '127.0.0.1'
const AUDIO_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'audio')
/** 配る音声。フィードの enclosure から /audio/<名前> で参照する */
const AUDIO_FILES = new Set(['e1.m4a', 'e2.m4a'])

/**
 * 架空の番組のフィードを作る。第3回は長さを書き、第2回は長さを書かず、第1回は音声を載せない。
 * @param base サーバーの URL
 * @returns フィードの XML
 */
const feedXml = (base) => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>試し聴きラジオ</title>
    <link>${base}/</link>
    <itunes:author>架空の放送室</itunes:author>
    <description><![CDATA[<p>動作確認のための<b>架空の番組</b>です。</p>]]></description>
    <itunes:category text="テクノロジー" />
    <item>
      <title>第3回 長さが書いてある回</title>
      <guid isPermaLink="false">trial-3</guid>
      <pubDate>Wed, 28 Oct 2026 03:00:00 +0000</pubDate>
      <itunes:duration>1:07</itunes:duration>
      <description>フィードに長さが書いてある回です。</description>
      <enclosure url="${base}/audio/e2.m4a" type="audio/mp4" length="1" />
    </item>
    <item>
      <title>第2回 長さが書いていない回</title>
      <guid isPermaLink="false">trial-2</guid>
      <pubDate>Tue, 27 Oct 2026 03:00:00 +0000</pubDate>
      <description>音声を読み込むと長さがわかる回です。</description>
      <enclosure url="${base}/audio/e1.m4a" type="audio/mp4" length="1" />
    </item>
    <item>
      <title>第1回 音声の準備中</title>
      <guid isPermaLink="false">trial-1</guid>
      <pubDate>Mon, 26 Oct 2026 03:00:00 +0000</pubDate>
      <description>音声が載っていない回です。</description>
    </item>
  </channel>
</rss>`

/**
 * 音声を返す。Range 要求なら、その範囲だけを 206 で返す。
 * @param req 要求
 * @param res 応答
 * @param file 音声ファイルのパス
 */
const sendAudio = (req, res, file) => {
  const size = statSync(file).size
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '')
  const headers = { 'Content-Type': 'audio/mp4', 'Accept-Ranges': 'bytes' }
  if (!range) {
    res.writeHead(200, { ...headers, 'Content-Length': size })
    createReadStream(file).pipe(res)
    return
  }
  const start = range[1] === '' ? Math.max(size - Number(range[2]), 0) : Number(range[1])
  const end = range[1] !== '' && range[2] !== '' ? Math.min(Number(range[2]), size - 1) : size - 1
  if (start > end || start >= size) {
    res.writeHead(416, { 'Content-Range': `bytes */${size}` })
    res.end()
    return
  }
  res.writeHead(206, { ...headers, 'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${size}` })
  createReadStream(file, { start, end }).pipe(res)
}

const server = createServer((req, res) => {
  const path = new URL(req.url ?? '/', `http://${HOST}`).pathname
  if (path === '/feed.xml') {
    res.writeHead(200, { 'Content-Type': 'application/rss+xml; charset=utf-8' })
    res.end(feedXml(`http://${HOST}:${PORT}`))
    return
  }
  const name = path.startsWith('/audio/') ? path.slice('/audio/'.length) : ''
  if (AUDIO_FILES.has(name)) {
    sendAudio(req, res, join(AUDIO_DIR, name))
    return
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end('not found')
})

server.listen(PORT, HOST, () => console.log(`test feed: http://${HOST}:${PORT}/feed.xml`))
