"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Star, ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";
import type { Skill } from "@/types";

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 120, damping: 22 },
  },
};

function formatStars(stars: number): string {
  if (stars >= 1000) return `${(stars / 1000).toFixed(1)}k`;
  return String(stars);
}

export function SkillCard({ skill }: { skill: Skill }) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!skill.install_command) return;
    navigator.clipboard.writeText(skill.install_command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const hasDetails = skill.use_case || skill.readme_excerpt || skill.install_command;

  return (
    <motion.div
      className="relative"
      variants={itemVariants}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setCopied(false);
      }}
    >
      <motion.article
        className="rounded-2xl bg-[#f3eff8] dark:bg-[#221e2e] p-5 h-full flex flex-col
          transition-shadow duration-300 ease-out"
        animate={
          hovered
            ? {
                y: -3,
                boxShadow:
                  "0 2px 8px rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.08)",
              }
            : { y: 0, boxShadow: "0 0 0 rgba(0,0,0,0)" }
        }
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5E3F96] dark:text-[#B89DD4]">
            {skill.author}
          </span>
          <div className="flex items-center gap-1 text-[12px] text-[#9B9B8E]">
            <Star className="size-3 fill-current" />
            <span>{formatStars(skill.stars)}</span>
          </div>
        </div>

        <h3 className="font-heading font-semibold text-[15px] leading-snug text-[#1A1A2E] dark:text-[#EDF2EC] line-clamp-2 title-clamp" title={skill.name}>
          {skill.name}
        </h3>

        {(skill.summary || skill.description) && (
          <p className="mt-2 text-[13px] leading-[1.6] text-[#5A5A6E] dark:text-[#A8B0A6] line-clamp-2">
            {skill.summary ?? skill.description}
          </p>
        )}

        <div className="mt-auto pt-3">
          <a
            href={skill.repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#6B47A8] dark:text-[#C5B3E6] hover:underline underline-offset-2"
          >
            View on GitHub
            <ExternalLink className="size-3" />
          </a>
        </div>
      </motion.article>

      <AnimatePresence>
        {hovered && hasDetails && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute left-full top-0 z-20 ml-2 w-80 max-h-[75vh] overflow-y-auto rounded-2xl
              bg-[#fafcfa] dark:bg-[#1E241E]
              shadow-[0_4px_12px_rgba(0,0,0,0.08),0_16px_40px_rgba(0,0,0,0.12)]
              dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)]
              p-5 space-y-3"
          >
            {skill.skill_subcategory && (
              <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[#E8E0F0] dark:bg-[#2E2840] text-[#6B47A8] dark:text-[#C5B3E6]">
                {skill.skill_subcategory}
              </span>
            )}

            {(skill.use_case || skill.readme_excerpt) && (
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9B9B8E] mb-1 block">
                  Use Case
                </span>
                <p className="text-[13px] leading-[1.6] text-[#3D3D50] dark:text-[#C8D0C6]">
                  {skill.use_case ?? skill.readme_excerpt}
                </p>
              </div>
            )}

            {skill.install_command && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 w-full rounded-xl bg-[#EDF2EC] dark:bg-[#161B16] px-3 py-2 text-left group/copy"
              >
                <code className="text-[12px] font-mono text-[#3D3D50] dark:text-[#C8D0C6] truncate flex-1">
                  {skill.install_command}
                </code>
                {copied ? (
                  <Check className="size-3.5 text-[#2D6040] shrink-0" />
                ) : (
                  <Copy className="size-3.5 text-[#9B9B8E] group-hover/copy:text-[#5E3F96] shrink-0 transition-colors" />
                )}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
