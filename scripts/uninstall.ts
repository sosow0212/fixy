/**
 * fixy-agent 제거 — 설치내역(manifest)에 기록된, 우리 레포를 가리키는 심볼릭 링크만 제거한다.
 * 사용자의 실제 파일·설정·다른 플러그인은 절대 건드리지 않는다. 레포 자체는 남긴다(직접 삭제).
 *
 *   bun scripts/uninstall.ts
 */
import { basename, join } from "node:path";
import { homedir } from "node:os";
import { readdirSync } from "node:fs";
import { readManifest, unlinkIfOurs, MANIFEST, GLOBAL_DIR } from "./lib/common.ts";
import { unlinkSync, existsSync } from "node:fs";

const m = readManifest();
let removed = 0, skipped = 0;

if (m && m.links.length) {
  console.log(`▶ 설치내역 기준 제거 (${m.links.length}개 링크)`);
  for (const link of m.links) {
    const r = unlinkIfOurs(link);
    if (r === "removed") { removed++; console.log(`  ✓ 제거: ${basename(link)}`); }
    else if (r === "skipped") { skipped++; console.log(`  ⚠ 스킵(우리 것 아님/실제 파일): ${link}`); }
  }
} else {
  // manifest 가 없으면: 전역 디렉토리에서 우리 레포를 가리키는 링크를 스캔해 제거(폴백)
  console.log("▶ manifest 없음 — 전역에서 fixy 링크 스캔 제거(폴백)");
  for (const sub of ["agents", "commands", "plugins", "skills"]) {
    const d = join(GLOBAL_DIR, sub);
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d)) {
      const r = unlinkIfOurs(join(d, f));
      if (r === "removed") { removed++; console.log(`  ✓ 제거: ${sub}/${f}`); }
    }
  }
}

// manifest 삭제
try { if (existsSync(MANIFEST)) unlinkSync(MANIFEST); } catch { /* noop */ }

console.log(`
✅ fixy-agent 제거 완료 — 링크 ${removed}개 제거${skipped ? `, ${skipped}개 스킵` : ""}.
   레포 디렉토리와 memory/(개인 학습 기록)는 남아 있습니다. 완전 삭제하려면 이 디렉토리를 직접 지우세요.
   ⚠ 실행 중이던 opencode 가 있으면 종료 후 다시 켜세요.
`);
