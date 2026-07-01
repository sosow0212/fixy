import { Eye, ShieldAlert } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";

export function SecretAuditLogPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="시크릿 감사 로그"
        description="시크릿 reveal 행위가 기록되는 곳이에요."
      />
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-xs leading-relaxed">
          백엔드의 <code className="rounded bg-amber-500/20 px-1 py-0.5 font-mono text-[10px]">audit</code>{" "}
          도메인이 활성화되면 여기에 reveal 기록이 표시돼요. 자세한 내용은{" "}
          <code className="rounded bg-amber-500/20 px-1 py-0.5 font-mono text-[10px]">
            docs/design.md §8
          </code>
          .
        </p>
      </div>
      <EmptyState
        title="아직 감사 로그 도메인이 없어요"
        description="백엔드 audit 도메인이 출시되면 reveal/role-change/agent-rotate 같은 행위가 시간순으로 보여요."
        icon={<Eye className="h-5 w-5" />}
      />
    </div>
  );
}
