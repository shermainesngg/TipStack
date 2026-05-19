"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { TagPill } from "@/components/tag-pill";
import { SkillCard } from "@/components/skill-card";
import { getSkillTypeConfig, getAllSkillTypeConfigs } from "@/lib/skill-types";
import { getArticleUrl } from "@/lib/categories";
import type { Content, Skill } from "@/types";

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

function ContentCard({ content }: { content: Content }) {
  const topTags = content.tags_tool
    .slice(0, 2)
    .map((t) => ({ label: t, category: "tool" as const }));

  return (
    <Link href={getArticleUrl(content.tags_category, content.slug)} className="block group">
      <motion.article
        className="rounded-2xl bg-[#f3eff8] dark:bg-[#221e2e] p-5 h-full flex flex-col
          group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.08)]
          transition-shadow duration-300 ease-out"
        variants={itemVariants}
        whileHover={{ y: -3, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="size-3 text-[#5E3F96]" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#5E3F96] dark:text-[#B89DD4]">
            Article
          </span>
        </div>

        <h3 className="font-heading font-semibold text-[15px] leading-snug text-[#1A1A2E] dark:text-[#EDF2EC] line-clamp-2 title-clamp" title={content.title}>
          {content.title}
        </h3>

        <p className="mt-2 text-[13px] leading-[1.6] text-[#5A5A6E] dark:text-[#A8B0A6] line-clamp-2">
          {content.summary}
        </p>

        <div className="mt-auto pt-3 flex flex-wrap items-center gap-2">
          {topTags.map((tag) => (
            <TagPill key={tag.label} label={tag.label} category={tag.category} />
          ))}
          <span className="text-[11px] text-[#9B9B8E]">
            {formatDate(content.published_at)}
          </span>
        </div>
      </motion.article>
    </Link>
  );
}

function groupBySubcategory(skills: Skill[]): [string | null, Skill[]][] {
  const groups = new Map<string | null, Skill[]>();
  for (const skill of skills) {
    const key = skill.skill_subcategory;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(skill);
  }
  const entries = [...groups.entries()];
  entries.sort((a, b) => {
    if (a[0] === null) return 1;
    if (b[0] === null) return -1;
    return a[0].localeCompare(b[0]);
  });
  return entries;
}

function SkillTypeSection({
  skillType,
  skills,
}: {
  skillType: string;
  skills: Skill[];
}) {
  const config = getSkillTypeConfig(skillType);
  if (!config || skills.length === 0) return null;

  const subcategories = groupBySubcategory(skills);

  return (
    <motion.section className="space-y-4" variants={itemVariants}>
      <div>
        <h2 className="font-heading font-bold text-[18px] text-[#1A1A2E] dark:text-[#EDF2EC]">
          {config.label}
        </h2>
        <p className="text-[13px] text-[#5A5A6E] dark:text-[#A8B0A6] mt-1">
          {config.description}
        </p>
      </div>
      {subcategories.map(([subcategory, groupSkills]) => (
        <div key={subcategory ?? "_ungrouped"} className="space-y-3">
          {subcategory && (
            <h3 className="text-[14px] font-semibold text-[#3D3D50] dark:text-[#C8D0C6] pl-0.5">
              {subcategory}
            </h3>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupSkills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        </div>
      ))}
    </motion.section>
  );
}

export function GithubSkillsLayout({
  content,
  skillsByType,
}: {
  content: Content[];
  skillsByType?: Record<string, Skill[]>;
}) {
  const hasSkills = skillsByType && Object.keys(skillsByType).length > 0;
  const allTypeConfigs = getAllSkillTypeConfigs();
  const activeTypes = hasSkills
    ? allTypeConfigs.filter((t) => (skillsByType[t.slug]?.length ?? 0) > 0)
    : [];

  const totalSkills = hasSkills
    ? Object.values(skillsByType).reduce((sum, arr) => sum + arr.length, 0)
    : 0;

  const [activeTab, setActiveTab] = useState<string | null>(null);

  const filteredTypes = activeTab
    ? activeTypes.filter((t) => t.slug === activeTab)
    : activeTypes;

  return (
    <motion.div
      className="space-y-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {hasSkills && (
        <>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="text-[13px] text-[#9B9B8E]">
              {totalSkills} skill{totalSkills !== 1 ? "s" : ""} discovered
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveTab(null)}
                className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors ${
                  activeTab === null
                    ? "bg-[#1A1A2E] text-[#fafcfa] dark:bg-[#EDF2EC] dark:text-[#1A1A2E]"
                    : "bg-[#dde4db] text-[#5A5A6E] dark:bg-[#2A322A] dark:text-[#A8B0A6] hover:bg-[#d0d8ce]"
                }`}
              >
                All
              </button>
              {activeTypes.map((type) => (
                <button
                  key={type.slug}
                  onClick={() =>
                    setActiveTab(activeTab === type.slug ? null : type.slug)
                  }
                  className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors ${
                    activeTab === type.slug
                      ? "bg-[#1A1A2E] text-[#fafcfa] dark:bg-[#EDF2EC] dark:text-[#1A1A2E]"
                      : "bg-[#dde4db] text-[#5A5A6E] dark:bg-[#2A322A] dark:text-[#A8B0A6] hover:bg-[#d0d8ce]"
                  }`}
                >
                  {type.label}
                  <span className="ml-1 opacity-60">
                    {skillsByType[type.slug]?.length ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {filteredTypes.map((type) => (
            <SkillTypeSection
              key={type.slug}
              skillType={type.slug}
              skills={skillsByType[type.slug] ?? []}
            />
          ))}
        </>
      )}

      {content.length > 0 && (
        <motion.section className="space-y-4" variants={itemVariants}>
          {hasSkills && (
            <h2 className="font-heading font-bold text-[18px] text-[#1A1A2E] dark:text-[#EDF2EC]">
              Related Articles
            </h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.map((item) => (
              <ContentCard key={item.id} content={item} />
            ))}
          </div>
        </motion.section>
      )}

      {!hasSkills && content.length === 0 && null}
    </motion.div>
  );
}
