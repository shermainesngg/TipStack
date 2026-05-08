import type { NextRequest } from "next/server";
import { getFeedPosts } from "@/lib/supabase/queries";
import type { Platform } from "@/types";

const VALID_PLATFORMS = new Set<Platform>(["youtube", "reddit", "twitter", "news", "docs"]);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

  const platformsParam = searchParams.get("platforms");
  let platforms: Platform[] | undefined;
  if (platformsParam) {
    platforms = platformsParam
      .split(",")
      .filter((p): p is Platform => VALID_PLATFORMS.has(p as Platform));
    if (platforms.length === 0) platforms = undefined;
  }

  const posts = await getFeedPosts(cursor, limit, platforms);

  return Response.json({
    posts,
    nextCursor: posts.length === limit ? posts[posts.length - 1].published_at : null,
  });
}
