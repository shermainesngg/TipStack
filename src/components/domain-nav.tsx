import Link from "next/link";
import { cacheTag, cacheLife } from "next/cache";
import { getAvailableTags } from "@/lib/supabase/queries";
import { getDomainConfig } from "@/lib/domains";

async function getDomains() {
  "use cache";
  cacheTag("content");
  cacheLife("hours");

  const tags = await getAvailableTags();
  return tags.domains;
}

export async function DomainNav() {
  let domains: string[] = [];
  try {
    domains = await getDomains();
  } catch {
    // Supabase not configured
  }

  if (domains.length === 0) return null;

  return (
    <nav
      className="flex gap-1 overflow-x-auto scrollbar-hide"
      aria-label="Browse by domain"
    >
      {domains.map((slug) => {
        const config = getDomainConfig(slug);
        return (
          <Link
            key={slug}
            href={`/domains/${slug}`}
            className="rounded-full px-3 py-1 text-[13px] font-medium whitespace-nowrap
              text-[#6E6E7E] hover:text-[#1A1A2E] hover:bg-[#dde4db]
              dark:text-[#8C9688] dark:hover:text-[#EDF2EC] dark:hover:bg-[#2A322A]
              transition-colors duration-150"
          >
            {config.label}
          </Link>
        );
      })}
    </nav>
  );
}
