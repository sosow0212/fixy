/**
 * L1 에피소드 저장소 — append-only JSONL.
 * 한 줄 = 한 작업 단위 {프롬프트, 신호, 태그, 만진 파일}. 이너 루프(recorder)가 기록한다.
 */
import { appendFileSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { paths, ensureRuntimeDirs, getConfig } from "./paths.ts";
import type { Signal } from "./text.ts";

export interface Episode {
  id: string;
  ts: string; // ISO8601
  sessionID: string;
  agent?: string;
  signal: Signal;
  summary: string; // 프롬프트 요약(리댁트·절삭)
  tags: string[];
  files: string[]; // 만진 파일(상대경로)
  project?: string; // 작업 디렉토리 basename
  promotedTo?: string; // 승급된 스킬 이름(L2)
}

/** 에피소드 한 건을 추가한다. maxEpisodes 초과 시 오래된 것부터 회전 삭제. */
export function appendEpisode(ep: Episode): void {
  ensureRuntimeDirs();
  appendFileSync(paths.episodesFile(), JSON.stringify(ep) + "\n", "utf8");
  const cap = getConfig().record.maxEpisodes;
  rotateIfNeeded(cap);
}

/** 전체 에피소드를 읽는다(손상 줄은 건너뜀). */
export function readEpisodes(): Episode[] {
  const f = paths.episodesFile();
  if (!existsSync(f)) return [];
  const out: Episode[] = [];
  for (const line of readFileSync(f, "utf8").split("\n")) {
    const s = line.trim();
    if (!s) continue;
    try {
      out.push(JSON.parse(s) as Episode);
    } catch {
      /* 손상 줄 무시 */
    }
  }
  return out;
}

/** 전체를 다시 쓴다(승급 표시·회전에 사용). */
export function writeEpisodes(eps: Episode[]): void {
  ensureRuntimeDirs();
  writeFileSync(paths.episodesFile(), eps.map((e) => JSON.stringify(e)).join("\n") + (eps.length ? "\n" : ""), "utf8");
}

/** 주어진 id 들을 특정 스킬로 승급 표시한다. */
export function markPromoted(ids: string[], skillName: string): void {
  const set = new Set(ids);
  const eps = readEpisodes().map((e) => (set.has(e.id) ? { ...e, promotedTo: skillName } : e));
  writeEpisodes(eps);
}

function rotateIfNeeded(cap: number): void {
  const eps = readEpisodes();
  if (eps.length > cap) writeEpisodes(eps.slice(eps.length - cap));
}

/** 가벼운 시간순 단조 증가 id 생성기(같은 ms 충돌 방지). */
let _seq = 0;
export function newEpisodeId(): string {
  const now = Date.now();
  _seq = (_seq + 1) % 1000;
  return `${now.toString(36)}-${_seq.toString(36).padStart(2, "0")}`;
}
