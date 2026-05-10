import type { Content } from "@/types";

export function ActionableSections({ content }: { content: Content }) {
  const hasPracticalUseCase = !!content.practical_use_case;
  const hasTryThis = !!content.try_this;

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
        <div className="rounded-2xl bg-[#f3eff8] dark:bg-[#221e2e] p-5">
          <h3 className="font-heading font-semibold text-[#5E3F96] dark:text-[#B89DD4] text-[15px] tracking-wide mb-2">
            Try This Now
          </h3>
          <p className="text-[15px] leading-[1.7] text-[#3D3D50] dark:text-[#C8D0C6]">
            {content.try_this}
          </p>
        </div>
      )}
    </div>
  );
}
