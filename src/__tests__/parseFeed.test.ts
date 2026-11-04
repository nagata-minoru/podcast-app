import { FeedError, hashId, parseDuration, parseFeed, plainText } from '@/feed/parseFeed'

const FEED_URL = 'https://feeds.example.test/sample.xml'

/**
 * 架空の番組のフィードを作る。
 * @param items item 要素の XML
 * @returns フィードの XML
 */
const feed = (items: string) => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>試験放送 &amp; ラジオ</title>
    <itunes:author>架空の配信者</itunes:author>
    <description><![CDATA[<p>架空の番組です。</p><p>二段落目&nbsp;です。</p>]]></description>
    <itunes:category text="テクノロジー" />
    ${items}
  </channel>
</rss>`

const ITEM = `<item>
  <title>第2回 ふつうの回</title>
  <guid isPermaLink="false">ep-0002</guid>
  <pubDate>Wed, 28 Oct 2026 22:00:00 +0000</pubDate>
  <itunes:duration>1:02:03</itunes:duration>
  <description>紹介文</description>
  <enclosure url="https://media.example.test/ep2.mp3" length="100" type="audio/mpeg" />
</item>`

describe('parseFeed', () => {
  it('番組とエピソードを読み取る', () => {
    const { show, episodes } = parseFeed(feed(ITEM), FEED_URL)
    expect(show).toEqual({
      id: `f${hashId(FEED_URL)}`,
      title: '試験放送 & ラジオ',
      publisher: '架空の配信者',
      description: '架空の番組です。\n二段落目 です。',
      category: 'テクノロジー',
      feedUrl: FEED_URL,
    })
    expect(episodes).toHaveLength(1)
    expect(episodes[0]).toMatchObject({
      showId: show.id,
      title: '第2回 ふつうの回',
      summary: '紹介文',
      duration: 3723,
      audioUrl: 'https://media.example.test/ep2.mp3',
    })
    // 公開日は端末の時刻での日付にする
    const local = new Date(Date.UTC(2026, 9, 28, 22))
    const expected = [local.getFullYear(), local.getMonth() + 1, local.getDate()]
      .map((n) => String(n).padStart(2, '0')).join('-')
    expect(episodes[0].publishedAt).toBe(expected)
  })

  it('同じフィードからは同じ ID を作る', () => {
    const a = parseFeed(feed(ITEM), FEED_URL)
    const b = parseFeed(feed(ITEM), FEED_URL)
    expect(b.show.id).toBe(a.show.id)
    expect(b.episodes[0].id).toBe(a.episodes[0].id)
  })

  it('CDATA の紹介文と音声のない回を扱う', () => {
    const items = `<item>
      <title><![CDATA[第1回 <b>音声なし</b>]]></title>
      <itunes:summary><![CDATA[要約&amp;補足]]></itunes:summary>
      <pubDate>not a date</pubDate>
    </item>`
    const [episode] = parseFeed(feed(items), FEED_URL).episodes
    expect(episode).toMatchObject({
      title: '第1回 音声なし', summary: '要約&補足', publishedAt: '', duration: 0, audioUrl: undefined,
    })
  })

  it('item が1つでも、なくても一覧にする', () => {
    expect(parseFeed(feed(''), FEED_URL).episodes).toEqual([])
    expect(parseFeed(feed(ITEM), FEED_URL).episodes).toHaveLength(1)
  })

  it('同じ guid の回は1つにまとめる', () => {
    expect(parseFeed(feed(ITEM + ITEM), FEED_URL).episodes).toHaveLength(1)
  })

  it('RSS でないものは notFeed にする', () => {
    const cases = ['<html><body>ページ</body></html>', '<rss><channel></channel></rss>', 'ただの文字', '']
    cases.forEach((xml) => {
      expect(() => parseFeed(xml, FEED_URL)).toThrow(FeedError)
    })
  })

  it('壊れた XML は notFeed にする', () => {
    try {
      parseFeed('<rss><channel><title>a</title></rss>', FEED_URL)
      throw new Error('読めてしまった')
    } catch (e) {
      expect(e).toBeInstanceOf(FeedError)
      expect((e as FeedError).kind).toBe('notFeed')
    }
  })
})

describe('parseFeed（取り直し）', () => {
  const MOVED = 'https://feeds.example.test/moved.xml'

  it('ID の元の URL を渡すと、その URL から番組とエピソードの ID を作る', () => {
    const { show, episodes } = parseFeed(feed(ITEM), MOVED, FEED_URL)
    expect(show.id).toBe(`f${hashId(FEED_URL)}`)
    expect(show.feedUrl).toBe(MOVED)
    expect(episodes[0].id.startsWith(`${show.id}-`)).toBe(true)
  })

  it('移転先が http・https の URL で、いまの URL と違うときだけ newFeedUrl にする', () => {
    const moved = (url: string) => parseFeed(feed(`<itunes:new-feed-url>${url}</itunes:new-feed-url>${ITEM}`), FEED_URL)
    expect(moved(` ${MOVED} `).newFeedUrl).toBe(MOVED)
    expect(moved(FEED_URL).newFeedUrl).toBeUndefined()
    expect(moved('javascript:alert(1)').newFeedUrl).toBeUndefined()
    expect(parseFeed(feed(ITEM), FEED_URL).newFeedUrl).toBeUndefined()
  })
})

describe('parseDuration', () => {
  it.each([
    ['1:02:03', 3723], ['62:03', 3723], ['3723', 3723], ['90.5', 90], ['', 0], ['abc', 0], ['1:2:3:4', 0],
  ])('%s は %d 秒', (value, seconds) => {
    expect(parseDuration(value)).toBe(seconds)
  })
})

describe('plainText', () => {
  it('タグを除き、文字参照を戻す', () => {
    expect(plainText('a<br/>b &lt;c&gt; &#12354;&#x3044; &unknown;')).toBe('a\nb <c> あい &unknown;')
  })

  it('入れ子になったタグでも、タグの始まりを残さない', () => {
    expect(plainText('x<scr<b>ipt>y')).toBe('xipt>y')
    expect(plainText('x<<b>script>alert(1)<</b>/script>y')).toBe('xscript>alert(1)/script>y')
  })
})
