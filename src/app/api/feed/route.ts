import type { NextRequest } from "next/server";
import { getFeedPosts } from "@/lib/supabase/queries";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

  const posts = await getFeedPosts(cursor, limit);

  return Response.json({
    posts,
    nextCursor: posts.length === limit ? posts[posts.length - 1].published_at : null,
  });
}
