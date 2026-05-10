"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { FeedPostCard, DateSeparator } from "./feed-post-card";
import type { FeedPost } from "@/types";

const MAX_PER_DAY = 3;

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
};

function getDateKey(dateStr: string): string {
  return new Date(dateStr).toDateString();
}

function groupByDate(posts: FeedPost[]): { date: string; posts: FeedPost[] }[] {
  const groups: { date: string; posts: FeedPost[] }[] = [];
  let currentKey = "";

  for (const post of posts) {
    const key = getDateKey(post.published_at);
    if (key !== currentKey) {
      currentKey = key;
      groups.push({ date: post.published_at, posts: [post] });
    } else {
      groups[groups.length - 1].posts.push(post);
    }
  }

  for (const group of groups) {
    group.posts.sort((a, b) => (b.priority ?? 5) - (a.priority ?? 5));
  }

  return groups;
}

export function FeedScroll({
  initialPosts,
  initialCursor,
  platforms,
}: {
  initialPosts: FeedPost[];
  initialCursor: string | null;
  platforms?: string;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;

    setLoading(true);
    try {
      let url = `/api/feed?cursor=${encodeURIComponent(cursor)}&limit=20`;
      if (platforms) url += `&platforms=${encodeURIComponent(platforms)}`;
      const res = await fetch(url);
      if (!res.ok) return;

      const data = await res.json();
      setPosts((prev) => [...prev, ...data.posts]);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, platforms]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  if (posts.length === 0) {
    return (
      <div className="py-12 text-left">
        <p className="text-lg font-heading font-bold text-[#1A1A2E] dark:text-[#EDF2EC]">
          No new updates yet.
        </p>
        <p className="mt-2 text-[14px] leading-[1.7] text-[#5A5A6E] dark:text-[#A8B0A6]">
          Check back later — the pipeline runs twice daily.
        </p>
      </div>
    );
  }

  const groups = groupByDate(posts);

  const toggleDay = (dateKey: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey);
      else next.add(dateKey);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const dateKey = getDateKey(group.date);
        const isExpanded = expandedDays.has(dateKey);
        const visiblePosts = isExpanded
          ? group.posts
          : group.posts.slice(0, MAX_PER_DAY);
        const hiddenCount = group.posts.length - MAX_PER_DAY;

        return (
          <div key={group.date}>
            <DateSeparator date={group.date} />
            <div className="space-y-4 mt-3">
              {visiblePosts.map((post, i) => (
                <motion.div
                  key={post.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: i * 0.05 }}
                >
                  <FeedPostCard post={post} />
                </motion.div>
              ))}
            </div>
            {hiddenCount > 0 && (
              <button
                onClick={() => toggleDay(dateKey)}
                className="mt-3 w-full text-center text-[13px] font-medium text-[#5A5A6E] dark:text-[#A8B0A6] hover:text-[#1A1A2E] dark:hover:text-[#EDF2EC] transition-colors py-2"
              >
                {isExpanded
                  ? "Show less"
                  : `Show ${hiddenCount} more`}
              </button>
            )}
          </div>
        );
      })}

      <div ref={sentinelRef} className="h-px" />

      {loading && (
        <div className="flex justify-center py-8">
          <div className="h-5 w-5 rounded-full border-2 border-[#dde4db] border-t-[#1A1A2E] dark:border-[#3A433A] dark:border-t-[#EDF2EC] animate-spin" />
        </div>
      )}

      {!cursor && posts.length > 0 && (
        <p className="text-center text-[13px] text-[#9B9B8E] py-6">
          You&apos;re all caught up
        </p>
      )}
    </div>
  );
}
