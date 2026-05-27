import type { NextRequest } from "next/server";
import { searchContent } from "@/lib/supabase/queries";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? 5), 20);
  const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);

  if (q.length < 3) {
    return Response.json({ results: [], hasMore: false });
  }

  const results = await searchContent(q, limit + 1, offset);
  const hasMore = results.length > limit;

  return Response.json({
    results: hasMore ? results.slice(0, limit) : results,
    hasMore,
  });
}
