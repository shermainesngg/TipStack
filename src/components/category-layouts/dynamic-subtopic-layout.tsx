"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TagPill } from "@/components/tag-pill";
import { getCategoryConfig, getArticleUrl } from "@/lib/categories";
import type { Content, ContentType } from "@/types";

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

const CONTENT_TYPE_LABELS: Record<ContentType, { label: string; color: string; darkColor: string }> = {
  quick_tip: { label: "Quick Tip", color: "text-[#2D6040]", darkColor: "dark:text-[#7EBE8E]" },
  deep_dive: { label: "Deep Dive", color: "text-[#5E3F96]", darkColor: "dark:text-[#B89DD4]" },
  roundup: { label: "Roundup", color: "text-[#7B6230]", darkColor: "dark:text-[#D4B875]" },
  update: { label: "Update", color: "text-[#8B4A4A]", darkColor: "dark:text-[#E5A097]" },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function isNew(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const published = new Date(dateStr);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return published > sevenDaysAgo;
}

function FeaturedArticleCard({ content, tint, darkTint }: { content: Content; tint: string; darkTint: string }) {
  const topToolTag = content.tags_tool[0];
  const topFocusTag = content.tags_focus[0];
  const typeInfo = CONTENT_TYPE_LABELS[content.content_type];
  const sourceCount = content.source_urls?.length ?? 0;
  const fresh = isNew(content.published_at);

  return (
    <Link href={getArticleUrl(content.tags_category, content.slug)} className="block group md:col-span-2">
      <motion.article
        className="rounded-2xl bg-[#fafcfa] dark:bg-[#1E241E] p-6 lg:p-8
          shadow-[0_1px_3px_rgba(0,0,0,0.04)]
          group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.1)]
          transition-shadow duration-300 ease-out h-full flex flex-col"
        variants={itemVariants}
        whileHover={{ y: -3, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      >
        <div className="flex items-center gap-2 mb-3">
          {typeInfo && (
            <span className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${typeInfo.color} ${typeInfo.darkColor}`}>
              {typeInfo.label}
            </span>
          )}
          {fresh && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8B6E4E] dark:text-[#D4B875]">
              New
            </span>
          )}
        </div>

        <h3 className="font-heading font-bold text-lg leading-snug text-[#1A1A2E] dark:text-[#EDF2EC] line-clamp-2">
          {content.title}
        </h3>

        <p className="mt-2 text-[14px] leading-[1.7] text-[#5A5A6E] dark:text-[#A8B0A6] line-clamp-3">
          {content.summary}
        </p>

        <div className="mt-auto pt-4 flex items-center gap-2 flex-wrap">
          {topToolTag && <TagPill label={topToolTag} category="tool" />}
          {topFocusTag && <TagPill label={topFocusTag} category="focus" />}
          <span className="text-[11px] text-[#9B9B8E] ml-auto flex items-center gap-3">
            {sourceCount > 1 && <span>{sourceCount} sources</span>}
            {formatDate(content.updated_at ?? content.published_at)}
          </span>
        </div>
      </motion.article>
    </Link>
  );
}

function ArticleCard({ content, tint, darkTint }: { content: Content; tint: string; darkTint: string }) {
  const topToolTag = content.tags_tool[0];
  const topFocusTag = content.tags_focus[0];
  const typeInfo = CONTENT_TYPE_LABELS[content.content_type];
  const sourceCount = content.source_urls?.length ?? 0;
  const fresh = isNew(content.published_at);

  return (
    <Link href={getArticleUrl(content.tags_category, content.slug)} className="block group">
      <motion.article
        className={`rounded-2xl ${tint} ${darkTint} p-5
          group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.08)]
          transition-shadow duration-300 ease-out h-full flex flex-col`}
        variants={itemVariants}
        whileHover={{ y: -3, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          {typeInfo && (
            <span className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${typeInfo.color} ${typeInfo.darkColor}`}>
              {typeInfo.label}
            </span>
          )}
          {fresh && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8B6E4E] dark:text-[#D4B875]">
              New
            </span>
          )}
        </div>

        <h3 className="font-heading font-semibold text-[15px] leading-snug text-[#1A1A2E] dark:text-[#EDF2EC] line-clamp-2">
          {content.title}
        </h3>

        <p className="mt-2 text-[13px] leading-[1.6] text-[#5A5A6E] dark:text-[#A8B0A6] line-clamp-2">
          {content.summary}
        </p>

        <div className="mt-auto pt-3 flex items-center gap-2 flex-wrap">
          {topToolTag && <TagPill label={topToolTag} category="tool" />}
          {topFocusTag && !topToolTag && <TagPill label={topFocusTag} category="focus" />}
          <span className="text-[11px] text-[#9B9B8E] ml-auto flex items-center gap-3">
            {sourceCount > 1 && <span>{sourceCount} sources</span>}
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

const MIN_GROUP_SIZE = 2;

function groupBySubTopic(content: Content[]): SubTopicGroup[] {
  const groups = new Map<string, Content[]>();

  for (const article of content) {
    const key = article.sub_topic ?? "General";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(article);
  }

  const sorted = Array.from(groups.entries())
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

  const big: SubTopicGroup[] = [];
  const overflow: Content[] = [];
  for (const group of sorted) {
    if (group.articles.length >= MIN_GROUP_SIZE) {
      big.push(group);
    } else {
      overflow.push(...group.articles);
    }
  }
  if (overflow.length > 0) {
    big.push({ name: "More Topics", articles: overflow });
  }
  return big;
}

export function DynamicSubTopicLayout({ content }: { content: Content[]; skillsByType?: Record<string, unknown> }) {
  if (content.length === 0) return null;

  const category = content[0].tags_category;
  const config = getCategoryConfig(category);
  const tint = config?.tint ?? "bg-[#faf5ee]";
  const darkTint = config?.darkTint ?? "dark:bg-[#2a2318]";

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
        {content.map((item, i) =>
          i === 0 ? (
            <FeaturedArticleCard key={item.id} content={item} tint={tint} darkTint={darkTint} />
          ) : (
            <ArticleCard key={item.id} content={item} tint={tint} darkTint={darkTint} />
          )
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-12"
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
          <h2 className="font-heading font-bold text-[18px] text-[#1A1A2E] dark:text-[#EDF2EC] mb-5">
            {name}
          </h2>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={containerVariants}
          >
            {articles.map((article, i) =>
              i === 0 && articles.length >= 3 ? (
                <FeaturedArticleCard key={article.id} content={article} tint={tint} darkTint={darkTint} />
              ) : (
                <ArticleCard key={article.id} content={article} tint={tint} darkTint={darkTint} />
              )
            )}
          </motion.div>
        </section>
      ))}
    </motion.div>
  );
}
