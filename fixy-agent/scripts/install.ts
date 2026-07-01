/**
 * fixy-agent 설치 — 에이전트·커맨드·플러그인·스킬을 전역 opencode 디렉토리에
 * 심볼릭 링크하고 설치내역(manifest)을 남긴다. 사용자의 기존 설정은 건드리지 않는다.
 *
 *   bun scripts/install.ts
 *   FIXY_SKIP_DEPS=1 bun scripts/install.ts   # 의존성 설치 생략(오프라인/테스트)
 */
import { join, basename } from "node:path";
import {
  REPO_ROOT, OPENCODE_DIR, GLOBAL_DIR,
  ensureDir, linkInto, listFiles, listDirs, writeManifest,
} from "./lib/common.ts";

const warns: string[] = [];
const links: string[] = [];

function add(p: string | null) { if (p) links.push(p); }

console.log(`▶ fixy-agent 설치 (repo: ${REPO_ROOT})`);
console.log(`  전역 대상: ${GLOBAL_DIR}`);

// 1) 전역 하위 디렉토리 보장
for (const d of ["agents", "commands", "plugins", "skills"]) ensureDir(join(GLOBAL_DIR, d));

// 2) 심볼릭 링크 (이름이 모두 fixy-* / 고유라 충돌 위험 낮음)
for (const f of listFiles(join(OPENCODE_DIR, "agents"), ".md")) add(linkInto(f, join(GLOBAL_DIR, "agents"), warns));
for (const f of listFiles(join(OPENCODE_DIR, "commands"), ".md")) add(linkInto(f, join(GLOBAL_DIR, "commands"), warns));
for (const f of listFiles(join(OPENCODE_DIR, "plugins"), ".ts")) add(linkInto(f, join(GLOBAL_DIR, "plugins"), warns));
for (const dir of listDirs(join(OPENCODE_DIR, "skills"))) add(linkInto(dir, join(GLOBAL_DIR, "skills"), warns));

console.log(`  ✓ 링크 ${links.length}개:`);
for (const l of links) console.log(`     ${basename(l)}  →  ${GLOBAL_DIR}/${l.includes("/skills/") ? "skills" : l.split("/").slice(-2)[0]}/`);
for (const w of warns) console.log(`  ⚠ ${w}`);

// 3) 플러그인 런타임 의존성
let depsInstalled = false;
if (process.env.FIXY_SKIP_DEPS === "1") {
  console.log("  · FIXY_SKIP_DEPS=1 — 의존성 설치 생략");
} else {
  console.log("▶ 플러그인 의존성 설치 (.opencode 에서 bun install)...");
  const res = await (Bun as any).$`bun install`.cwd(OPENCODE_DIR).nothrow();
  depsInstalled = (res.exitCode ?? 1) === 0;
  console.log(depsInstalled ? "  ✓ 의존성 설치 완료" : "  ⚠ 의존성 설치 실패 — `cd .opencode && bun install` 수동 실행 필요");
}

// 4) 설치내역 기록
writeManifest({
  repoRoot: REPO_ROOT,
  globalDir: GLOBAL_DIR,
  installedAt: new Date().toISOString(),
  depsInstalled,
  links,
});
console.log("  ✓ 설치내역 기록: .install-manifest.json");

// 5) 다음 단계 안내
console.log(`
🎉 fixy-agent 설치 완료!

다음 단계:
  1) GitHub 인증:           gh auth status   (안 돼 있으면 gh auth login)
  2) 공유 대상 저장소 설정:  fixy.config.json 의 repo.fork / repo.upstream 을 "owner/name" 으로
  3) (학습물 공유를 쓰려면) 이 레포를 git + 포크 remote 로:
        cd ${REPO_ROOT} && git init && git remote add origin <당신의-포크-URL>

확인:
  아무 프로젝트에서 opencode 실행 → @fixy 로 호출, /fixy-status 로 파이프라인 확인
  ⚠ 실행 중이던 opencode 가 있으면 완전히 종료 후 다시 켜세요.
`);
