import { notFound } from "next/navigation";
import Link from "next/link";
import { cacheTag, cacheLife } from "next/cache";
import { getContentBySlug } from "@/lib/supabase/queries";
import { TagPill } from "@/components/tag-pill";
import { MarkdownBody } from "@/components/markdown-body";
import { SourceAttribution } from "@/components/source-attribution";
import { ActionableSections } from "@/components/actionable-sections";
import type { Content, ContentType } from "@/types";

async function getContent(slug: string) {
  "use cache";
  cacheTag("content");
  cacheLife("hours");

  return getContentBySlug(slug);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function ContentTypeLabel({ type }: { type: ContentType }) {
  const labels: Record<ContentType, string> = {
    quick_tip: "Quick Tip",
    deep_dive: "Deep Dive",
    roundup: "Roundup",
    update: "Update",
  };
  const colors: Record<ContentType, string> = {
    quick_tip: "text-[#4E7E5E]",
    deep_dive: "text-[#5E3F96]",
    roundup: "text-[#8B6E4E]",
    update: "text-[#7B6230]",
  };

  return (
    <span
      className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${colors[type]}`}
    >
      {labels[type]}
    </span>
  );
}

function Tags({ content }: { content: Content }) {
  return (
    <div className="flex flex-wrap gap-2">
      {content.tags_tool.map((tag) => (
        <TagPill key={`tool-${tag}`} label={tag} category="tool" />
      ))}
      {content.tags_focus.map((tag) => (
        <TagPill key={`focus-${tag}`} label={tag} category="focus" />
      ))}
      {content.tags_workflow.map((tag) => (
        <TagPill key={`workflow-${tag}`} label={tag} category="workflow" />
      ))}
      {(content.tags_domain ?? []).map((tag) => (
        <TagPill key={`domain-${tag}`} label={tag} category="domain" />
      ))}
    </div>
  );
}

function Meta({ content }: { content: Content }) {
  const creator = content.source_urls?.[0]?.creator;
  const platform = content.source_urls?.[0]?.platform;
  const wasUpdated =
    content.updated_at &&
    content.created_at &&
    content.updated_at !== content.created_at &&
    new Date(content.updated_at).getTime() - new Date(content.created_at).getTime() > 60_000;

  return (
    <div className="space-y-1">
      <p className="text-[14px] text-[#9B9B8E] tracking-wide">
        {creator && (
          <>
            <span className="font-medium text-[#5A5A6E] dark:text-[#A8B0A6]">
              {creator}
            </span>
            {platform && (
              <span className="text-[#9B9B8E]">
                {" "}
                on {platform === "youtube" ? "YouTube" : "Reddit"}
              </span>
            )}
            <span className="mx-2 opacity-40">/</span>
          </>
        )}
        {formatDate(content.published_at)}
      </p>
      {wasUpdated && (
        <p className="text-[13px] text-[#8B6E4E] tracking-wide">
          Updated on {formatDate(content.updated_at)}
        </p>
      )}
    </div>
  );
}

function QuickTipLayout({ content }: { content: Content }) {
  return (
    <div className="mx-auto max-w-[600px] px-5 py-12 lg:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#9B9B8E] hover:text-[#1A1A2E] dark:hover:text-[#EDF2EC] transition-colors mb-8"
      >
        <span aria-hidden="true">&larr;</span> Back to feed
      </Link>

      <div className="flex items-center gap-3 mb-4">
        <ContentTypeLabel type="quick_tip" />
        <Tags content={content} />
      </div>

      <h1 className="font-heading font-bold tracking-tight text-[#1A1A2E] dark:text-[#EDF2EC] leading-[1.1] text-2xl">
        {content.title}
      </h1>

      <Meta content={content} />

      <div className="mt-8">
        <MarkdownBody content={content.body} />
      </div>

      <ActionableSections content={content} />

      <SourceAttribution sources={content.source_urls} />
    </div>
  );
}

function UpdateLayout({ content }: { content: Content }) {
  return (
    <div className="mx-auto max-w-[640px] px-5 py-12 lg:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#9B9B8E] hover:text-[#1A1A2E] dark:hover:text-[#EDF2EC] transition-colors mb-8"
      >
        <span aria-hidden="true">&larr;</span> Back to feed
      </Link>

      <div className="rounded-2xl bg-[#f9f5ec] dark:bg-[#2a261a] p-6 lg:p-8 mb-8">
        <div className="flex items-center gap-3 mb-3">
          <ContentTypeLabel type="update" />
          <span className="text-[12px] text-[#9B9B8E]">
            {formatDate(content.published_at)}
          </span>
        </div>
        <h1
          className="font-heading font-extrabold tracking-tight text-[#1A1A2E] dark:text-[#EDF2EC] leading-[1.08]"
          style={{ fontSize: "clamp(1.5rem, 2.5vw + 0.5rem, 2rem)" }}
        >
          {content.title}
        </h1>
        <div className="mt-3">
          <Tags content={content} />
        </div>
      </div>

      <div className="mt-6">
        <MarkdownBody content={content.body} />
      </div>

      <SourceAttribution sources={content.source_urls} />
    </div>
  );
}

function RoundupLayout({ content }: { content: Content }) {
  return (
    <div className="mx-auto max-w-[720px] px-5 py-12 lg:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#9B9B8E] hover:text-[#1A1A2E] dark:hover:text-[#EDF2EC] transition-colors mb-10"
      >
        <span aria-hidden="true">&larr;</span> Back to feed
      </Link>

      <div className="flex items-center gap-3 mb-5">
        <ContentTypeLabel type="roundup" />
        <Tags content={content} />
      </div>

      <h1
        className="font-heading font-extrabold tracking-tight text-[#1A1A2E] dark:text-[#EDF2EC] leading-[1.08] max-w-[22ch]"
        style={{ fontSize: "clamp(1.75rem, 3vw + 0.5rem, 2.5rem)" }}
      >
        {content.title}
      </h1>

      <p className="mt-3 text-[17px] leading-[1.7] text-[#5A5A6E] dark:text-[#A8B0A6] max-w-[55ch]">
        {content.summary}
      </p>

      <Meta content={content} />

      <div className="mt-12">
        <MarkdownBody content={content.body} />
      </div>

      <ActionableSections content={content} />

      <SourceAttribution sources={content.source_urls} />
    </div>
  );
}

function DeepDiveLayout({ content }: { content: Content }) {
  return (
    <div className="mx-auto max-w-[680px] px-5 py-12 lg:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#9B9B8E] hover:text-[#1A1A2E] dark:hover:text-[#EDF2EC] transition-colors mb-10"
      >
        <span aria-hidden="true">&larr;</span> Back to feed
      </Link>

      <div className="flex flex-wrap gap-2 mb-5">
        <Tags content={content} />
      </div>

      <h1
        className="font-heading font-extrabold tracking-tight text-[#1A1A2E] dark:text-[#EDF2EC] leading-[1.08] max-w-[20ch]"
        style={{ fontSize: "clamp(1.75rem, 3vw + 0.5rem, 2.5rem)" }}
      >
        {content.title}
      </h1>

      <div className="mt-4">
        <Meta content={content} />
      </div>

      <div className="mt-12">
        <MarkdownBody content={content.body} />
      </div>

      <ActionableSections content={content} />

      <SourceAttribution sources={content.source_urls} />
    </div>
  );
}

export default async function ContentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let content;
  try {
    content = await getContent(slug);
  } catch {
    notFound();
  }

  if (!content) {
    notFound();
  }

  const contentType: ContentType = content.content_type ?? "deep_dive";

  switch (contentType) {
    case "quick_tip":
      return <QuickTipLayout content={content} />;
    case "update":
      return <UpdateLayout content={content} />;
    case "roundup":
      return <RoundupLayout content={content} />;
    default:
      return <DeepDiveLayout content={content} />;
  }
}
