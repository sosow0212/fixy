/**
 * fixy-recorder — 이너 루프(L1 자동 기록). LLM 토큰 0.
 *
 * chat.message 로 사용자 프롬프트를 받아 신호(불만/교정/일반)·태그를 뽑아 두고,
 * tool.execute.after 로 만진 파일을 모은 뒤, session.idle 마다 "작업 단위" 에피소드
 * 한 건을 memory/episodes.jsonl 에 append 한다. 이 raw 기록이 L2 승급의 재료다.
 */
import type { Plugin } from "@opencode-ai/plugin";
import { basename, isAbsolute, relative } from "node:path";
import { getConfig } from "../lib/paths.ts";
import { detectSignal, extractTags, type Signal } from "../lib/text.ts";
import { redact } from "../lib/secret-scan.ts";
import { appendEpisode, newEpisodeId } from "../lib/episodes.ts";

interface Pending {
  prompt: string;
  signal: Signal;
  tags: string[];
  files: Set<string>;
  agent?: string;
  project: string;
  ts: number; // 마지막 갱신 시각 — idle 미발생 세션 축출용
}

const STALE_MS = 30 * 60 * 1000;

const EDIT_TOOLS = /^(edit|write|patch|multiedit|multi_edit|apply_patch)$/i;

export const FixyRecorder: Plugin = async ({ worktree, directory }) => {
  const pending = new Map<string, Pending>();
  const root = worktree || directory || process.cwd();
  const project = basename(root);

  const recordingOff = () =>
    process.env.FIXY_RECORD === "0" || getConfig().record.enabled === false;

  // 전역 플러그인이므로 기본은 fixy 계열 에이전트 세션만 기록한다(다른 에이전트 세션 오염 방지).
  // 모든 에이전트를 기록하려면 FIXY_RECORD_ALL=1.
  const inScope = (agent?: string) =>
    process.env.FIXY_RECORD_ALL === "1" || /fixy/i.test(agent ?? "");

  return {
    "chat.message": async (input, output) => {
      if (recordingOff() || !inScope(input.agent)) return;
      const text = (output.parts ?? [])
        .filter((p: any) => p?.type === "text" && typeof p.text === "string" && !p.synthetic)
        .map((p: any) => p.text)
        .join("\n")
        .trim();
      if (!text || text.length < 2) return;

      const cfg = getConfig();
      pending.set(input.sessionID, {
        prompt: redact(text).slice(0, cfg.record.maxPromptChars),
        signal: detectSignal(text),
        tags: extractTags(text),
        files: new Set(),
        agent: input.agent,
        project,
        ts: Date.now(),
      });
    },

    "tool.execute.after": async (input) => {
      const p = pending.get(input.sessionID);
      if (!p) return;
      if (!EDIT_TOOLS.test(input.tool)) return;
      const a = input.args ?? {};
      const raw = a.filePath ?? a.path ?? a.file ?? a.filename;
      if (typeof raw === "string" && raw) {
        p.files.add(isAbsolute(raw) ? relative(root, raw) : raw);
      }
    },

    dispose: async () => pending.clear(),

    event: async ({ event }) => {
      if (event.type !== "session.idle") return;
      const sid = event.properties.sessionID;
      const p = pending.get(sid);
      pending.delete(sid); // 기록 on/off 와 무관하게 항상 정리(토글로 인한 잔존 방지)

      // idle 을 못 낸 채 끝난 세션 엔트리 축출(누수 방지)
      const now = Date.now();
      for (const [k, v] of pending) if (now - v.ts > STALE_MS) pending.delete(k);

      if (!p || recordingOff()) return;

      appendEpisode({
        id: newEpisodeId(),
        ts: new Date().toISOString(),
        sessionID: sid,
        agent: p.agent,
        signal: p.signal,
        summary: p.prompt,
        tags: p.tags,
        files: [...p.files],
        project: p.project,
      });
    },
  };
};
