# podcast-app（モバイルアプリ）

ポッドキャストアプリの本体です。React Native + Expo（TypeScript）で作っています。
画面設計と決定事項は、親フォルダの資料にまとめています。

- `../README.md`：画面構成と画面遷移図
- `../docs/presentation.pptx`：画面設計・ワイヤーフレーム
- `../docs/implementation-plan.md`：実装方針と決定事項
- `../docs/show-detail.md`：番組詳細画面の仕様

## 現在の状態

実装方針の手順1「骨組み」の段階です。

| 項目 | 状態 |
| --- | --- |
| 下部4タブ（ホーム／新着・おすすめ／ライブラリ／検索） | 実装済み |
| 各タブ内での番組詳細への遷移と戻り | 実装済み（中身は上部・概要・エピソード一覧のみ） |
| 主要4画面の表示 | 架空データによる仮の表示 |
| 設定・非表示にした番組 | 画面の枠と項目の表示のみ |
| ライト／ダークテーマ | 色の組を用意済み |
| 再生、ミニプレイヤー、再生画面 | 未実装（再生画面は枠のみ） |
| フォロー、保存、非表示などの操作 | 未実装 |
| ダウンロード、通知、共有、認証、課金、外部サービス連携 | 未設計のため対象外 |

確認済みの範囲は次のとおりです。

- 型チェック（`yarn typecheck`）、lint（`yarn lint`）、テスト（`yarn test`）
- E2E テスト（`yarn e2e`）。iPhone 16 Pro シミュレータの Expo Go で、起動時のホーム、4タブの切替、
  新着・おすすめから番組詳細を開いて戻る操作、設定から非表示にした番組を開く操作をタップで通す
- iOS 向けのバンドル作成（`yarn expo export --platform ios`）
- `npx expo-doctor` の診断（20項目すべて合格）
- iOS シミュレータ（iPhone 16、iOS 18.5）の Expo Go で、ホーム、新着・おすすめの番組詳細、ライブラリ、検索、設定が
  表示されること（URL で各画面を直接開いて確認）

ダークテーマ、Android、実機での確認はまだ行っていません。

## 必要な環境

- Node.js
- Yarn 4（`package.json` の `packageManager` で 4.18.1 を指定）
  - Yarn 1 系が入っていれば、`mobile/` の中では自動で 4.18.1 が使われます。
  - React Native は Yarn の PnP 方式に対応していないため、`.yarnrc.yml` で `nodeLinker: node-modules` を指定しています。
- iOS で確認する場合は Xcode のシミュレータ、Android で確認する場合は Android エミュレータ、または実機の Expo Go

## セットアップと起動

```sh
cd mobile
yarn install
yarn expo start
```

起動後、表示される案内に従って `i`（iOS シミュレータ）、`a`（Android エミュレータ）を押すか、
Expo Go で QR コードを読み取ります。

Web では起動できません。`react-native-web` と `react-dom` が入っていないためです。

## よく使うコマンド

| コマンド | 内容 |
| --- | --- |
| `yarn expo start` | 開発サーバーを起動する |
| `yarn typecheck` | 型チェック（`tsc --noEmit`）を行う |
| `yarn lint` | ESLint（`eslint-config-expo`）で検査する（`expo lint` を実行） |
| `yarn test` | テスト（Jest）を実行する。`yarn test --watch` で変更のたびに実行する |
| `yarn e2e` | E2E テスト（Maestro）をシミュレータで実行する。準備は「E2E テスト」を参照 |
| `yarn expo install <パッケージ>` | SDK に合うバージョンでパッケージを追加する。`yarn add <パッケージ>` は使わない |
| `npx expo-doctor` | 依存関係と設定の問題を調べる（expo-doctor は依存に含めていないため `npx` で実行する） |

npm は使いません。`package-lock.json` を作らないよう、`npm install` は実行しないでください。
バンドラーは Expo 標準の Metro を使います。Expo Router が Metro を前提にしているため、Vite は使いません。
## テスト

Jest（`jest-expo`）と React Native Testing Library を使います。テストは `src/__tests__/` に置きます。
`src/app/` に置くと画面として扱われるため、そこには置きません。

| ファイル | 内容 |
| --- | --- |
| `format.test.ts` | 時間・日付の表示形式 |
| `mock.test.ts` | 架空データの整合性（存在しない ID を指していないかなど）と検索用の関数 |
| `Segmented.test.tsx` | 切り替えボタンの選択状態と、押したときの動き |
| `navigation.test.tsx` | 実際の画面フォルダを使った画面遷移（起動時のホーム、タブ切替、番組詳細、設定） |

画面遷移のテストは `expo-router/testing-library` の `renderRouter` で、シミュレータなしに動かします。

## E2E テスト

[Maestro](https://maestro.dev/) で、シミュレータの Expo Go を実際にタップして確かめます。
手順は `.maestro/flows/` に、毎回の起動手順は `.maestro/subflows/launch.yaml` に置きます。

| ファイル | 内容 |
| --- | --- |
| `01-home.yaml` | 起動するとホームが開き、続きから再生とトップ番組が見える |
| `02-tabs.yaml` | 下部の4タブを順に切り替える |
| `03-show-detail.yaml` | 新着・おすすめから番組詳細を開き、戻るボタンで戻る |
| `04-settings.yaml` | プロフィールボタンから設定を開き、非表示にした番組へ進む |

準備（初回のみ）:

1. Maestro を入れる（Java も一緒に入る）。
   ```sh
   brew tap mobile-dev-inc/tap
   brew install mobile-dev-inc/tap/maestro
   ```
2. Homebrew の Java はパスが通らないため、`yarn e2e` は `JAVA_HOME` が未設定なら
   `/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home` を使います。`maestro` を直接実行する場合は、
   `~/.zshrc` などで `JAVA_HOME` を設定してください。
3. シミュレータの Expo Go で開発メニューを開き、「Tools button」を切る。右上に出る歯車のボタンが、
   ホームのプロフィールボタンに重なってタップを邪魔するためです。

実行:

```sh
yarn expo start   # 別のターミナルで開発サーバーを起動しておく（ポート 8081）
yarn e2e
```

起動中のシミュレータが複数あるときは、`maestro --device <UDID> test .maestro/flows` で端末を指定します
（UDID は `xcrun simctl list devices booted` で確認できます）。

書き方の注意:

- iOS では、押せる番組行が中の文字（アートワークの頭文字、番組名、補足）を「台, 台所サイエンス, ことこと研究会」のように
  1つにつなげて読み上げます。Maestro の文字指定は全体一致の正規表現なので、`".*台所サイエンス.*"` のように部分一致で書きます。
- 番組詳細のヘッダーの戻るボタンは前の画面名を表示するため、下部タブと同じ名前になります。`above` で位置を絞って押します。

CI では実行していません。macOS のランナーとシミュレータが必要なため、ミニプレイヤーができてから検討します。

## CI

GitHub Actions（`.github/workflows/ci.yml`）で、`main` への push と pull request のたびに、
Expo の版の確認、型チェック、lint、テストを実行します。Node.js 24 と、corepack で有効にした Yarn 4 を使います。

- Expo の版の確認（`yarn expo install --check`）は、SDK と版が合わない依存パッケージがあると失敗します。
  直すときは `yarn expo install --fix` を実行します。

### 依存パッケージの自動更新（Dependabot）

`.github/dependabot.yml` で、依存パッケージの更新を月1回、まとめて PR にします。

| 対象 | 届く更新 | PR |
| --- | --- | --- |
| `expo` | patch と、SDK の更新（例: 58 → 59） | 月1本にまとめる |
| `expo-*`、`@expo/*`、`react-native-*` | 同じ SDK の中の patch だけ | `expo` と同じ PR にまとめる |
| `react`、`react-dom`、`react-native` | 届かない（Expo が版ちょうどで指定するため） | なし |
| `typescript` | patch だけ（Expo SDK 58 は `~6.0.3` を求めるため） | その他と同じ PR にまとめる |
| `eslint` | minor と patch（`eslint-config-expo` 58 は ESLint 10 で動かないため） | その他と同じ PR にまとめる |
| その他のパッケージ | minor と patch | 月1本にまとめる |
| その他のパッケージのメジャー更新 | 1パッケージずつ | 出たときだけ。同時に開くのは最大3本 |
| GitHub Actions | すべて | 月1本にまとめる |

- 公開から7日たった版だけを提案します（`cooldown`）。
- `react`、`react-dom`、`react-native` は patch でも上げると `yarn expo install --check` が失敗するため、すべて対象外です。
- Expo の SDK を上げる PR（`expo` だけが上がる）は、CI の「Expo の版の確認」で失敗するのが普通です。
  その PR のブランチで `yarn expo install --fix` を実行し、ほかのパッケージを新しい SDK の版に揃えてからマージします。
  このとき `typescript` と `eslint` の ignore も見直します。
- 脆弱性の修正（security updates）は、リポジトリの設定でオンにした場合、この制限とは別に届きます。
- `resolutions` で固定した `minimatch` と `glob` は、Dependabot が更新を提案しても固定した版のままになります。

## ディレクトリ構成

```text
mobile/
  .github/dependabot.yml    # 依存パッケージの自動更新の設定
  .github/workflows/ci.yml  # CI（Expo の版の確認、型チェック、lint、テスト）
  .maestro/                 # E2E テスト（Maestro）。flows/ に手順、subflows/ に共通の起動手順
  app.json                  # アプリ名、scheme、プラグインなどの設定
  eslint.config.js          # ESLint の設定（eslint-config-expo）
  scripts/e2e.sh            # yarn e2e の本体（JAVA_HOME を補って maestro test を実行）
  src/
    __tests__/              # テスト
    app/                    # 画面（Expo Router）。ここに置いたファイルがそのまま画面になる
      _layout.tsx           # アプリ全体の画面スタック（4タブ、再生画面、設定）
      index.tsx             # 起動時にホームタブへリダイレクト
      (tabs)/
        _layout.tsx         # 下部4タブ
        home/               # ホーム
        discover/           # 新着・おすすめ
        library/            # ライブラリ
        search/             # 検索
          _layout.tsx       #   タブ内の画面履歴（4タブ共通の TabStack を使う）
          index.tsx         #   タブの最初の画面
          show/[id].tsx     #   番組詳細（4タブ共通の ShowDetailScreen を使う）
      player.tsx            # 再生画面（下から開くモーダル）
      settings/
        index.tsx           # 設定
        hidden-shows.tsx    # 非表示にした番組
    components/             # 画面で共通に使う部品
      parts.tsx             #   Screen、SectionTitle、Artwork、ShowRow、EpisodeRow
      Segmented.tsx         #   切り替えボタン
      TabBar.tsx            #   タブバー（手順2でミニプレイヤーをこの上に置く）
      TabStack.tsx          #   各タブ内の画面履歴
    screens/
      ShowDetailScreen.tsx  # 番組詳細の本体
    data/
      mock.ts               # 架空データと検索用の関数
    format.ts               # 時間・日付の表示形式
    theme.ts                # ライト／ダークの色、タップ領域の最小サイズ
    types.ts                # 番組、エピソード、再生位置などの型
```

`src/app/` には画面だけを置き、部品やデータは `src/` のほかのフォルダに置きます。

## 画面遷移

- 起動するとホームタブを開きます。
- 番組詳細は、開いたタブの画面履歴に積みます。戻ると、そのタブで開く前の画面に戻ります。
  - URL は `/<タブ名>/show/<番組ID>` です（例: `/discover/show/s2`）。
- 設定はホーム右上のプロフィールアイコンから開きます。
- 再生画面は、手順2でミニプレイヤーから開けるようにします。

## 開発時の約束

- 番組名、配信者名、アートワーク、再生履歴は架空のものを使います。実在するものは使いません。
- 選択状態や再生状態は、色だけでなく形・太字・枠線・文字でも区別します。
- 主要な操作のタップ領域は最低 44pt にします（`theme.ts` の `MIN_TAP`）。
- 新しいパッケージを入れる前に、必要かどうかを確認します。
- Expo の API は SDK ごとに変わるため、コードを書く前に SDK 58 のドキュメントを確認します（`AGENTS.md` を参照）。

## 依存パッケージの版の固定

脆弱性（GHSA-g3hv-75wg-m249、GHSA-3g3m-2fjr-6pw4）を避けるため、`package.json` の `resolutions` で
間接的に使われる `minimatch` を 11.0.3、`glob` を 14.0.3 に固定しています。
ESLint や Expo が求める版（`minimatch` 3／10、`glob` 13）より新しいメジャー版を、強制的に使わせています。

- `minimatch` 11 は `require('minimatch')` を関数として呼べません。eslint-plugin-react と eslint-plugin-import の
  一部のルール（`react/jsx-pascal-case`、`import/no-unassigned-import`、`import/extensions` など）はその呼び方をしているため、
  有効にすると lint が `TypeError: ... is not a function` で止まります。いまの設定ではどれも使っていません。
- ESLint のルールを足したら、`yarn lint` が落ちないか確かめてください。
- ESLint・Expo・Jest が修正版に対応したら `resolutions` を外し、`yarn install` で元の版の決め方に戻します。
- `resolutions` を外したら、`glob` が 14.0.2 以上、`minimatch` が 11.0.1 以上になっているかを手で確かめます。
  Dependabot は `resolutions` を考慮せずに誤検出したため、アラート #1・#2 は閉じました。そのため、自動では知らせが来ません。
  確かめるには `yarn why glob` と `yarn why minimatch` を実行します。

## 次の作業

実装方針の手順2「再生まわり」として、次の3つをつなげます。

1. 再生状態を持つ PlayerProvider
2. タブバーの上のミニプレイヤー
3. 再生画面
