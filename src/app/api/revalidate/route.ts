import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { tag, secret } = body;

  if (secret !== process.env.REVALIDATION_SECRET) {
    return Response.json({ error: "Invalid secret" }, { status: 401 });
  }

  if (!tag || typeof tag !== "string") {
    return Response.json({ error: "Missing tag" }, { status: 400 });
  }

  revalidateTag(tag, "max");

  return Response.json({ revalidated: true, now: Date.now() });
}
