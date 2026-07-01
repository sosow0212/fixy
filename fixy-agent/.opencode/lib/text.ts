/**
 * 결정론적 텍스트 분석 — LLM 토큰 0.
 * - detectSignal: 사용자 메시지가 불만/교정/일반 중 무엇인지 휴리스틱 판정
 * - extractTags: 클러스터링용 정규화 태그 추출
 */

export type Signal = "complaint" | "correction" | "insight" | "success" | "note";

// 불만(complaint) — 부정·불평·짜증 신호
const COMPLAINT_MARKERS = [
  /\b(no|nope|wrong|bad|broken|useless|terrible|stupid|why (is|does|did))\b/i,
  /(아니|틀렸|틀린|별로|이상해|왜 이렇|짜증|쓸모없|최악|망했|안 ?돼|안 ?됨|안 ?되)/,
];
// 교정(correction) — 다시/이게 아니라/수정 요구
const CORRECTION_MARKERS = [
  /\b(actually|instead|not (that|what)|i (said|meant)|redo|again|fix (this|it)|that'?s not)\b/i,
  /(그게 아니라|다시|아까|수정해|고쳐|바꿔|반대로|말고|했잖아|하라니까|랬잖아)/,
];
// 성공/감사 신호
const SUCCESS_MARKERS = [
  /\b(thanks|thank you|perfect|great|nice|works|lgtm|good job)\b/i,
  /(고마워|감사|좋아|완벽|굿|잘했|이제 ?돼|동작해|성공)/,
];

/**
 * 메시지 텍스트의 1차 신호를 판정한다.
 * 우선순위: correction > complaint > success > note.
 * (교정은 "무엇을 어떻게 바꿔라"라는 가장 실행 가능한 신호라 불만보다 우선한다.
 *  예: "아니 그게 아니라 다시" 는 불만 마커 '아니'도 있지만 교정으로 본다.)
 */
export function detectSignal(text: string): Signal {
  const t = text ?? "";
  if (CORRECTION_MARKERS.some((re) => re.test(t))) return "correction";
  if (COMPLAINT_MARKERS.some((re) => re.test(t))) return "complaint";
  if (SUCCESS_MARKERS.some((re) => re.test(t))) return "success";
  return "note";
}

// 클러스터 신호로 도움이 되는 기술 키워드(가산점)
const TECH_KEYWORDS = new Set([
  "react", "vue", "svelte", "next", "nuxt", "angular", "node", "nest", "nestjs", "express",
  "spring", "django", "flask", "fastapi", "rails", "laravel", "go", "rust", "java", "kotlin",
  "typescript", "javascript", "python", "ruby", "php", "sql", "postgres", "mysql", "mongodb",
  "redis", "kafka", "docker", "kubernetes", "k8s", "terraform", "aws", "gcp", "azure",
  "graphql", "rest", "grpc", "websocket", "auth", "oauth", "jwt", "session", "cookie",
  "test", "jest", "vitest", "pytest", "cypress", "playwright", "eslint", "prettier",
  "webpack", "vite", "rollup", "babel", "tailwind", "css", "html", "api", "db", "orm",
  "prisma", "typeorm", "migration", "build", "deploy", "ci", "cd", "lint", "type", "hook",
  "state", "component", "route", "router", "middleware", "controller", "service", "repository",
  "cache", "queue", "cron", "env", "config", "log", "error", "exception", "bug", "perf",
  "memory", "leak", "race", "async", "promise", "stream", "buffer",
]);

const STOPWORDS = new Set([
  // EN
  "the", "and", "for", "with", "this", "that", "you", "are", "was", "but", "not", "can",
  "have", "has", "had", "will", "would", "should", "could", "from", "into", "your", "our",
  "all", "any", "out", "get", "got", "use", "using", "make", "made", "add", "new", "code",
  "please", "help", "want", "need", "let", "now", "then", "when", "what", "how", "why",
  // KO 조사/흔한 단어
  "그리고", "그래서", "근데", "이거", "저거", "그거", "여기", "거기", "해줘", "주세요",
  "있어", "없어", "하는", "하고", "해서", "에서", "으로", "에게", "한테", "보다",
  "좀", "좀더", "다시", "이제", "근데", "그냥", "진짜", "정말", "너무",
]);

/**
 * 메시지에서 클러스터링용 태그(정규화 키워드)를 추출한다.
 * - 파일 확장자/경로 토큰, 기술 키워드 우선
 * - 불용어·1글자 제거, 빈도순 상위 N
 */
export function extractTags(text: string, max = 10): string[] {
  const t = (text ?? "").toLowerCase();
  const freq = new Map<string, number>();
  const bump = (w: string, by = 1) => freq.set(w, (freq.get(w) ?? 0) + by);

  // 파일 확장자 신호
  for (const m of t.matchAll(/\.([a-z]{1,5})\b/g)) bump(`ext:${m[1]}`, 2);

  // 단어 토큰 (영문/숫자 + 한글)
  for (const m of t.matchAll(/[a-z0-9]{2,}|[가-힣]{2,}/g)) {
    const w = m[0];
    if (STOPWORDS.has(w)) continue;
    if (/^\d+$/.test(w)) continue;
    bump(w, TECH_KEYWORDS.has(w) ? 3 : 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, max)
    .map(([w]) => w);
}

/** 두 태그 집합의 Jaccard 유사도 (0~1). */
export function jaccard(a: string[], b: string[]): number {
  const A = new Set(a), B = new Set(b);
  if (A.size === 0 && B.size === 0) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

/** 태그 배열에서 사람이 읽을 슬러그(kebab-case) 후보를 만든다. */
export function slugFromTags(tags: string[], fallback = "skill"): string {
  const words = tags
    .filter((t) => !t.startsWith("ext:"))
    .slice(0, 3)
    .map((t) => t.replace(/[^a-z0-9가-힣]/gi, ""))
    .filter(Boolean);
  const slug = words.join("-").toLowerCase().replace(/[^a-z0-9-]/g, "");
  return slug || fallback;
}
