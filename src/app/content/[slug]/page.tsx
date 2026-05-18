import { notFound, permanentRedirect } from "next/navigation";
import { cacheTag, cacheLife } from "next/cache";
import { getContentBySlug } from "@/lib/supabase/queries";
import { getArticleUrl } from "@/lib/categories";

async function getContent(slug: string) {
  "use cache";
  cacheTag("content");
  cacheLife("hours");

  return getContentBySlug(slug);
}

export default async function ContentRedirect({
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

  permanentRedirect(getArticleUrl(content.tags_category, content.slug));
}
