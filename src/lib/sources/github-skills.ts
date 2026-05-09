import {
  GITHUB_SKILL_SEARCH_TOPICS,
  GITHUB_SKILL_SEARCH_QUERIES,
  GITHUB_AWESOME_LISTS,
  GITHUB_MIN_STARS,
  GITHUB_MAX_RESULTS_PER_QUERY,
} from "./config";
import type { FetchedItem, FetchedSkillMeta } from "@/types";

interface GitHubRepo {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  owner: { login: string };
  name: string;
  topics: string[];
  pushed_at: string | null;
}

interface GitHubSearchResponse {
  items: GitHubRepo[];
}

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function searchByTopic(topic: string): Promise<GitHubRepo[]> {
  const url = `https://api.github.com/search/repositories?q=topic:${encodeURIComponent(topic)}&sort=stars&order=desc&per_page=${GITHUB_MAX_RESULTS_PER_QUERY}`;
  const res = await fetch(url, { headers: githubHeaders() });
  if (!res.ok) {
    console.warn(`GitHub topic search failed for "${topic}": ${res.status}`);
    return [];
  }
  const data: GitHubSearchResponse = await res.json();
  return data.items ?? [];
}

async function searchByQuery(query: string): Promise<GitHubRepo[]> {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${GITHUB_MAX_RESULTS_PER_QUERY}`;
  const res = await fetch(url, { headers: githubHeaders() });
  if (!res.ok) {
    console.warn(`GitHub query search failed for "${query}": ${res.status}`);
    return [];
  }
  const data: GitHubSearchResponse = await res.json();
  return data.items ?? [];
}

async function fetchReadme(fullName: string): Promise<string | null> {
  const url = `https://api.github.com/repos/${fullName}/readme`;
  const res = await fetch(url, { headers: githubHeaders() });
  if (!res.ok) return null;

  const data = await res.json();
  if (data.content && data.encoding === "base64") {
    const decoded = Buffer.from(data.content, "base64").toString("utf-8");
    return decoded.slice(0, 8000);
  }
  return null;
}

async function parseAwesomeList(repoFullName: string): Promise<string[]> {
  const readme = await fetchReadme(repoFullName);
  if (!readme) return [];

  const repoUrls: string[] = [];
  const linkRegex = /\[([^\]]+)\]\((https:\/\/github\.com\/[^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(readme)) !== null) {
    const url = match[2].replace(/\/+$/, "");
    if (!url.includes("/blob/") && !url.includes("/tree/") && !url.includes("#")) {
      repoUrls.push(url);
    }
  }
  return repoUrls;
}

function detectInstallCommand(readme: string): string | null {
  const npxMatch = readme.match(/`(npx\s+[^\s`]+(?:\s+[^\s`]*)?)`/);
  if (npxMatch) return npxMatch[1];

  const claudeInstall = readme.match(/`(claude\s+mcp\s+add[^`]+)`/);
  if (claudeInstall) return claudeInstall[1];

  const npmInstall = readme.match(/`(npm\s+install\s+(?:-g\s+)?[^\s`]+)`/);
  if (npmInstall) return npmInstall[1];

  return null;
}

function dedupeRepos(repos: GitHubRepo[]): GitHubRepo[] {
  const seen = new Map<string, GitHubRepo>();
  for (const repo of repos) {
    const key = repo.html_url.toLowerCase();
    if (!seen.has(key) || repo.stargazers_count > seen.get(key)!.stargazers_count) {
      seen.set(key, repo);
    }
  }
  return [...seen.values()];
}

export interface GitHubFetchResult {
  items: FetchedItem[];
  skillMetas: Map<string, FetchedSkillMeta>;
}

export async function fetchGitHubSkills(
  isUrlProcessed: (url: string) => Promise<boolean>
): Promise<GitHubFetchResult> {
  const allRepos: GitHubRepo[] = [];

  const topicResults = await Promise.all(
    GITHUB_SKILL_SEARCH_TOPICS.map(searchByTopic)
  );
  for (const repos of topicResults) allRepos.push(...repos);

  const queryResults = await Promise.all(
    GITHUB_SKILL_SEARCH_QUERIES.map(searchByQuery)
  );
  for (const repos of queryResults) allRepos.push(...repos);

  for (const listRepo of GITHUB_AWESOME_LISTS) {
    const urls = await parseAwesomeList(listRepo);
    for (const url of urls) {
      const parts = url.replace("https://github.com/", "").split("/");
      if (parts.length >= 2) {
        const fullName = `${parts[0]}/${parts[1]}`;
        const repoRes = await fetch(
          `https://api.github.com/repos/${fullName}`,
          { headers: githubHeaders() }
        );
        if (repoRes.ok) {
          const repo: GitHubRepo = await repoRes.json();
          allRepos.push(repo);
        }
      }
    }
  }

  const uniqueRepos = dedupeRepos(allRepos).filter(
    (r) => r.stargazers_count >= GITHUB_MIN_STARS
  );

  console.log(`Found ${uniqueRepos.length} unique repos with >= ${GITHUB_MIN_STARS} stars`);

  const items: FetchedItem[] = [];
  const skillMetas = new Map<string, FetchedSkillMeta>();

  for (const repo of uniqueRepos) {
    if (await isUrlProcessed(repo.html_url)) continue;

    const readme = await fetchReadme(repo.full_name);
    if (!readme) continue;

    const installCommand = detectInstallCommand(readme);

    items.push({
      url: repo.html_url,
      platform: "github",
      content: `# ${repo.name}\n\n${repo.description ?? ""}\n\nStars: ${repo.stargazers_count}\nAuthor: ${repo.owner.login}\nTopics: ${repo.topics.join(", ")}\n\n${readme}`,
      creator: repo.owner.login,
      title: repo.name,
    });

    skillMetas.set(repo.html_url, {
      repoUrl: repo.html_url,
      name: repo.name,
      author: repo.owner.login,
      description: repo.description ?? "",
      stars: repo.stargazers_count,
      lastUpdated: repo.pushed_at,
      topics: repo.topics,
      readmeExcerpt: readme.slice(0, 2000),
      installCommand,
    });
  }

  return { items, skillMetas };
}
