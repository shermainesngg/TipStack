import { YoutubeTranscript } from "youtube-transcript";
import { YOUTUBE_CHANNELS, YOUTUBE_VIDEOS_PER_CHANNEL } from "./config";
import { isUrlProcessed } from "@/lib/supabase/queries";
import type { FetchedItem } from "@/types";

interface VideoEntry {
  videoId: string;
  title: string;
  url: string;
}

/**
 * Discover recent videos from a YouTube channel using its RSS feed.
 * The RSS feed is publicly available and doesn't require an API key.
 */
async function getRecentVideos(
  channelId: string,
  limit: number
): Promise<VideoEntry[]> {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const res = await fetch(feedUrl);

  if (!res.ok) {
    throw new Error(
      `Failed to fetch YouTube RSS for channel ${channelId}: ${res.status}`
    );
  }

  const xml = await res.text();

  // Parse entries from Atom XML feed
  const entries: VideoEntry[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null && entries.length < limit) {
    const entry = match[1];

    const videoIdMatch = entry.match(
      /<yt:videoId>([\s\S]*?)<\/yt:videoId>/
    );
    const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);

    if (videoIdMatch && titleMatch) {
      const videoId = videoIdMatch[1].trim();
      entries.push({
        videoId,
        title: titleMatch[1].trim(),
        url: `https://www.youtube.com/watch?v=${videoId}`,
      });
    }
  }

  return entries;
}

/**
 * Fetch the transcript for a single YouTube video.
 * Returns the full transcript text, or null if unavailable.
 */
async function getTranscript(videoId: string): Promise<string | null> {
  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: "en",
    });
    return segments.map((s) => s.text).join(" ");
  } catch {
    // Transcript unavailable (disabled, private, etc.)
    return null;
  }
}

/**
 * Fetch all new (unprocessed) YouTube videos across configured channels.
 * Returns items ready for Claude extraction.
 */
export async function fetchYouTubeItems(): Promise<FetchedItem[]> {
  const items: FetchedItem[] = [];

  for (const channel of YOUTUBE_CHANNELS) {
    const videos = await getRecentVideos(
      channel.channelId,
      YOUTUBE_VIDEOS_PER_CHANNEL
    );

    for (const video of videos) {
      // Skip already-processed URLs
      if (await isUrlProcessed(video.url)) continue;

      const transcript = await getTranscript(video.videoId);
      if (!transcript) continue;

      items.push({
        url: video.url,
        platform: "youtube",
        content: transcript,
        creator: channel.name,
        title: video.title,
      });
    }
  }

  return items;
}
