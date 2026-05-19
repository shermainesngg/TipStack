"use client";

import { useState } from "react";

const OG_BASE = "/api/og/daily";

export function DailyDigestCard({ date }: { date?: string }) {
  const [copied, setCopied] = useState(false);

  const dateQuery = date ? `&date=${date}` : "";
  const displayUrl = `${OG_BASE}?format=social${dateQuery}`;
  const ogUrl = `${OG_BASE}?format=og${dateQuery}`;
  const socialUrl = `${OG_BASE}?format=social${dateQuery}`;

  async function handleDownload(format: "og" | "social") {
    const url = format === "social" ? socialUrl : ogUrl;
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tipstack-daily-${format}${date ? `-${date}` : ""}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleCopyLink() {
    const fullUrl = `${window.location.origin}${socialUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mb-4">
      <div className="rounded-xl overflow-hidden border border-[#dde4db] dark:border-[#2A322A] shadow-sm max-w-[540px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayUrl}
          alt="TipStack Daily — AI tool updates infographic"
          className="w-full h-auto"
        />
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => handleDownload("social")}
          className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium bg-[#1A1A2E] text-[#fafcfa] hover:bg-[#2A2A3E] dark:bg-[#EDF2EC] dark:text-[#1A1A2E] dark:hover:bg-[#d8ddd6] transition-colors"
        >
          Download 1:1
        </button>
        <button
          onClick={() => handleDownload("og")}
          className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium bg-[#1A1A2E] text-[#fafcfa] hover:bg-[#2A2A3E] dark:bg-[#EDF2EC] dark:text-[#1A1A2E] dark:hover:bg-[#d8ddd6] transition-colors"
        >
          Download 16:9
        </button>
        <button
          onClick={handleCopyLink}
          className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-[#5A5A6E] hover:text-[#1A1A2E] hover:bg-[#dde4db] dark:text-[#A8B0A6] dark:hover:text-[#EDF2EC] dark:hover:bg-[#2A322A] transition-colors"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
