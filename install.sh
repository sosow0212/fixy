#!/usr/bin/env bash
# fixy-agent 설치 — 이거 하나면 끝.
#
#   bash install.sh
#
# 하는 일:
#   1) bun / opencode CLI 확인
#   2) 에이전트·커맨드·플러그인·스킬을 전역(~/.config/opencode)에 심볼릭 링크
#   3) 플러그인 의존성 설치(.opencode 에서 bun install)
#   4) 설치내역(.install-manifest.json) 기록
#
# 안전 원칙: 사용자의 기존 opencode 설정(opencode.jsonc, oh-my-openagent 등)은 절대 안 건드림.
# 환경변수:
#   FIXY_SKIP_DEPS=1     → 의존성 설치 생략(오프라인/테스트)
#   FIXY_GLOBAL_DIR=...  → 전역 디렉토리 경로 변경(기본 ~/.config/opencode)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if ! command -v bun &>/dev/null; then
  echo "❌ bun 이 없습니다. 먼저 설치하세요:  curl -fsSL https://bun.sh/install | bash"
  exit 1
fi
if ! command -v opencode &>/dev/null; then
  echo "⚠️  opencode CLI 가 안 보입니다. 설치 후 사용하세요:  npm i -g opencode-ai (또는 공식 설치 스크립트)"
fi

bun scripts/install.ts
