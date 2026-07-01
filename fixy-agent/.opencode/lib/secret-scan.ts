/**
 * 시크릿 스캐너 — PR 공유 전 안전 게이트.
 * 학습 스킬/규칙에 토큰·키·사내 식별자가 섞여 나가는 것을 결정론적으로 차단한다.
 */
import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { join } from "node:path";

export interface SecretFinding {
  file?: string;
  line: number;
  kind: string;
  preview: string;
}

const PATTERNS: { kind: string; re: RegExp }[] = [
  { kind: "github-pat", re: /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b/ },
  { kind: "github-fine-grained-pat", re: /\bgithub_pat_[A-Za-z0-9_]{22,}\b/ },
  { kind: "gitlab-pat", re: /\bglpat-[A-Za-z0-9_-]{20,}\b/ },
  { kind: "aws-access-key", re: /\b(AKIA|ASIA)[A-Z0-9]{16}\b/ },
  { kind: "aws-secret", re: /\baws_secret_access_key\s*[=:]\s*['"]?[A-Za-z0-9/+]{40}/i },
  { kind: "slack-token", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { kind: "google-api-key", re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { kind: "private-key", re: /-----BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/ },
  { kind: "jwt", re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  { kind: "bearer-token", re: /\bBearer\s+[A-Za-z0-9._~+/-]{20,}=*/ },
  // 따옴표 유무 모두 탐지: .env/YAML/shell 의 비따옴표 대입이 실제 유출 주형이다.
  { kind: "generic-secret", re: /\b(api[_-]?key|secret|token|password|passwd|pwd)\s*[=:]\s*(?:['"][^'"\s]{8,}['"]|[^\s'"]{12,})/i },
  { kind: "slack-webhook", re: /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/]+/ },
  // FQDN 형태(label.label.suffix, 점 2개 이상)만 — config.corp / data.internal 같은 일반 코드 오탐 방지.
  { kind: "private-host", re: /\b[a-z0-9-]+\.[a-z0-9-]+\.(?:internal|corp|local|intra)\b/i },
];

// 명백한 예시/플레이스홀더 — '매칭된 토큰 자체'에만 적용한다(줄 전체에 적용하지 않음).
const ALLOWLIST = /(example|placeholder|your[_-]?(key|token)|xxx+|\bREDACTED\b|dummy|sample|changeme)/i;

/** 한 텍스트 블록에서 시크릿 후보를 찾는다. */
export function scanText(text: string, file?: string): SecretFinding[] {
  const out: SecretFinding[] = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const { kind, re } of PATTERNS) {
      const m = re.exec(line);
      // 매칭된 '토큰 자체'가 플레이스홀더일 때만 무시한다.
      // (줄 전체를 ALLOWLIST 로 버리면, 진짜 시크릿이 example/<tag> 와 같은 줄에 있을 때 통째로 통과되는 우회가 생긴다.)
      if (m && !ALLOWLIST.test(m[0])) {
        out.push({ file, line: i + 1, kind, preview: redact(line.trim()).slice(0, 120) });
        break; // 한 줄당 한 건이면 충분
      }
    }
  });
  return out;
}

/**
 * 텍스트의 시크릿을 [REDACTED kind] 로 치환한다(L1 기록 저장 전 사용).
 * 치환 마커에 공백을 넣어, 한 패턴이 만든 마커를 다른 패턴(예: generic-secret)이
 * 다시 매칭해 라벨을 덮어쓰는 연쇄 치환을 막는다.
 */
export function redact(text: string): string {
  let out = text ?? "";
  for (const { kind, re } of PATTERNS) {
    const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
    out = out.replace(g, `[REDACTED ${kind}]`);
  }
  return out;
}

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", "memory"]);

/** 디렉토리(또는 파일 목록)를 재귀 스캔한다. */
export function scanPaths(targets: string[]): SecretFinding[] {
  const findings: SecretFinding[] = [];
  const visit = (p: string) => {
    if (!existsSync(p)) return;
    const st = statSync(p);
    if (st.isDirectory()) {
      const base = p.split("/").pop() ?? "";
      if (SKIP_DIRS.has(base)) return;
      for (const child of readdirSync(p)) visit(join(p, child));
    } else if (st.isFile() && st.size < 512 * 1024) {
      try {
        findings.push(...scanText(readFileSync(p, "utf8"), p));
      } catch {
        /* 바이너리/읽기 실패 무시 */
      }
    }
  };
  for (const t of targets) visit(t);
  return findings;
}
