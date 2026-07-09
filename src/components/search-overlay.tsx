"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { getArticleUrl, getCategoryConfig } from "@/lib/categories";
import type { ContentCategory } from "@/types";

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  summary: string;
  tags_category: ContentCategory;
  sub_topic: string | null;
  tags_tool: string[];
  tags_focus: string[];
  tags_workflow: string[];
  published_at: string;
  rank: number;
  headline_title: string;
  headline_summary: string;
}

// The headline text is untrusted (derived from ingested content); Postgres
// ts_headline wraps matches in bare <mark></mark>. Escape ALL HTML, then
// re-enable only those bare mark tags — so no attacker-supplied tag or
// attribute (e.g. <mark onmouseover=...>) can survive.
function sanitizeHighlight(html: string): string {
  return html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/&lt;mark&gt;/g, "<mark>")
    .replace(/&lt;\/mark&gt;/g, "</mark>");
}

export function SearchOverlay() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchResults = useCallback(
    async (q: string, newOffset: number, append: boolean) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&limit=5&offset=${newOffset}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const data = await res.json();
        setResults((prev) => (append ? [...prev, ...data.results] : data.results));
        setHasMore(data.hasMore);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setHasMore(false);
      setOffset(0);
      return;
    }

    setOffset(0);
    const timer = setTimeout(() => {
      fetchResults(query, 0, false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, fetchResults]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          const newOffset = offset + 5;
          setOffset(newOffset);
          fetchResults(query, newOffset, true);
        }
      },
      { root: scrollRef.current, threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, offset, query, fetchResults]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleClose() {
    setIsOpen(false);
    setMobileOpen(false);
    setQuery("");
    setResults([]);
    setOffset(0);
    setHasMore(false);
  }

  const showDropdown = isOpen && query.length >= 3;

  return (
    <>
      {/* Desktop search */}
      <div ref={containerRef} className="relative ml-4 hidden sm:block">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9B9B8E]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder="Search articles..."
            className="w-[200px] focus:w-[280px] transition-all duration-200 rounded-full bg-[#dde4db]/60 dark:bg-[#2A322A]/60 pl-9 pr-3 py-1.5 text-[14px] font-sans text-[#1A1A2E] dark:text-[#EDF2EC] placeholder:text-[#9B9B8E] focus:outline-none focus:ring-2 focus:ring-[#1A1A2E]/20 dark:focus:ring-[#EDF2EC]/20"
          />
        </div>

        {showDropdown && (
          <div
            ref={scrollRef}
            className="absolute top-full mt-2 left-0 w-[380px] max-h-[400px] overflow-y-auto rounded-2xl bg-[#fafcfa] dark:bg-[#1E241E] shadow-[0_4px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] z-50"
          >
            <ResultsList
              results={results}
              isLoading={isLoading}
              query={query}
              hasMore={hasMore}
              sentinelRef={sentinelRef}
              onSelect={handleClose}
            />
          </div>
        )}
      </div>

      {/* Mobile search icon */}
      <button
        onClick={() => {
          setMobileOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 100);
        }}
        className="sm:hidden ml-3 p-2 rounded-full text-[#5A5A6E] hover:text-[#1A1A2E] hover:bg-[#dde4db] dark:text-[#A8B0A6] dark:hover:text-[#EDF2EC] dark:hover:bg-[#2A322A] transition-colors"
        aria-label="Search"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </button>

      {/* Mobile fullscreen overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-[#EDF2EC] dark:bg-[#161B16] sm:hidden">
          <div className="flex items-center gap-3 px-4 h-16">
            <svg className="h-5 w-5 shrink-0 text-[#9B9B8E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              ref={mobileInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles..."
              className="flex-1 bg-transparent text-[16px] font-sans text-[#1A1A2E] dark:text-[#EDF2EC] placeholder:text-[#9B9B8E] focus:outline-none"
            />
            <button
              onClick={handleClose}
              className="shrink-0 p-2 rounded-full text-[#5A5A6E] hover:text-[#1A1A2E] dark:text-[#A8B0A6] dark:hover:text-[#EDF2EC]"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="overflow-y-auto px-4" style={{ height: "calc(100vh - 4rem)" }}>
            {query.length >= 3 && (
              <ResultsList
                results={results}
                isLoading={isLoading}
                query={query}
                hasMore={hasMore}
                sentinelRef={sentinelRef}
                onSelect={handleClose}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ResultsList({
  results,
  isLoading,
  query,
  hasMore,
  sentinelRef,
  onSelect,
}: {
  results: SearchResult[];
  isLoading: boolean;
  query: string;
  hasMore: boolean;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  onSelect: () => void;
}) {
  if (results.length === 0 && !isLoading) {
    return (
      <div className="px-5 py-8 text-center">
        <p className="text-[14px] text-[#5A5A6E] dark:text-[#A8B0A6]">
          No articles found for &ldquo;{query}&rdquo;
        </p>
      </div>
    );
  }

  return (
    <div className="py-2">
      {results.map((result) => (
        <SearchResultItem key={result.id} result={result} onSelect={onSelect} />
      ))}
      {hasMore && <div ref={sentinelRef} className="h-1" />}
      {isLoading && (
        <div className="flex justify-center py-3">
          <div className="h-5 w-5 rounded-full border-2 border-[#dde4db] border-t-[#5A5A6E] animate-spin dark:border-[#3A433A] dark:border-t-[#A8B0A6]" />
        </div>
      )}
    </div>
  );
}

function SearchResultItem({
  result,
  onSelect,
}: {
  result: SearchResult;
  onSelect: () => void;
}) {
  const config = getCategoryConfig(result.tags_category);
  const href = getArticleUrl(result.tags_category, result.slug);

  return (
    <Link
      href={href}
      onClick={onSelect}
      className="block px-4 py-3 hover:bg-[#dde4db]/50 dark:hover:bg-[#2A322A]/50 transition-colors duration-150"
    >
      <div className="flex items-center gap-2 mb-1">
        {config && (
          <span
            className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-md tracking-wide ${config.tint} ${config.darkTint} ${config.accent}`}
          >
            {config.label}
          </span>
        )}
        {result.sub_topic && (
          <span className="text-[11px] text-[#9B9B8E] tracking-wide">
            {result.sub_topic}
          </span>
        )}
      </div>
      <h4
        className="text-[14px] font-heading font-semibold leading-snug text-[#1A1A2E] dark:text-[#EDF2EC] line-clamp-1 [&_mark]:bg-[#f0e8d4] [&_mark]:text-[#1A1A2E] dark:[&_mark]:bg-[#2E2818] dark:[&_mark]:text-[#EDF2EC] [&_mark]:rounded-sm [&_mark]:px-0.5"
        dangerouslySetInnerHTML={{ __html: sanitizeHighlight(result.headline_title) }}
      />
      <p
        className="mt-0.5 text-[13px] leading-[1.5] text-[#5A5A6E] dark:text-[#A8B0A6] line-clamp-2 [&_mark]:bg-[#f0e8d4] [&_mark]:text-[#5A5A6E] dark:[&_mark]:bg-[#2E2818] dark:[&_mark]:text-[#A8B0A6] [&_mark]:rounded-sm [&_mark]:px-0.5"
        dangerouslySetInnerHTML={{ __html: sanitizeHighlight(result.headline_summary) }}
      />
    </Link>
  );
}
