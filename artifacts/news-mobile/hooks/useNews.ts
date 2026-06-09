import { useQuery } from "@tanstack/react-query";
import { NewsFilters, NewsItem } from "@/types/news";

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "";

export function useNews(filters: NewsFilters = {}) {
  const queryKey = ["news", filters];

  return useQuery<NewsItem[]>({
    queryKey,
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters.topics && filters.topics.length > 0)
        params.topics = filters.topics.join(",");
      if (filters.region) params.region = filters.region;
      if (filters.limit) params.limit = String(filters.limit);
      if (filters.offset) params.offset = String(filters.offset);

      const queryString = new URLSearchParams(params).toString();
      const url = `${BASE_URL}/api/news${queryString ? `?${queryString}` : ""}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch news");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}
