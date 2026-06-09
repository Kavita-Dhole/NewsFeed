import { useEffect, useState } from "react";
import { useNews } from "@/hooks/use-news";
import { NewsCard } from "@/components/NewsCard";
import { BottomNav } from "@/components/BottomNav";
import { Loader2, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [filters, setFilters] = useState<{ region?: string; topics?: string[] }>({});

  // Load prefs on mount and apply both region and all selected topics
  useEffect(() => {
    const savedRegion = localStorage.getItem("news_region") || "Belgium";
    const savedTopics = localStorage.getItem("news_topics");
    const topicsArray: string[] = savedTopics ? JSON.parse(savedTopics) : ["Trending"];

    setFilters({
      region: savedRegion,
      topics: topicsArray.length > 0 ? topicsArray : ["Trending"],
    });
  }, []);

  const { data: news, isLoading, isError, refetch } = useNews(filters);

  // Loading State
  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
          <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
        </div>
        <p className="text-muted-foreground font-medium animate-pulse">Curating your feed...</p>
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background px-6 text-center">
        <h2 className="text-2xl font-bold mb-2">Oops! Something went wrong.</h2>
        <p className="text-muted-foreground mb-6">We couldn't load the latest news.</p>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" /> Try Again
        </Button>
      </div>
    );
  }

  // Empty State
  if (!news || news.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background px-6 text-center">
        <h2 className="text-2xl font-bold mb-2">No news found!</h2>
        <p className="text-muted-foreground mb-6">Try changing your filters in the Discover tab.</p>
        <Link href="/discover">
          <Button className="bg-primary hover:bg-primary/90 text-white">
            Go to Discover
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <main className="fixed inset-0 w-full h-full bg-black">
      {/* Scroll Snap Container */}
      <div className="w-full h-full overflow-y-scroll snap-y-mandatory no-scrollbar scroll-smooth">
        {news.map((item) => (
          <div key={item.id} className="w-full h-full snap-start relative">
             <NewsCard item={item} isActive={true} />
          </div>
        ))}
        
        {/* End of Feed Indicator */}
        <div className="w-full h-48 snap-start flex flex-col items-center justify-center bg-background border-t border-border">
          <p className="text-muted-foreground mb-4">You're all caught up!</p>
          <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} variant="outline">
            Back to Top
          </Button>
        </div>
      </div>
      
      <BottomNav />
    </main>
  );
}
