#!/usr/bin/env bash
# fixy-agent 제거 — 설치내역에 기록된 우리 링크만 제거한다.
#   bash uninstall.sh
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if ! command -v bun &>/dev/null; then
  echo "❌ bun 이 없습니다."
  exit 1
fi
bun scripts/uninstall.ts
