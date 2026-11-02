#!/bin/sh
# 架空のエピソードの音声を、macOS の say で読み上げて作る。
# 原稿は scripts/audio/<エピソード ID>.txt、出力は assets/audio/<エピソード ID>.m4a。
# 番組ごとに声を変え、アートワークがなくても聞き分けやすくする。
set -eu
cd "$(dirname "$0")/.."
voice_of() {
  case "$1" in
    e1|e2) echo Kyoko ;;
    e3|e4) echo Flo ;;
    e5) echo Reed ;;
    *) echo Sandy ;;
  esac
}
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
for txt in scripts/audio/*.txt; do
  id=$(basename "$txt" .txt)
  say -v "$(voice_of "$id")" -f "$txt" -o "$tmp/$id.aiff"
  # 声だけなのでモノラル 48kbps の AAC で十分
  afconvert -f m4af -d aac -b 48000 -c 1 "$tmp/$id.aiff" "assets/audio/$id.m4a"
  printf '%s\t%s秒\n' "$id" "$(afinfo "assets/audio/$id.m4a" | awk '/estimated duration/ {print $3}')"
done
