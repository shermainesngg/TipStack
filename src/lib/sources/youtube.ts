import { YoutubeTranscript } from "youtube-transcript";
import { YOUTUBE_CHANNELS } from "./config";
import { isUrlProcessed } from "@/lib/supabase/queries";
import type { FetchedItem } from "@/types";

interface VideoEntry {
  videoId: string;
  title: string;
  url: string;
  published: Date;
}

function getYesterday(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

async function getVideosPublishedYesterday(
  channelId: string
): Promise<VideoEntry[]> {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const res = await fetch(feedUrl);

  if (!res.ok) {
    throw new Error(
      `Failed to fetch YouTube RSS for channel ${channelId}: ${res.status}`
    );
  }

  const xml = await res.text();
  const { start, end } = getYesterday();

  const entries: VideoEntry[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];

    const videoIdMatch = entry.match(/<yt:videoId>([\s\S]*?)<\/yt:videoId>/);
    const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
    const publishedMatch = entry.match(/<published>([\s\S]*?)<\/published>/);

    if (!videoIdMatch || !titleMatch || !publishedMatch) continue;

    const published = new Date(publishedMatch[1].trim());
    if (published < start || published > end) continue;

    const videoId = videoIdMatch[1].trim();
    entries.push({
      videoId,
      title: titleMatch[1].trim(),
      url: `https://www.youtube.com/watch?v=${videoId}`,
      published,
    });
  }

  return entries;
}

async function getTranscript(videoId: string): Promise<string | null> {
  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: "en",
    });
    return segments.map((s) => s.text).join(" ");
  } catch {
    return null;
  }
}

export async function fetchYouTubeItems(): Promise<FetchedItem[]> {
  const items: FetchedItem[] = [];

  for (const channel of YOUTUBE_CHANNELS) {
    const videos = await getVideosPublishedYesterday(channel.channelId);

    for (const video of videos) {
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
