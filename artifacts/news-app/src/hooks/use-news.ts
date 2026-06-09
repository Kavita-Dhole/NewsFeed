import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface NewsItem {
  id: number;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  source: string;
  topic: string;
  region: string;
  externalId: string | null;
  createdAt: Date | null;
}

export interface InsertNews {
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  source: string;
  topic: string;
  region: string;
  externalId?: string | null;
}

export interface NewsFilters {
  topics?: string[];
  region?: string;
  limit?: number;
  offset?: number;
}

const NEWS_PATH = "/api/news";

export function useNews(filters: NewsFilters = {}) {
  const queryKey = [NEWS_PATH, filters];

  return useQuery<NewsItem[]>({
    queryKey,
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters.topics && filters.topics.length > 0) params.topics = filters.topics.join(",");
      if (filters.region) params.region = filters.region;
      if (filters.limit) params.limit = String(filters.limit);
      if (filters.offset) params.offset = String(filters.offset);

      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${NEWS_PATH}?${queryString}` : NEWS_PATH;

      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch news");

      return res.json();
    },
  });
}

export function useNewsItem(id: number) {
  return useQuery<NewsItem | null>({
    queryKey: [NEWS_PATH, id],
    queryFn: async () => {
      const res = await fetch(`${NEWS_PATH}/${id}`, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch news item");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateNews() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertNews) => {
      const res = await fetch(NEWS_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create news item");
      }

      return res.json() as Promise<NewsItem>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NEWS_PATH] });
    },
  });
}
