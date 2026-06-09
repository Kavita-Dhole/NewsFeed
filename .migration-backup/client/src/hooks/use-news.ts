import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertNews } from "@shared/schema";

// Type definition for filters
export interface NewsFilters {
  topics?: string[];
  region?: string;
  limit?: number;
  offset?: number;
}

// GET /api/news
export function useNews(filters: NewsFilters = {}) {
  // Create a query key that includes the filters so it refetches when they change
  const queryKey = [api.news.list.path, filters];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Build the URL with query parameters
      const params: Record<string, string> = {};
      if (filters.topics && filters.topics.length > 0) params.topics = filters.topics.join(",");
      if (filters.region) params.region = filters.region;
      if (filters.limit) params.limit = String(filters.limit);
      if (filters.offset) params.offset = String(filters.offset);

      const queryString = new URLSearchParams(params).toString();
      const url = `${api.news.list.path}?${queryString}`;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error('Failed to fetch news');
      
      return api.news.list.responses[200].parse(await res.json());
    },
  });
}

// GET /api/news/:id
export function useNewsItem(id: number) {
  return useQuery({
    queryKey: [api.news.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.news.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch news item');
      
      return api.news.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// POST /api/news (Admin/Seeding mostly)
export function useCreateNews() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InsertNews) => {
      const validated = api.news.create.input.parse(data);
      const res = await fetch(api.news.create.path, {
        method: api.news.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || 'Validation failed');
        }
        throw new Error('Failed to create news item');
      }

      return api.news.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.news.list.path] });
    },
  });
}
