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
    <div className="mx-auto max-w-[700px] px-5 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm font-medium text-[#7C8590] hover:text-[#1A1A2E] dark:hover:text-[#EDF2EC] mb-8"
      >
        <span aria-hidden="true">&larr;</span> Back to feed
      </Link>

      <div className="flex flex-wrap gap-2 mb-4">
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

      <h1 className="text-4xl font-extrabold tracking-tight font-heading text-[#1A1A2E] dark:text-[#EDF2EC]">
        {content.title}
      </h1>

      <p className="mt-3 text-sm text-[#7C8590]">
        {creator && (
          <>
            Source: @{creator}
            {platform && ` on ${platform === "youtube" ? "YouTube" : "Reddit"}`}
            <span className="mx-1.5">&middot;</span>
          </>
        )}
        {formatDate(content.published_at)}
      </p>

      <div className="mt-10">
        <MarkdownBody content={content.body} />
      </div>

      <SourceAttribution sources={content.source_urls} />
    </div>
  );
}
