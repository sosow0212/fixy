/**
 * fixy-tools — fixy 의 네이티브 툴(레벨 파이프라인 조작). 기계적 처리는 토큰 0.
 *
 *   fixy_recall   학습 스킬 검색·재사용(L2→L3 신호 누적)
 *   fixy_note     L1 에피소드 수동 기록(불만/인사이트)
 *   fixy_status   레벨 파이프라인 현황
 *   fixy_digest   미승급 L1 클러스터(=L2 승급 후보) 집계
 *   fixy_promote  L1 클러스터 → L2 스킬 작성(시크릿 게이트)
 *   fixy_levelup  L2 → L3 승급(재사용 임계 충족 시)
 *   fixy_share    학습물 → 포크 PR 공유(시크릿 게이트)
 */
import type { Plugin } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin";
import { getConfig } from "../lib/paths.ts";
import { extractTags, jaccard } from "../lib/text.ts";
import { scanText } from "../lib/secret-scan.ts";
import { appendEpisode, newEpisodeId } from "../lib/episodes.ts";
import {
  listSkills, getSkill, writeSkillDoc, incrementUse, setSkillLevel,
  clusterEpisodes, pipelineStatus, type SkillInfo,
} from "../lib/levels.ts";
import { shareSkills, listUnsharedSkills, getRepoTargets } from "../lib/github.ts";

const z = tool.schema;

export const FixyTools: Plugin = async () => {
  // 세션별로 이미 recall 한(재사용 카운트한) 스킬 집합 — 세션당 스킬 1회만 uses 를 올린다.
  const recalledPerSession = new Map<string, Set<string>>();
  return {
    dispose: async () => recalledPerSession.clear(),
    tool: {
      fixy_recall: tool({
        description:
          "학습된 스킬을 검색해 재사용한다. 새 작업을 시작하기 전, 비슷한 일을 전에 배웠는지 먼저 확인하라. 반환된 스킬은 재사용 횟수가 올라가 L3(팀 공통) 승급 신호가 된다.",
        args: {
          query: z.string().describe("작업/문제 설명 또는 키워드"),
          limit: z.number().optional().describe("최대 반환 개수(기본 3)"),
        },
        async execute(args, context) {
          const skills = listSkills();
          if (skills.length === 0) return "학습된 스킬이 아직 없습니다.";
          const qTags = extractTags(args.query, 12);
          const q = args.query.toLowerCase();
          const scored = skills
            .map((s) => ({ s, score: scoreSkill(s, qTags, q) }))
            .filter((x) => x.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, args.limit ?? 3);
          if (scored.length === 0) return "관련 스킬을 찾지 못했습니다. 새로 익히면 fixy_note 로 기록하세요.";

          // 재사용(uses) 카운트는 '세션당 스킬 1회'만 증가시킨다 —
          // 작업 전 투기적·반복 recall 로 L3 승급 게이트(uses>=minUses)가 오염되는 것을 막는다.
          const seen = recalledPerSession.get(context.sessionID) ?? new Set<string>();
          recalledPerSession.set(context.sessionID, seen);

          const lines = scored.map(({ s }) => {
            let uses = s.uses;
            if (!seen.has(s.name)) {
              uses = incrementUse(s.name); // 이 세션에서 처음 떠올린 스킬만 +1
              seen.add(s.name);
            }
            const excerpt = s.doc.body.split("\n").slice(0, 24).join("\n");
            return `### ${s.name}  _(L${s.level} · ${s.scope} · 재사용 ${uses}회)_\n${s.description}\n\n${excerpt}`;
          });
          return `🔎 관련 스킬 ${scored.length}건:\n\n${lines.join("\n\n---\n\n")}`;
        },
      }),

      fixy_note: tool({
        description:
          "지금 배운 것/사용자 불만/교정을 L1 에피소드로 즉시 기록한다. 자동 기록을 보강하는 수동 핀. 같은 주제가 쌓이면 fixy_digest 가 L2 승급 후보로 잡는다.",
        args: {
          signal: z.enum(["complaint", "correction", "insight", "success"]).describe("신호 유형"),
          summary: z.string().describe("한두 문장 요약"),
          tags: z.array(z.string()).optional().describe("태그(미지정 시 summary 에서 자동 추출)"),
        },
        async execute(args) {
          const tags = args.tags?.length ? args.tags.map((t) => t.toLowerCase()) : extractTags(args.summary);
          appendEpisode({
            id: newEpisodeId(),
            ts: new Date().toISOString(),
            sessionID: "manual",
            signal: args.signal,
            summary: args.summary.slice(0, 320),
            tags,
            files: [],
          });
          return `📝 L1 기록 완료 (${args.signal}) · tags: ${tags.join(", ") || "—"}`;
        },
      }),

      fixy_status: tool({
        description: "레벨 파이프라인 현황(L1 에피소드 → L2/L3 스킬 → L4/L5 규칙)과 승급/공유 대기 항목을 보여준다.",
        args: {},
        async execute() {
          const st = pipelineStatus();
          const cfg = getConfig();
          const unshared = await listUnsharedSkills().catch(() => []);
          const repo = await getRepoTargets().catch(() => null);
          const sig = st.l1.bySignal;
          return [
            `# fixy 파이프라인`,
            ``,
            `**L1 에피소드** ${st.l1.total}건 (미승급 ${st.l1.unpromoted}) — 불만 ${sig.complaint} · 교정 ${sig.correction} · 인사이트 ${sig.insight} · 성공 ${sig.success} · 일반 ${sig.note}`,
            `**L2→L3 후보(클러스터)** ${st.l2Candidates.length}건 — \`fixy_digest\`/\`/fixy-evolve\` 로 스킬화`,
            `**스킬** 총 ${st.skills.total} (L2 ${st.skills.l2} · L3 ${st.skills.l3})`,
            `**L3 승급 대기**(재사용 ≥ ${cfg.levels.l2ToL3.minUses}) ${st.l3Candidates.length}건${st.l3Candidates.length ? `: ${st.l3Candidates.map((s) => s.name).join(", ")}` : ""}`,
            `**L4 통합 후보**(동일 태그 L3 ≥ ${cfg.levels.l3ToL4.minSkills}) ${st.l4Candidates.length}건${st.l4Candidates.length ? `: ${st.l4Candidates.map((c) => c.tag).join(", ")}` : ""}`,
            `**규칙** L4 ${st.rules.l4}개 · L5 코어 ${st.rules.l5 ? "있음" : "없음"}`,
            ``,
            `**공유 대기 스킬** ${unshared.length}건${unshared.length ? `: ${unshared.join(", ")}` : ""} → \`/fixy-share\``,
            repo ? `**저장소** fork=${repo.fork || "(미설정)"} · upstream=${repo.upstream || "(미설정)"} · origin=${repo.origin || "(없음)"}` : ``,
          ].join("\n");
        },
      }),

      fixy_digest: tool({
        description:
          "미승급 L1 에피소드를 유사도로 묶어 L2 스킬 승급 후보(클러스터)를 반환한다. /fixy-evolve 의 1단계. 각 클러스터의 episodeIds 를 fixy_promote 에 넘겨 스킬화하라.",
        args: { limit: z.number().optional().describe("최대 클러스터 수(기본 8)") },
        async execute(args) {
          const clusters = clusterEpisodes().slice(0, args.limit ?? 8);
          if (clusters.length === 0) return "L2 승급 후보가 아직 없습니다. (유사 에피소드가 임계치만큼 쌓여야 함)";
          return clusters
            .map((c, i) => {
              const sig = Object.entries(c.signals).filter(([, n]) => n > 0).map(([k, n]) => `${k}:${n}`).join(" ");
              return [
                `## 후보 ${i + 1} — tags: ${c.tags.join(", ")}`,
                `규모 ${c.size} · 응집도 ${c.cohesion} · 신호 ${sig}`,
                `episodeIds: ${c.episodeIds.join(", ")}`,
                `사례:`,
                ...c.samples.map((s) => `  - ${s}`),
              ].join("\n");
            })
            .join("\n\n");
        },
      }),

      fixy_promote: tool({
        description:
          "L1 클러스터를 L2 스킬(SKILL.md)로 작성한다. body 는 재사용 가능한 절차/런북으로 직접 써라. 시크릿이 있으면 거부된다. episodeIds 를 넘기면 해당 L1 들이 승급 표시된다.",
        args: {
          name: z.string().describe("kebab-case 스킬 이름"),
          description: z.string().describe("1~2문장 설명(스킬 목록에 노출)"),
          body: z.string().describe("SKILL.md 본문 — 언제 쓰는지 + 단계별 절차"),
          tags: z.array(z.string()).optional().describe("태그"),
          episodeIds: z.array(z.string()).optional().describe("승급 표시할 L1 id 들"),
        },
        async execute(args) {
          const findings = [...scanText(args.body), ...scanText(args.description)];
          if (findings.length) {
            return `🚫 시크릿/사내 식별자 ${findings.length}건 발견 — 스킬 작성을 막았습니다. 제거 후 다시 시도하세요.\n` +
              findings.map((f) => `  - L${f.line} ${f.kind}`).join("\n");
          }
          const name = args.name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
          const { file } = writeSkillDoc({
            name,
            description: args.description,
            body: args.body,
            tags: args.tags ?? extractTags(args.description + " " + args.body),
            level: 2,
            scope: "personal",
            evidence: args.episodeIds?.length ?? 1,
            source: "fixy-promote",
            episodeIds: args.episodeIds,
          });
          return `✅ L2 스킬 생성: ${name}\n파일: ${file}\n공유하려면 \`/fixy-share ${name}\``;
        },
      }),

      fixy_levelup: tool({
        description:
          "L2 스킬을 L3(팀 공통)로 승급한다. 재사용 임계치를 충족했을 때 호출. L4/L5(규칙·코어) 승급은 사람 승인이 필요하므로 /fixy-level-up 커맨드로 진행한다.",
        args: { name: z.string().describe("승급할 스킬 이름") },
        async execute(args) {
          const s = getSkill(args.name);
          if (!s) return `스킬을 찾을 수 없습니다: ${args.name}`;
          const min = getConfig().levels.l2ToL3.minUses;
          if (s.level !== 2) return `L${s.level} 스킬입니다. L2 만 L3 로 승급할 수 있습니다.`;
          if (s.uses < min) return `재사용 ${s.uses}/${min}회 — 아직 L3 승급 임계 미달입니다.`;
          setSkillLevel(args.name, 3, "team");
          return `⬆️ ${args.name} → L3(팀 공통) 승급 완료. \`/fixy-share ${args.name}\` 로 팀에 공유하세요.`;
        },
      }),

      fixy_share: tool({
        description:
          "학습물(스킬±규칙)을 포크 저장소에 브랜치+PR 로 공유한다. 시크릿 스캔을 통과해야 한다. dryRun 으로 먼저 점검 가능. target=upstream 이면 팀 원본(코어)으로 올린다.",
        args: {
          skills: z.array(z.string()).describe("공유할 스킬 이름들"),
          title: z.string().describe("PR 제목"),
          body: z.string().describe("PR 본문(무엇을·왜 배웠는지)"),
          level: z.number().optional().describe("공유 레벨(기본 2)"),
          target: z.enum(["fork", "upstream"]).optional().describe("PR 대상(기본 fork)"),
          extraPaths: z.array(z.string()).optional().describe("추가 파일 절대경로(rules/team-*.md 등)"),
          dryRun: z.boolean().optional().describe("true 면 검증만"),
        },
        async execute(args) {
          const res = await shareSkills({
            skills: args.skills,
            extraPaths: args.extraPaths,
            title: args.title,
            body: args.body,
            level: args.level ?? 2,
            target: args.target,
            dryRun: args.dryRun,
          });
          const head = res.ok ? "✅" : "⚠️";
          const detail = [
            res.message,
            res.branch ? `branch: ${res.branch}` : "",
            res.prUrl ? `PR: ${res.prUrl}` : "",
            res.findings?.length ? res.findings.map((f) => `  - ${f.file ?? ""}:${f.line} ${f.kind}`).join("\n") : "",
          ].filter(Boolean).join("\n");
          return `${head} ${detail}`;
        },
      }),
    },
  };
};

function scoreSkill(s: SkillInfo, qTags: string[], q: string): number {
  let score = jaccard(s.tags, qTags) * 3;
  if (s.description.toLowerCase().includes(q)) score += 2;
  if (s.name.toLowerCase().includes(q.replace(/\s+/g, "-"))) score += 2;
  for (const t of qTags) {
    if (s.name.includes(t)) score += 0.5;
    if (s.description.toLowerCase().includes(t)) score += 0.3;
  }
  // 높은 레벨(검증된 공통 지식) 약간 우대
  score += (s.level - 2) * 0.2;
  return +score.toFixed(3);
}
