#!/bin/sh
# 架空のエピソードの音声を、macOS の say で読み上げて作る。
# 原稿は scripts/audio/<エピソード ID>.txt、出力は assets/audio/<エピソード ID>.m4a。
# 番組ごとに声を変え、アートワークがなくても聞き分けやすくする。
# 台所サイエンス（e3・e4）は Siri の声で読む。Siri の声は say -v で名前を指定できないため、
# -v を付けずにシステムの声で読む。作る前に、システム設定 →「アクセシビリティ」→「読み上げコンテンツ」の
# 「システムの声」を日本語の Siri にしておく（ほかの声のままだと、その声で作られる）。
set -eu
cd "$(dirname "$0")/.."
voice_of() {
  case "$1" in
    e1|e2) echo Kyoko ;;
    e3|e4) echo '' ;;
    e5) echo Reed ;;
    *) echo Sandy ;;
  esac
}
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
for txt in scripts/audio/*.txt; do
  id=$(basename "$txt" .txt)
  voice=$(voice_of "$id")
  if [ -n "$voice" ]; then
    say -v "$voice" -f "$txt" -o "$tmp/$id.aiff"
  else
    say -f "$txt" -o "$tmp/$id.aiff"
  fi
  # 声だけなのでモノラル 48kbps の AAC で十分
  afconvert -f m4af -d aac -b 48000 -c 1 "$tmp/$id.aiff" "assets/audio/$id.m4a"
  printf '%s\t%s秒\n' "$id" "$(afinfo "assets/audio/$id.m4a" | awk '/estimated duration/ {print $3}')"
done
