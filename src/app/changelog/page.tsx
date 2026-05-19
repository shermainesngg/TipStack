import { cacheTag, cacheLife } from "next/cache";
import type { Metadata } from "next";
import { getChangelogEntries } from "@/lib/supabase/queries";
import { ChangelogTimeline } from "@/components/changelog-filter";

export const metadata: Metadata = {
  title: "Changelog Radar — TipStack",
  description:
    "Track Anthropic releases and AI tool changes — each update categorized by type.",
};

async function getCachedEntries() {
  "use cache";
  cacheTag("changelog");
  cacheLife("hours");

  return getChangelogEntries();
}

export default async function ChangelogPage() {
  const entries = await getCachedEntries();

  return (
    <div className="py-10 max-w-[760px]">
      <h1
        className="font-heading font-extrabold text-[#1A1A2E] dark:text-[#EDF2EC] leading-[1.05] mb-3"
        style={{ fontSize: "clamp(2rem, 4vw + 1rem, 3.25rem)" }}
      >
        Changelog Radar
      </h1>
      <p className="text-[16.5px] text-[#5A5A6E] dark:text-[#A8B0A6] leading-relaxed mb-8 max-w-[55ch]">
        Anthropic releases and AI tool changes — every update categorized so you
        can filter by what matters.
      </p>

      {entries.length === 0 ? (
        <p className="text-[#9B9B8E] text-[15px] py-12">
          No changelog entries yet. Run the changelog fetcher to populate this
          page.
        </p>
      ) : (
        <ChangelogTimeline entries={entries} />
      )}
    </div>
  );
}
