import { notFound } from "next/navigation";
import Link from "next/link";
import { cacheTag, cacheLife } from "next/cache";
import {
  getPublishedContentByDomain,
  getAvailableTags,
} from "@/lib/supabase/queries";
import { getDomainConfig } from "@/lib/domains";
import { AnimatedFeed } from "@/components/animated-feed";

async function getDomainContent(domain: string) {
  "use cache";
  cacheTag("content");
  cacheLife("hours");

  return getPublishedContentByDomain(domain);
}

async function getValidDomains() {
  "use cache";
  cacheTag("content");
  cacheLife("hours");

  const tags = await getAvailableTags();
  return tags.domains;
}

export default async function DomainPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;

  let content: Awaited<ReturnType<typeof getDomainContent>> = [];
  let validDomains: string[] = [];

  try {
    [content, validDomains] = await Promise.all([
      getDomainContent(domain),
      getValidDomains(),
    ]);
  } catch {
    // Supabase not configured yet
  }

  const config = getDomainConfig(domain);
  const isKnownDomain = validDomains.includes(domain);

  if (!isKnownDomain && content.length === 0) {
    notFound();
  }

  const [featured, ...rest] = content;

  return (
    <div>
      <div
        className={`${config.tint} ${config.darkTint}`}
      >
        <div className="mx-auto max-w-[1200px] px-5 pt-12 pb-8 lg:pt-20 lg:pb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#9B9B8E] hover:text-[#1A1A2E] dark:hover:text-[#EDF2EC] transition-colors mb-8"
          >
            <span aria-hidden="true">&larr;</span> All tips
          </Link>

          <h1
            className={`font-heading font-extrabold tracking-tight ${config.accent} dark:text-[#EDF2EC] leading-[1.05]`}
            style={{ fontSize: "clamp(2rem, 4vw + 1rem, 3.25rem)" }}
          >
            {config.label}
          </h1>
          <p className="mt-3 max-w-[50ch] text-[17px] leading-[1.7] text-[#5A5A6E] dark:text-[#A8B0A6]">
            {config.description}
          </p>

          <p className="mt-6 text-[14px] tracking-wide text-[#9B9B8E]">
            <span className="text-[20px] font-heading font-bold text-[#1A1A2E] dark:text-[#EDF2EC] mr-1">
              {content.length}
            </span>
            {content.length === 1 ? "tip" : "tips"}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-5 py-8">
        {content.length === 0 ? (
          <div className="py-24 text-left max-w-[40ch]">
            <p className="text-2xl font-heading font-bold text-[#1A1A2E] dark:text-[#EDF2EC]">
              No {config.label.toLowerCase()} tips yet.
            </p>
            <p className="mt-3 text-[15px] leading-[1.7] text-[#5A5A6E] dark:text-[#A8B0A6]">
              Content for this domain will appear here as the pipeline processes
              new sources.
            </p>
          </div>
        ) : (
          <AnimatedFeed featured={featured} rest={rest} />
        )}
      </div>
    </div>
  );
}
