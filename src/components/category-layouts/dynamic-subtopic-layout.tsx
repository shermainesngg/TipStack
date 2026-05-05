"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TagPill } from "@/components/tag-pill";
import type { Content } from "@/types";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 120, damping: 22 },
  },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function ArticleCard({ content }: { content: Content }) {
  const topTag = content.tags_tool[0];

  return (
    <Link href={`/content/${content.slug}`} className="block group">
      <motion.article
        className="rounded-2xl bg-[#faf5ee] dark:bg-[#2a2318] p-5
          group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.08)]
          transition-shadow duration-300 ease-out h-full flex flex-col"
        variants={itemVariants}
        whileHover={{ y: -3, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      >
        <h3 className="font-heading font-semibold text-[15px] leading-snug text-[#1A1A2E] dark:text-[#EDF2EC] line-clamp-2">
          {content.title}
        </h3>

        <p className="mt-2 text-[13px] leading-[1.6] text-[#5A5A6E] dark:text-[#A8B0A6] line-clamp-2">
          {content.summary}
        </p>

        <div className="mt-auto pt-3 flex items-center gap-2">
          {topTag && <TagPill label={topTag} category="tool" />}
          <span className="text-[11px] text-[#9B9B8E]">
            {formatDate(content.updated_at ?? content.published_at)}
          </span>
        </div>
      </motion.article>
    </Link>
  );
}

interface SubTopicGroup {
  name: string;
  articles: Content[];
}

function groupBySubTopic(content: Content[]): SubTopicGroup[] {
  const groups = new Map<string, Content[]>();

  for (const article of content) {
    const key = article.sub_topic ?? "General";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(article);
  }

  return Array.from(groups.entries())
    .map(([name, articles]) => ({
      name,
      articles: articles.sort((a, b) => {
        const aDate = a.updated_at ?? a.published_at ?? a.created_at;
        const bDate = b.updated_at ?? b.published_at ?? b.created_at;
        return bDate.localeCompare(aDate);
      }),
    }))
    .sort((a, b) => {
      const aLatest = a.articles[0]?.updated_at ?? a.articles[0]?.published_at ?? "";
      const bLatest = b.articles[0]?.updated_at ?? b.articles[0]?.published_at ?? "";
      return bLatest.localeCompare(aLatest);
    });
}

export function DynamicSubTopicLayout({ content }: { content: Content[] }) {
  if (content.length === 0) return null;

  const subTopics = groupBySubTopic(content);
  const hasSubTopics = subTopics.length > 1 || (subTopics.length === 1 && subTopics[0].name !== "General");

  if (!hasSubTopics) {
    return (
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {content.map((item) => (
          <ArticleCard key={item.id} content={item} />
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Sub-topic navigation */}
      <nav className="flex flex-wrap gap-2">
        {subTopics.map(({ name, articles }) => (
          <a
            key={name}
            href={`#${name.toLowerCase().replace(/\s+/g, "-")}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium
              bg-[#f0ebe3] dark:bg-[#2a2318] text-[#5A5A6E] dark:text-[#A8B0A6]
              hover:bg-[#e5ddd3] dark:hover:bg-[#3a3328] transition-colors"
          >
            {name}
            <span className="text-[11px] opacity-60">({articles.length})</span>
          </a>
        ))}
      </nav>

      {/* Sub-topic sections */}
      {subTopics.map(({ name, articles }) => (
        <section
          key={name}
          id={name.toLowerCase().replace(/\s+/g, "-")}
          className="scroll-mt-24"
        >
          <h2 className="font-heading font-bold text-[18px] text-[#1A1A2E] dark:text-[#EDF2EC] mb-4">
            {name}
          </h2>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={containerVariants}
          >
            {articles.map((article) => (
              <ArticleCard key={article.id} content={article} />
            ))}
          </motion.div>
        </section>
      ))}
    </motion.div>
  );
}
