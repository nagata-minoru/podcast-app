#!/bin/sh
# E2E テスト（Maestro）を実行する。引数はそのまま maestro test に渡す
# Homebrew の Java はパスが通らないため、JAVA_HOME が未設定ならその場所を使う
# RSS の URL で追加するフローのため、架空の番組のフィードを配るローカルサーバーを起動し、終わったら止める
set -eu
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home}"
# 利用状況を Maestro の運営元へ送らない
export MAESTRO_CLI_NO_ANALYTICS=1
FEED_PORT=8090
node "$(dirname "$0")/test-feed-server.mjs" "$FEED_PORT" &
FEED_PID=$!
trap 'kill "$FEED_PID" 2>/dev/null || true' EXIT INT TERM
# サーバーが待ち受けるまで待つ（最大10秒）
i=0
until curl -s -o /dev/null "http://127.0.0.1:$FEED_PORT/feed.xml"; do
  i=$((i + 1))
  if [ "$i" -ge 50 ]; then
    echo "テスト用フィードのサーバーが起動しません" >&2
    exit 1
  fi
  perl -e 'select(undef, undef, undef, 0.2)'
done
maestro test "$@" .maestro/flows
