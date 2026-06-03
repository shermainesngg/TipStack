"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FeedScroll } from "./feed-scroll";
import type { FeedPost } from "@/types";

export function FeedTabs({
  news,
  community,
  newsCursor,
  communityCursor,
}: {
  news: FeedPost[];
  community: FeedPost[];
  newsCursor: string | null;
  communityCursor: string | null;
}) {
  const [tab, setTab] = useState<"news" | "community">("news");

  return (
    <div className="lg:hidden">
      <div className="flex gap-1 p-1 rounded-full bg-[#dde4db]/60 dark:bg-[#2A322A]/60 mb-6">
        {(["news", "community"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative flex-1 text-[13px] font-heading font-semibold py-2 rounded-full transition-colors duration-150
              ${tab === t ? "text-[#1A1A2E] dark:text-[#EDF2EC]" : "text-[#5A5A6E] dark:text-[#A8B0A6]"}`}
          >
            {tab === t && (
              <motion.span
                layoutId="feed-tab-indicator"
                className="absolute inset-0 rounded-full bg-[#fafcfa] dark:bg-[#1E241E] shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 capitalize">{t}</span>
          </button>
        ))}
      </div>

      <FeedScroll
        key={tab}
        initialPosts={tab === "news" ? news : community}
        initialCursor={tab === "news" ? newsCursor : communityCursor}
        platforms={tab === "news" ? "news" : "youtube,reddit,twitter,docs,blog"}
      />
    </div>
  );
}
