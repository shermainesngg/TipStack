"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  Shield,
  Sparkles,
  MessageSquareCode,
  Workflow,
  Blocks,
  Bug,
  ChevronRight,
  X,
  Zap,
} from "lucide-react";
import { toUrlSlug, type CategoryConfig } from "@/lib/categories";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Terminal,
  Shield,
  Sparkles,
  MessageSquareCode,
  Workflow,
  Blocks,
  Bug,
};

function CategoryItem({
  config,
  isActive,
  onClick,
}: {
  config: CategoryConfig;
  isActive: boolean;
  onClick?: () => void;
}) {
  const Icon = ICON_MAP[config.icon];

  return (
    <Link
      href={`/categories/${toUrlSlug(config.slug)}`}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-all duration-150
        ${
          isActive
            ? "bg-[#dde4db] font-semibold text-[#1A1A2E] dark:bg-[#2A322A] dark:text-[#EDF2EC]"
            : "text-[#5A5A6E] hover:bg-[#dde4db]/50 hover:text-[#1A1A2E] dark:text-[#A8B0A6] dark:hover:bg-[#2A322A]/50 dark:hover:text-[#EDF2EC]"
        }`}
    >
      {Icon && (
        <Icon
          className={`size-4 flex-shrink-0 ${isActive ? "opacity-100" : "opacity-60"}`}
        />
      )}
      <span className="flex-1">{config.label}</span>
      <ChevronRight
        className={`size-3.5 opacity-0 transition-opacity ${isActive ? "opacity-40" : "group-hover:opacity-30"}`}
      />
    </Link>
  );
}

export function CategorySidebar({
  categories,
}: {
  categories: CategoryConfig[];
}) {
  const pathname = usePathname();

  return (
    <nav className="hidden lg:block w-[220px] flex-shrink-0" aria-label="Topics">
      <div className="sticky top-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9B9B8E] mb-3 px-3">
          Topics
        </p>
        <div className="space-y-0.5">
          {categories.map((config) => (
            <CategoryItem
              key={config.slug}
              config={config}
              isActive={pathname === `/categories/${toUrlSlug(config.slug)}`}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}

export function MobileTopicDrawer({
  categories,
}: {
  categories: CategoryConfig[];
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium
          text-[#5A5A6E] hover:text-[#1A1A2E] hover:bg-[#dde4db]
          dark:text-[#A8B0A6] dark:hover:text-[#EDF2EC] dark:hover:bg-[#2A322A]
          transition-colors duration-150"
        aria-label="Browse topics"
      >
        <Blocks className="size-3.5 opacity-70" />
        Browse
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] lg:hidden"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 lg:hidden
                max-h-[75vh] rounded-t-2xl
                bg-[#EDF2EC] dark:bg-[#1E241E]
                shadow-[0_-4px_32px_rgba(0,0,0,0.12)]
                overflow-y-auto overscroll-contain"
            >
              <div className="sticky top-0 flex items-center justify-between px-5 pt-4 pb-2 bg-[#EDF2EC] dark:bg-[#1E241E]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9B9B8E]">
                  Navigate
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-[#dde4db] dark:hover:bg-[#2A322A] transition-colors"
                  aria-label="Close"
                >
                  <X className="size-4 text-[#5A5A6E] dark:text-[#A8B0A6]" />
                </button>
              </div>

              <div className="px-3 pt-1 pb-4 space-y-0.5">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-all duration-150
                    ${pathname === "/" ? "bg-[#dde4db] font-semibold text-[#1A1A2E] dark:bg-[#2A322A] dark:text-[#EDF2EC]" : "text-[#5A5A6E] hover:bg-[#dde4db]/50 hover:text-[#1A1A2E] dark:text-[#A8B0A6] dark:hover:bg-[#2A322A]/50 dark:hover:text-[#EDF2EC]"}`}
                >
                  <Zap className="size-4 flex-shrink-0 opacity-60" />
                  What&apos;s New
                </Link>
              </div>

              <div className="mx-5 h-px bg-[#dde4db] dark:bg-[#3A433A]" />

              <div className="px-3 pt-3 pb-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9B9B8E] px-3 mb-2">
                  Topics
                </p>
              </div>

              <div className="px-3 pb-8 space-y-0.5">
                {categories.map((config) => (
                  <CategoryItem
                    key={config.slug}
                    config={config}
                    isActive={pathname === `/categories/${toUrlSlug(config.slug)}`}
                    onClick={() => setOpen(false)}
                  />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
