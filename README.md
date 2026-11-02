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
- iOS 向けのバンドル作成（`yarn expo export --platform ios`）
- `npx expo-doctor` の診断（20項目すべて合格）
- iOS シミュレータ（iPhone 16、iOS 18.5）の Expo Go で、ホーム、新着・おすすめの番組詳細、ライブラリ、検索、設定が
  表示されること（URL で各画面を直接開いて確認）

タップによる画面遷移の通し確認、ダークテーマ、Android、実機での確認はまだ行っていません。

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

## CI

GitHub Actions（`.github/workflows/ci.yml`）で、`main` への push と pull request のたびに、
型チェック、lint、テストを実行します。Node.js 24 と、corepack で有効にした Yarn 4 を使います。

## ディレクトリ構成

```text
mobile/
  .github/workflows/ci.yml  # CI（型チェック、lint、テスト）
  app.json                  # アプリ名、scheme、プラグインなどの設定
  eslint.config.js          # ESLint の設定（eslint-config-expo）
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

## 次の作業

実装方針の手順2「再生まわり」として、次の3つをつなげます。

1. 再生状態を持つ PlayerProvider
2. タブバーの上のミニプレイヤー
3. 再生画面
