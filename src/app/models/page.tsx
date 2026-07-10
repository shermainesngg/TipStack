import type { Metadata } from "next";
import { getAllModels } from "@/lib/models";
import { ModelsDashboard } from "@/components/models-dashboard";

export const metadata: Metadata = {
  title: "Models Worth Exploring — TipStack",
  description:
    "Compare the frontier AI models worth your time — capabilities, strengths and weaknesses, and the latest updates.",
};

export default function ModelsPage() {
  const models = getAllModels();

  return (
    <div className="pt-10 pb-16 lg:pt-14">
      <header className="mb-8 max-w-[760px]">
        <div className="mb-3 text-[11px] font-heading font-semibold uppercase tracking-[0.14em] text-[#8B6E4E] dark:text-[#C4A77E]">
          Explore
        </div>
        <h1 className="font-heading font-extrabold tracking-tight text-[#1A1A2E] dark:text-[#EDF2EC] leading-[1.05] [font-size:clamp(1.9rem,3.5vw+0.6rem,2.75rem)]">
          Models Worth Exploring
        </h1>
        <p className="mt-2.5 max-w-[56ch] text-[15px] leading-[1.6] text-[#5A5A6E] dark:text-[#A8B0A6]">
          The frontier models we think earn a place in your stack. Filter by lab,
          skim the capability bars, and tap{" "}
          <span className="font-semibold text-[#3D3D50] dark:text-[#C8D0C6]">
            + Compare
          </span>{" "}
          on any two to put them head-to-head.
        </p>
      </header>

      <div className="max-w-[820px]">
        <ModelsDashboard models={models} />
      </div>
    </div>
  );
}
