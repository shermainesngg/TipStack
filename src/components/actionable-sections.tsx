import type { Content } from "@/types";

const TOKEN_CONTEXT_TAGS = new Set(["cost_optimization", "context_management"]);

function hasTokenContextFocus(tags: string[]): boolean {
  return tags.some((t) => TOKEN_CONTEXT_TAGS.has(t));
}

export function ActionableSections({ content }: { content: Content }) {
  const hasPracticalUseCase = !!content.practical_use_case;
  const hasTryThis = !!content.try_this;
  const isTokenContext = hasTokenContextFocus(content.tags_focus ?? []);

  if (!hasPracticalUseCase && !hasTryThis) return null;

  return (
    <div className="mt-10 space-y-4">
      {hasPracticalUseCase && (
        <div className="rounded-2xl bg-[#f0f8f2] dark:bg-[#1a2b1e] p-5">
          <h3 className="font-heading font-semibold text-[#2D6040] dark:text-[#7EBE8E] text-[15px] tracking-wide mb-2">
            When to Use This
          </h3>
          <p className="text-[15px] leading-[1.7] text-[#3D3D50] dark:text-[#C8D0C6]">
            {content.practical_use_case}
          </p>
        </div>
      )}
      {hasTryThis && (
        <div
          className={`rounded-2xl p-5 ${
            isTokenContext
              ? "bg-[#eef3fa] dark:bg-[#1a2030] ring-1 ring-[#c4d5e8] dark:ring-[#2a3a50]"
              : "bg-[#f3eff8] dark:bg-[#221e2e]"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <h3
              className={`font-heading font-semibold text-[15px] tracking-wide ${
                isTokenContext
                  ? "text-[#3D6080] dark:text-[#97C5E5]"
                  : "text-[#5E3F96] dark:text-[#B89DD4]"
              }`}
            >
              Try This Now
            </h3>
            {isTokenContext && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] px-2 py-0.5 rounded-md bg-[#d8e4f0] text-[#3D6080] dark:bg-[#1F2E3D] dark:text-[#97C5E5]">
                Token &amp; Context
              </span>
            )}
          </div>
          <p className="text-[15px] leading-[1.7] text-[#3D3D50] dark:text-[#C8D0C6]">
            {content.try_this}
          </p>
        </div>
      )}
    </div>
  );
}
