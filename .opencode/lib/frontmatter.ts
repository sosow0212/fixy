/**
 * SKILL.md 의 YAML 프론트매터 최소 읽기/쓰기.
 * 우리가 생성하는 한정된 형태만 다룬다: name, description, license,
 * 그리고 문자열-문자열 맵인 metadata (opencode 스킬 스펙).
 * 외부 yaml 의존성을 피하기 위한 자체 구현.
 */

export interface SkillDoc {
  name: string;
  description: string;
  license?: string;
  metadata: Record<string, string>;
  body: string;
}

/** SKILL.md 전체 텍스트를 파싱한다. 프론트매터가 없으면 빈 메타로 반환. */
export function parseSkill(text: string): SkillDoc {
  const m = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/.exec(text);
  if (!m) return { name: "", description: "", metadata: {}, body: text.trim() };
  const fm = m[1];
  const body = (m[2] ?? "").trim();
  const doc: SkillDoc = { name: "", description: "", metadata: {}, body };

  const lines = fm.split("\n");
  let inMeta = false;
  for (const raw of lines) {
    if (!raw.trim()) continue;
    const indented = /^\s+/.test(raw);
    const kv = /^\s*([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(raw);
    if (!kv) continue;
    const key = kv[1];
    const val = unquote(kv[2].trim());

    if (!indented) {
      inMeta = key === "metadata" && val === "";
      if (key === "name") doc.name = val;
      else if (key === "description") doc.description = val;
      else if (key === "license") doc.license = val;
    } else if (inMeta) {
      doc.metadata[key] = val;
    }
  }
  return doc;
}

/** SkillDoc 을 SKILL.md 텍스트로 직렬화한다. */
export function stringifySkill(doc: SkillDoc): string {
  const lines: string[] = ["---"];
  lines.push(`name: ${doc.name}`);
  lines.push(`description: ${quoteIfNeeded(doc.description)}`);
  if (doc.license) lines.push(`license: ${doc.license}`);
  const keys = Object.keys(doc.metadata);
  if (keys.length) {
    lines.push("metadata:");
    // metadata 는 opencode 스펙상 '문자열-문자열' 맵이다. 항상 따옴표로 감싸
    // level: 3(숫자)·created: 2026-06-17(날짜) 같은 YAML 타입 드리프트를 막고 라운드트립을 안정화한다.
    for (const k of keys) lines.push(`  ${k}: ${quoteMeta(doc.metadata[k])}`);
  }
  lines.push("---");
  lines.push("");
  lines.push(doc.body.trim());
  lines.push("");
  return lines.join("\n");
}

function unquote(s: string): string {
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
    // 인코더가 넣은 이스케이프(\\, \")를 역순으로 정확히 되돌린다(라운드트립 무손실).
    return s.slice(1, -1).replace(/\\(["\\])/g, "$1");
  }
  if (s.length >= 2 && s.startsWith("'") && s.endsWith("'")) {
    return s.slice(1, -1);
  }
  return s;
}

/** metadata 값은 항상 큰따옴표로 감싸 문자열 타입을 보존한다(unquote 와 대칭). */
function quoteMeta(s: string): string {
  return `"${(s ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function quoteIfNeeded(s: string): string {
  const v = s ?? "";
  // 콜론/해시/선행공백/줄바꿈/따옴표·백슬래시 포함 시 큰따옴표로 감싸고
  // 백슬래시→따옴표 순으로 이스케이프(unquote 와 대칭). 빈 문자열도 감싼다.
  if (v === "" || /^\s|[:#"'\\\n]|^[[{]/.test(v)) {
    return `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return v;
}
