/**
 * 설치 스크립트 공용 헬퍼.
 * 핵심 안전 원칙: 우리가 만든 심볼릭 링크만 건드린다. 사용자의 실제 파일·설정
 * (opencode.jsonc, oh-my-openagent.json, 직접 만든 agent 등)은 절대 덮어쓰지 않는다.
 */
import { homedir } from "node:os";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import {
  existsSync, mkdirSync, lstatSync, readlinkSync, realpathSync,
  symlinkSync, unlinkSync, readdirSync, readFileSync, writeFileSync,
} from "node:fs";

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const OPENCODE_DIR = join(REPO_ROOT, ".opencode");
export const GLOBAL_DIR = process.env.FIXY_GLOBAL_DIR || join(homedir(), ".config", "opencode");
export const MANIFEST = join(REPO_ROOT, ".install-manifest.json");

export interface Manifest {
  repoRoot: string;
  globalDir: string;
  installedAt: string;
  depsInstalled: boolean;
  links: string[]; // 전역에 생성한 심볼릭 링크 절대경로들
}

export function ensureDir(d: string): void {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}

function pointsIntoRepo(linkPath: string): boolean {
  try {
    return realpathSync(linkPath).startsWith(realpathSync(REPO_ROOT));
  } catch {
    return false;
  }
}

/**
 * src 를 destDir 안에 심볼릭 링크한다.
 * - 같은 이름의 우리 링크가 이미 있으면 갱신
 * - 같은 이름의 '실제 파일'(사용자 것)이 있으면 건드리지 않고 skip(경고)
 * @returns 생성/갱신한 링크 경로, 또는 skip 시 null
 */
export function linkInto(src: string, destDir: string, warns: string[]): string | null {
  ensureDir(destDir);
  const dest = join(destDir, basename(src));
  if (existsSync(dest) || isSymlink(dest)) {
    if (isSymlink(dest)) {
      // 우리 링크거나 깨진 링크면 교체, 남의 링크면 교체(이름이 fixy-* 라 충돌 시 우리 것 우선)
      try { unlinkSync(dest); } catch { /* noop */ }
    } else {
      warns.push(`스킵: ${dest} 는 실제 파일이라 건드리지 않음(사용자 소유로 간주).`);
      return null;
    }
  }
  symlinkSync(src, dest);
  return dest;
}

function isSymlink(p: string): boolean {
  try { return lstatSync(p).isSymbolicLink(); } catch { return false; }
}

/** destDir 내에서 우리 레포를 가리키는 심볼릭 링크를 제거한다. */
export function unlinkIfOurs(linkPath: string): "removed" | "skipped" | "absent" {
  if (!isSymlink(linkPath)) return existsSync(linkPath) ? "skipped" : "absent";
  if (!pointsIntoRepo(linkPath)) return "skipped";
  try { unlinkSync(linkPath); return "removed"; } catch { return "skipped"; }
}

export function listFiles(dir: string, ext: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(ext)).map((f) => join(dir, f));
}

export function listDirs(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .map((f) => join(dir, f))
    .filter((p) => { try { return lstatSync(p).isDirectory(); } catch { return false; } });
}

export function readManifest(): Manifest | null {
  if (!existsSync(MANIFEST)) return null;
  try { return JSON.parse(readFileSync(MANIFEST, "utf8")) as Manifest; } catch { return null; }
}

export function writeManifest(m: Manifest): void {
  writeFileSync(MANIFEST, JSON.stringify(m, null, 2), "utf8");
}
