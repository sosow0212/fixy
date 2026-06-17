/**
 * fixy-autoshare — 세션 종료(session.idle) 시 공유 대기 스킬을 자동 PR 로 올린다.
 *
 * 기본 OFF. 켜려면 fixy.config.json share.autoOnIdle=true 또는 env FIXY_AUTOSHARE=1.
 * 안전장치: 시크릿 스캔(github.shareSkills 내부) + 디바운스(최근 공유 후 N초 무시) +
 * minLevelToShare 미만 스킬 제외. 깜짝 PR 을 막기 위해 보수적으로 동작한다.
 */
import type { Plugin } from "@opencode-ai/plugin";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getConfig, paths, ensureRuntimeDirs } from "../lib/paths.ts";
import { listSkills } from "../lib/levels.ts";
import { listUnsharedSkills, shareSkills } from "../lib/github.ts";

const DEBOUNCE_MS = 90_000;

export const FixyAutoshare: Plugin = async () => {
  const stamp = join(paths.stateDir(), "autoshare.stamp");

  const enabled = () =>
    process.env.FIXY_AUTOSHARE === "1" || getConfig().share.autoOnIdle === true;

  return {
    event: async ({ event }) => {
      if (event.type !== "session.idle") return;
      if (!enabled()) return;

      // 디바운스
      ensureRuntimeDirs();
      const now = Date.now();
      if (existsSync(stamp)) {
        const last = parseInt(readFileSync(stamp, "utf8").trim() || "0", 10);
        if (now - last < DEBOUNCE_MS) return;
      }

      const cfg = getConfig();
      const unshared = await listUnsharedSkills().catch(() => []);
      if (unshared.length === 0) return;

      // minLevelToShare 이상만
      const byName = new Map(listSkills().map((s) => [s.name, s]));
      const targets = unshared.filter((n) => (byName.get(n)?.level ?? 0) >= cfg.share.minLevelToShare);
      if (targets.length === 0) return;

      writeFileSync(stamp, String(now), "utf8");
      await shareSkills({
        skills: targets,
        title: `fixy: 학습 스킬 자동 공유 (${targets.length}건)`,
        body: `세션 종료 시 자동 공유.\n\n스킬: ${targets.join(", ")}\n\n> fixy-autoshare 플러그인이 생성한 PR 입니다. 검토 후 머지하세요.`,
        level: cfg.share.minLevelToShare,
        target: "fork",
      }).catch(() => {/* 자동 공유 실패는 조용히 무시 — 다음 /fixy-share 로 수동 가능 */});
    },
  };
};
