import { notFound } from "next/navigation";
import Link from "next/link";
import { cacheTag, cacheLife } from "next/cache";
import { getContentBySlug } from "@/lib/supabase/queries";
import { TagPill } from "@/components/tag-pill";
import { MarkdownBody } from "@/components/markdown-body";
import { SourceAttribution } from "@/components/source-attribution";

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

  const creator = content.source_urls?.[0]?.creator;
  const platform = content.source_urls?.[0]?.platform;

  return (
    <div className="mx-auto max-w-[680px] px-5 py-12 lg:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#9B9B8E] hover:text-[#1A1A2E] dark:hover:text-[#EDF2EC] transition-colors mb-10"
      >
        <span aria-hidden="true">&larr;</span> Back to feed
      </Link>

      <div className="flex flex-wrap gap-2 mb-5">
        {content.tags_tool.map((tag) => (
          <TagPill key={`tool-${tag}`} label={tag} category="tool" />
        ))}
        {content.tags_focus.map((tag) => (
          <TagPill key={`focus-${tag}`} label={tag} category="focus" />
        ))}
        {content.tags_workflow.map((tag) => (
          <TagPill key={`workflow-${tag}`} label={tag} category="workflow" />
        ))}
      </div>

      <h1
        className="font-heading font-extrabold tracking-tight text-[#1A1A2E] dark:text-[#EDF2EC] leading-[1.08] max-w-[20ch]"
        style={{ fontSize: "clamp(1.75rem, 3vw + 0.5rem, 2.5rem)" }}
      >
        {content.title}
      </h1>

      <p className="mt-4 text-[14px] text-[#9B9B8E] tracking-wide">
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

      <div className="mt-12">
        <MarkdownBody content={content.body} />
      </div>

      <SourceAttribution sources={content.source_urls} />
    </div>
  );
}
