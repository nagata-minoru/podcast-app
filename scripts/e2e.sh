#!/bin/sh
# E2E テスト（Maestro）を実行する。引数はそのまま maestro test に渡す
# Homebrew の Java はパスが通らないため、JAVA_HOME が未設定ならその場所を使う
set -eu
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home}"
# 利用状況を Maestro の運営元へ送らない
export MAESTRO_CLI_NO_ANALYTICS=1
exec maestro test "$@" .maestro/flows
