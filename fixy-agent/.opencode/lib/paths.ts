/**
 * fixy-agent 경로/설정 해석 — 단일 출처(SSOT).
 *
 * 플러그인이 전역(~/.config/opencode/plugins)으로 심볼릭 링크돼도 bun 은 import 를
 * 심볼릭 링크의 실제 경로(realpath) 기준으로 해석하므로, 이 파일 위치에서 레포 루트를
 * 역산하면 어디서 켜도 항상 올바른 FIXY_HOME 을 가리킨다. env FIXY_HOME 으로 강제 가능.
 */
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync, readFileSync, mkdirSync } from "node:fs";

const HERE = dirname(fileURLToPath(import.meta.url)); // <repo>/.opencode/lib

/** fixy-agent 레포(=설치본) 루트. 학습물·설정·메모리가 모두 여기 산다. */
export function fixyHome(): string {
  const env = process.env.FIXY_HOME?.trim();
  return env && env.length > 0 ? env : join(HERE, "..", "..");
}

export const paths = {
  home: () => fixyHome(),
  opencodeDir: () => join(fixyHome(), ".opencode"),
  skillsDir: () => join(fixyHome(), ".opencode", "skills"),
  rulesDir: () => join(fixyHome(), ".opencode", "rules"),
  agentsDir: () => join(fixyHome(), ".opencode", "agents"),
  memoryDir: () => join(fixyHome(), "memory"),
  stateDir: () => join(fixyHome(), "memory", "state"),
  episodesFile: () => join(fixyHome(), "memory", "episodes.jsonl"),
  configFile: () => join(fixyHome(), "fixy.config.json"),
  manifestFile: () => join(fixyHome(), ".install-manifest.json"),
  shareLogFile: () => join(fixyHome(), ".fixy-share-last.json"),
};

/** memory/ 등 런타임 디렉토리를 보장한다(없으면 생성). */
export function ensureRuntimeDirs(): void {
  for (const d of [paths.memoryDir(), paths.stateDir()]) {
    if (!existsSync(d)) mkdirSync(d, { recursive: true });
  }
}

export interface FixyConfig {
  repo: { fork: string; upstream: string; defaultBranch: string; branchPrefix: string };
  levels: {
    l1ToL2: { minEpisodes: number; minTagOverlap: number };
    l2ToL3: { minUses: number };
    l3ToL4: { minSkills: number };
    requireHumanApproval: string[];
  };
  share: { autoOnIdle: boolean; minLevelToShare: number; secretScan: boolean };
  record: { enabled: boolean; maxPromptChars: number; maxEpisodes: number };
}

const DEFAULT_CONFIG: FixyConfig = {
  repo: { fork: "", upstream: "", defaultBranch: "main", branchPrefix: "fixy" },
  levels: {
    l1ToL2: { minEpisodes: 3, minTagOverlap: 0.34 },
    l2ToL3: { minUses: 5 },
    l3ToL4: { minSkills: 3 },
    requireHumanApproval: ["l3ToL4", "l4ToL5"],
  },
  share: { autoOnIdle: false, minLevelToShare: 2, secretScan: true },
  record: { enabled: true, maxPromptChars: 320, maxEpisodes: 5000 },
};

/** fixy.config.json 을 읽어 기본값과 깊게 병합한다. 주석(_*) 키는 무시. */
export function getConfig(): FixyConfig {
  try {
    const raw = readFileSync(paths.configFile(), "utf8");
    const parsed = JSON.parse(stripJsonComments(raw)) as Partial<FixyConfig>;
    return deepMerge(DEFAULT_CONFIG, parsed);
  } catch {
    return DEFAULT_CONFIG;
  }
}

function stripJsonComments(s: string): string {
  // 우리 config 는 표준 JSON 이지만 _comment 키를 쓴다. JSONC 가 아니므로 그대로 파싱.
  return s;
}

function deepMerge<T>(base: T, override: any): T {
  if (override == null || typeof override !== "object") return base;
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
  for (const k of Object.keys(override)) {
    if (k.startsWith("_")) continue; // 주석 키 무시
    const ov = override[k];
    const bv = (base as any)?.[k];
    out[k] = ov && typeof ov === "object" && !Array.isArray(ov) && bv && typeof bv === "object"
      ? deepMerge(bv, ov)
      : ov;
  }
  return out as T;
}
