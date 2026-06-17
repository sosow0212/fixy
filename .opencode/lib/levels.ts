/**
 * 수박게임식 레벨 엔진.
 *
 *   L1 에피소드(개인, memory/episodes.jsonl)
 *     ─ 유사한 게 minEpisodes개 쌓이면 ▶ L2 스킬(skills/<name>/SKILL.md)
 *   L2 스킬
 *     ─ minUses회 재사용되면 ▶ L3 팀 공통 스킬/서브에이전트
 *   L3 스킬
 *     ─ 한 주제로 minSkills개 모이면 ▶ L4 팀 규칙(rules/team-*.md)  (사람 승인)
 *   L4 규칙
 *     ─ 안정화되면 ▶ L5 코어 헌법(rules/core.md)                 (사람 승인)
 *
 * 낮은 레벨은 개인적·임시, 높은 레벨일수록 팀 공통·영속. 승급은 PR 로 공유된다.
 */
import { readdirSync, existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { paths, getConfig } from "./paths.ts";
import { parseSkill, stringifySkill, type SkillDoc } from "./frontmatter.ts";
import { jaccard, type Signal } from "./text.ts";
import { readEpisodes, markPromoted, type Episode } from "./episodes.ts";

export type Level = 1 | 2 | 3 | 4 | 5;

export interface SkillInfo {
  name: string;
  dir: string;
  description: string;
  level: Level;
  uses: number;
  evidence: number;
  scope: string;
  tags: string[];
  doc: SkillDoc;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── 스킬 CRUD ────────────────────────────────────────────────────────────────

/** skills/ 의 모든 스킬을 읽는다. */
export function listSkills(): SkillInfo[] {
  const dir = paths.skillsDir();
  if (!existsSync(dir)) return [];
  const out: SkillInfo[] = [];
  for (const name of readdirSync(dir)) {
    const skillDir = join(dir, name);
    const file = join(skillDir, "SKILL.md");
    if (!existsSync(file) || !statSync(skillDir).isDirectory()) continue;
    const doc = parseSkill(readFileSync(file, "utf8"));
    out.push({
      name: doc.name || name,
      dir: skillDir,
      description: doc.description,
      level: clampLevel(parseInt(doc.metadata.level ?? "2", 10)),
      uses: parseInt(doc.metadata.uses ?? "0", 10) || 0,
      evidence: parseInt(doc.metadata.evidence ?? "1", 10) || 1,
      scope: doc.metadata.scope ?? "personal",
      tags: (doc.metadata.tags ?? "").split(",").map((s) => s.trim()).filter(Boolean),
      doc,
    });
  }
  return out;
}

export function getSkill(name: string): SkillInfo | undefined {
  return listSkills().find((s) => s.name === name);
}

/** 스킬을 쓴다(없으면 생성). episodeIds 가 있으면 그 L1 들을 승급 표시. */
export function writeSkillDoc(input: {
  name: string;
  description: string;
  body: string;
  tags?: string[];
  level?: Level;
  scope?: string;
  evidence?: number;
  source?: string;
  episodeIds?: string[];
}): { file: string } {
  const skillDir = join(paths.skillsDir(), input.name);
  if (!existsSync(skillDir)) mkdirSync(skillDir, { recursive: true });
  const file = join(skillDir, "SKILL.md");

  const prev = existsSync(file) ? parseSkill(readFileSync(file, "utf8")) : undefined;
  const doc: SkillDoc = {
    name: input.name,
    description: input.description,
    metadata: {
      level: String(input.level ?? (prev?.metadata.level ?? "2")),
      evidence: String(input.evidence ?? prev?.metadata.evidence ?? input.episodeIds?.length ?? "1"),
      scope: input.scope ?? prev?.metadata.scope ?? "personal",
      tags: (input.tags ?? (prev?.metadata.tags ?? "").split(",").map((s) => s.trim()).filter(Boolean)).join(", "),
      uses: prev?.metadata.uses ?? "0",
      source: input.source ?? prev?.metadata.source ?? "fixy-evolve",
      created: prev?.metadata.created ?? todayISO(),
      updated: todayISO(),
    },
    body: input.body,
  };
  writeFileSync(file, stringifySkill(doc), "utf8");
  if (input.episodeIds?.length) markPromoted(input.episodeIds, input.name);
  return { file };
}

/** 스킬 재사용 1회 카운트(L2→L3 승급 신호). */
export function incrementUse(name: string): number {
  const s = getSkill(name);
  if (!s) return 0;
  const uses = s.uses + 1;
  s.doc.metadata.uses = String(uses);
  writeFileSync(join(s.dir, "SKILL.md"), stringifySkill(s.doc), "utf8");
  return uses;
}

/** 스킬 레벨을 올린다(메타데이터 갱신). HITL 게이트는 호출부(커맨드)가 담당. */
export function setSkillLevel(name: string, level: Level, scope?: string): boolean {
  const s = getSkill(name);
  if (!s) return false;
  s.doc.metadata.level = String(level);
  if (scope) s.doc.metadata.scope = scope;
  s.doc.metadata.updated = todayISO();
  writeFileSync(join(s.dir, "SKILL.md"), stringifySkill(s.doc), "utf8");
  return true;
}

function clampLevel(n: number): Level {
  const v = Number.isFinite(n) ? Math.min(5, Math.max(1, Math.round(n))) : 2;
  return v as Level;
}

// ── L1 → L2 클러스터링 ───────────────────────────────────────────────────────

export interface Cluster {
  tags: string[]; // 대표 태그(빈도 상위)
  episodeIds: string[];
  size: number;
  signals: Record<Signal, number>;
  samples: string[]; // 대표 요약 몇 개
  cohesion: number; // 평균 유사도(0~1)
}

/**
 * 미승급 L1 에피소드를 태그 유사도(단일연결)로 묶어 L2 승급 후보를 만든다.
 * 결정론적: 입력이 같으면 결과가 같다(LLM 미사용).
 */
export function clusterEpisodes(cfg = getConfig()): Cluster[] {
  const eps = readEpisodes().filter((e) => !e.promotedTo && e.tags.length > 0);
  const { minEpisodes, minTagOverlap } = cfg.levels.l1ToL2;

  const groups: Episode[][] = [];
  for (const ep of eps) {
    let best = -1, bestSim = 0;
    groups.forEach((g, i) => {
      const sim = Math.max(...g.map((m) => jaccard(m.tags, ep.tags)));
      if (sim >= minTagOverlap && sim > bestSim) {
        best = i;
        bestSim = sim;
      }
    });
    if (best >= 0) groups[best].push(ep);
    else groups.push([ep]);
  }

  return groups
    .filter((g) => g.length >= minEpisodes)
    .map((g) => toCluster(g))
    .sort((a, b) => b.size - a.size || b.cohesion - a.cohesion);
}

function toCluster(g: Episode[]): Cluster {
  const freq = new Map<string, number>();
  const signals = { complaint: 0, correction: 0, insight: 0, success: 0, note: 0 } as Record<Signal, number>;
  for (const e of g) {
    signals[e.signal]++;
    for (const t of e.tags) freq.set(t, (freq.get(t) ?? 0) + 1);
  }
  const tags = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t);

  // 평균 쌍 유사도
  let sum = 0, pairs = 0;
  for (let i = 0; i < g.length; i++)
    for (let j = i + 1; j < g.length; j++) {
      sum += jaccard(g[i].tags, g[j].tags);
      pairs++;
    }

  return {
    tags,
    episodeIds: g.map((e) => e.id),
    size: g.length,
    signals,
    samples: g.slice(0, 4).map((e) => e.summary),
    cohesion: pairs ? +(sum / pairs).toFixed(3) : 1,
  };
}

// ── 파이프라인 현황 ──────────────────────────────────────────────────────────

export interface PipelineStatus {
  l1: { total: number; unpromoted: number; bySignal: Record<Signal, number> };
  l2Candidates: Cluster[];
  skills: { total: number; l2: number; l3: number };
  l3Candidates: SkillInfo[]; // uses >= minUses 인 L2
  l4Candidates: { tag: string; skills: string[] }[]; // 같은 태그 L3 minSkills개 이상
  rules: { l4: number; l5: boolean };
}

export function pipelineStatus(cfg = getConfig()): PipelineStatus {
  const eps = readEpisodes();
  const bySignal = { complaint: 0, correction: 0, insight: 0, success: 0, note: 0 } as Record<Signal, number>;
  for (const e of eps) bySignal[e.signal]++;

  const skills = listSkills();
  const l2 = skills.filter((s) => s.level === 2);
  const l3 = skills.filter((s) => s.level === 3);

  const l3Candidates = l2.filter((s) => s.uses >= cfg.levels.l2ToL3.minUses);

  // L3 → L4: 같은 태그로 L3 스킬이 minSkills개 이상
  const byTag = new Map<string, string[]>();
  for (const s of l3) for (const t of s.tags) byTag.set(t, [...(byTag.get(t) ?? []), s.name]);
  const l4Candidates = [...byTag.entries()]
    .filter(([, names]) => names.length >= cfg.levels.l3ToL4.minSkills)
    .map(([tag, names]) => ({ tag, skills: [...new Set(names)] }));

  return {
    l1: { total: eps.length, unpromoted: eps.filter((e) => !e.promotedTo).length, bySignal },
    l2Candidates: clusterEpisodes(cfg),
    skills: { total: skills.length, l2: l2.length, l3: l3.length },
    l3Candidates,
    l4Candidates,
    rules: countRules(),
  };
}

function countRules(): { l4: number; l5: boolean } {
  const dir = paths.rulesDir();
  if (!existsSync(dir)) return { l4: 0, l5: false };
  const files = readdirSync(dir);
  return {
    l4: files.filter((f) => f.startsWith("team-") && f.endsWith(".md")).length,
    l5: files.includes("core.md"),
  };
}
