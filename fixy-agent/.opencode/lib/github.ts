/**
 * GitHub 공유 레이어 — gh CLI 기반. 학습물(스킬/규칙)을 포크 저장소에 PR 로 올린다.
 * MCP 없이 gh 만 쓰므로 인증은 `gh auth login` 한 번이면 끝.
 *
 * 동작은 항상 fixy-agent 레포(=FIXY_HOME) 안에서 일어난다. 학습물이 이 레포에 살기 때문.
 */
import { existsSync, writeFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { paths, getConfig } from "./paths.ts";
import { scanPaths, type SecretFinding } from "./secret-scan.ts";

// Bun 런타임 셸. opencode 플러그인/bun 스크립트 모두에서 사용 가능.
const $ = (Bun as any).$;

export interface ShareResult {
  ok: boolean;
  message: string;
  branch?: string;
  prUrl?: string;
  findings?: SecretFinding[];
  files?: string[];
}

async function sh(parts: TemplateStringsArray, ...subs: any[]): Promise<{ code: number; stdout: string; stderr: string }> {
  // 항상 FIXY_HOME 에서 실행
  const res = await $(parts, ...subs).cwd(paths.home()).nothrow().quiet();
  return {
    code: res.exitCode ?? 0,
    stdout: res.stdout?.toString().trim() ?? "",
    stderr: res.stderr?.toString().trim() ?? "",
  };
}

export async function isGitRepo(): Promise<boolean> {
  const r = await sh`git rev-parse --is-inside-work-tree`;
  return r.code === 0 && r.stdout === "true";
}

export interface RepoTargets {
  fork: string; // owner/name 또는 빈 문자열
  upstream: string;
  defaultBranch: string;
  branchPrefix: string;
  origin: string; // git remote origin url
}

export async function getRepoTargets(): Promise<RepoTargets> {
  const cfg = getConfig();
  const origin = (await sh`git remote get-url origin`).stdout;
  return {
    fork: cfg.repo.fork,
    upstream: cfg.repo.upstream,
    defaultBranch: cfg.repo.defaultBranch || "main",
    branchPrefix: cfg.repo.branchPrefix || "fixy",
    origin,
  };
}

/** 아직 커밋/공유되지 않은(untracked·modified) 스킬 이름 목록. */
export async function listUnsharedSkills(): Promise<string[]> {
  if (!(await isGitRepo())) return [];
  const r = await sh`git status --porcelain -- .opencode/skills`;
  const names = new Set<string>();
  for (const line of r.stdout.split("\n")) {
    const m = /\.opencode\/skills\/([^/]+)\//.exec(line);
    if (m) names.add(m[1]);
  }
  return [...names];
}

function slugDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 스킬(+선택적으로 규칙)을 브랜치에 커밋하고 PR 을 연다.
 * - secretScan: 시크릿 발견 시 즉시 중단(공유 안 함)
 * - dryRun: 브랜치/커밋/푸시/PR 없이 검증만
 * - target: "fork"(기본) | "upstream" — base 저장소 선택
 */
export async function shareSkills(opts: {
  skills: string[];
  extraPaths?: string[]; // rules/team-*.md 등
  title: string;
  body: string;
  level: number;
  target?: "fork" | "upstream";
  dryRun?: boolean;
}): Promise<ShareResult> {
  const cfg = getConfig();
  if (!(await isGitRepo())) {
    return { ok: false, message: `FIXY_HOME(${paths.home()}) 이 git 레포가 아닙니다. 먼저 git init + 포크 remote 설정이 필요합니다.` };
  }

  const targets = await getRepoTargets();
  const skillDirs = opts.skills.map((n) => join(paths.skillsDir(), n)).filter((d) => existsSync(d));
  const extra = (opts.extraPaths ?? []).filter((p) => existsSync(p));
  const allPaths = [...skillDirs, ...extra];
  if (allPaths.length === 0) return { ok: false, message: "공유할 파일을 찾지 못했습니다." };

  // ── 안전 게이트: 시크릿 스캔 ──
  if (cfg.share.secretScan) {
    const findings = scanPaths(allPaths);
    if (findings.length) {
      return {
        ok: false,
        message: `🚫 시크릿/사내 식별자 ${findings.length}건 발견 — 공유를 차단했습니다. 제거 후 다시 시도하세요.`,
        findings,
      };
    }
  }

  const relPaths = allPaths.map((p) => relative(paths.home(), p));
  if (opts.dryRun) {
    return { ok: true, message: `(dry-run) 공유 대상 ${relPaths.length}건, 시크릿 없음.`, files: relPaths };
  }

  // ── 공유 대상 저장소 가드 (실제 PR 생성 전에만 — dryRun 은 통과) ──
  // 깜짝 PR 방지: 대상이 비어 있으면 gh 의 자동 추론(origin→parent)에 맡기지 않고 명확히 중단한다.
  if (!targets.origin) {
    return { ok: false, message: "origin remote 가 없습니다 — `git remote add origin <포크-URL>` 후 다시 시도하세요." };
  }
  const baseRepo = opts.target === "upstream" ? targets.upstream : targets.fork;
  if (!baseRepo) {
    const key = opts.target === "upstream" ? "upstream" : "fork";
    return { ok: false, message: `repo.${key} 가 fixy.config.json 에 설정되지 않았습니다 — 의도치 않은 레포로 PR 이 나가지 않도록 공유를 중단합니다.` };
  }
  const forkOwner = (targets.fork || "").split("/")[0];
  if (opts.target === "upstream" && !forkOwner) {
    return { ok: false, message: "upstream 공유에는 repo.fork(내 포크 owner/name)가 필요합니다 — 크로스레포 PR 의 head 를 지정할 수 없습니다." };
  }

  const slug = opts.skills[0]?.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "learning";
  const branch = `${targets.branchPrefix}/skill-${slugDate()}-${slug}`.slice(0, 80);
  // 브랜치는 항상 origin(내 포크)에 푸시된다. upstream PR 이면 head 를 <fork-owner>:<branch> 로 명시(크로스레포).
  const head = opts.target === "upstream" ? `${forkOwner}:${branch}` : branch;

  // 브랜치 생성(있으면 체크아웃)
  const co = await sh`git checkout -B ${branch}`;
  if (co.code !== 0) return { ok: false, message: `브랜치 생성 실패: ${co.stderr}` };

  await $`git add ${relPaths}`.cwd(paths.home()).nothrow().quiet();
  const commitMsg = `feat(skill): L${opts.level} 학습물 공유 — ${opts.title}`;
  const commit = await sh`git commit -m ${commitMsg}`;
  if (commit.code !== 0 && !/nothing to commit/.test(commit.stdout + commit.stderr)) {
    return { ok: false, message: `커밋 실패: ${commit.stderr || commit.stdout}`, branch };
  }

  const push = await sh`git push -u origin ${branch}`;
  if (push.code !== 0) {
    return { ok: false, message: `푸시 실패(origin=${targets.origin}): ${push.stderr}`, branch };
  }

  // PR 생성 — base 저장소·head 명시(가드를 통과했으므로 baseRepo 는 항상 채워져 있다)
  const prArgs = ["pr", "create", "--title", opts.title, "--body", opts.body, "--base", targets.defaultBranch, "--head", head, "--repo", baseRepo];
  const pr = await $`gh ${prArgs}`.cwd(paths.home()).nothrow().quiet();
  const prOut = (pr.stdout?.toString() ?? "").trim();
  const prUrl = /(https:\/\/github\.com\/\S+)/.exec(prOut)?.[1];

  // 기록
  try {
    writeFileSync(
      paths.shareLogFile(),
      JSON.stringify({ at: new Date().toISOString(), branch, prUrl, skills: opts.skills, level: opts.level }, null, 2),
      "utf8",
    );
  } catch { /* noop */ }

  if ((pr.exitCode ?? 0) !== 0 && !prUrl) {
    return { ok: false, message: `브랜치 푸시는 됐으나 PR 생성 실패: ${pr.stderr?.toString().trim()}`, branch, files: relPaths };
  }
  return { ok: true, message: `✅ PR 생성 완료`, branch, prUrl, files: relPaths };
}
