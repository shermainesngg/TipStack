import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface PipelineNotification {
  batchDate: string;
  itemsFetched: number;
  itemsKept: number;
  itemsDiscarded: number;
  contentPiecesCreated: number;
}

/**
 * Send an email notification to the admin when the pipeline completes.
 * Includes a summary of what was processed so the admin knows whether
 * to open Supabase Studio for review.
 */
export async function notifyPipelineComplete(
  stats: PipelineNotification
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("ADMIN_EMAIL not set — skipping pipeline notification");
    return;
  }

  const hasContent = stats.contentPiecesCreated > 0;

  const subject = hasContent
    ? `TipStack: ${stats.contentPiecesCreated} new piece${stats.contentPiecesCreated === 1 ? "" : "s"} ready for review`
    : `TipStack: Pipeline completed — no new content`;

  const body = `## Pipeline Run: ${stats.batchDate}

| Metric | Count |
|--------|-------|
| Items fetched | ${stats.itemsFetched} |
| Items kept after dedup/filter | ${stats.itemsKept} |
| Items discarded | ${stats.itemsDiscarded} |
| Content pieces created | ${stats.contentPiecesCreated} |

${
  hasContent
    ? `**Action needed:** Review pending content in [Supabase Studio](${process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.NEXT_PUBLIC_SUPABASE_URL.replace(".supabase.co", ".supabase.co/project/default/editor") : "Supabase Studio"}) → \`content\` table → filter by \`status = pending_review\`.`
    : "No new content was generated this run. This could mean all items were duplicates or below the quality threshold."
}`;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "TipStack <onboarding@resend.dev>",
    to: adminEmail,
    subject,
    html: markdownToSimpleHtml(body),
  });
}

/**
 * Minimal markdown-to-HTML for the email body.
 * Handles headings, bold, tables, links, and paragraphs.
 */
function markdownToSimpleHtml(md: string): string {
  return md
    .split("\n")
    .map((line) => {
      if (line.startsWith("## ")) return `<h2>${line.slice(3)}</h2>`;
      if (line.startsWith("**") && line.endsWith("**"))
        return `<p><strong>${line.slice(2, -2)}</strong></p>`;
      if (line.startsWith("|")) return line; // keep table rows as-is for below
      return line ? `<p>${line}</p>` : "";
    })
    .join("\n")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2">$1</a>'
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}
