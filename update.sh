#!/usr/bin/env bash
# fixy-agent 업데이트 — 최신 코드를 받고 재설치(재링크)한다.
#   bash update.sh
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if command -v git &>/dev/null && [ -d .git ]; then
  echo "▶ git pull..."
  current_branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"
  git pull --ff-only origin "$current_branch" || echo "  ⚠ pull 실패(로컬 변경/충돌?) — 수동 확인 필요. 계속 진행."
else
  echo "  · git 레포가 아니라 pull 생략 — 파일 갱신 후 재설치만 수행."
fi

echo "▶ 재설치(재링크)..."
bun scripts/install.ts
echo "✅ 업데이트 완료. 실행 중이던 opencode 는 재시작하세요."
