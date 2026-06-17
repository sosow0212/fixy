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
    for (const k of keys) lines.push(`  ${k}: ${quoteIfNeeded(doc.metadata[k])}`);
  }
  lines.push("---");
  lines.push("");
  lines.push(doc.body.trim());
  lines.push("");
  return lines.join("\n");
}

function unquote(s: string): string {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

function quoteIfNeeded(s: string): string {
  const v = s ?? "";
  // 콜론/특수문자/선행공백이 있으면 따옴표로 감싼다
  if (/^[\s]|[:#]|^["'\[{]|[\n]/.test(v) || v === "") return `"${v.replace(/"/g, '\\"')}"`;
  return v;
}
