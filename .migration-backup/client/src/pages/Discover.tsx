import { useState, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { topics } from "@shared/schema";
import { Check, Compass, Globe, Hash } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

const regionGroups = [
  {
    label: "Europe",
    flag: "🇪🇺",
    regions: ["Belgium", "Netherlands", "France", "Germany", "South Europe", "North Europe", "Europe"],
  },
  {
    label: "Middle East",
    flag: "🌍",
    regions: ["UAE", "Middle East"],
  },
  {
    label: "Asia",
    flag: "🌏",
    regions: ["India", "China", "Asia"],
  },
  {
    label: "Americas",
    flag: "🌎",
    regions: ["USA", "Canada", "Brazil", "Mexico", "North America", "South America"],
  },
  {
    label: "Rest of World",
    flag: "🌐",
    regions: ["Africa", "Oceania", "World"],
  },
];

export default function Discover() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["Trending"]);
  const [selectedRegion, setSelectedRegion] = useState<string>("Belgium");
  const [, setLocation] = useLocation();

  // Load prefs — default to Belgium + Trending if nothing saved yet
  useEffect(() => {
    const savedTopics = localStorage.getItem("news_topics");
    const savedRegion = localStorage.getItem("news_region");

    if (savedTopics) {
      setSelectedTopics(JSON.parse(savedTopics));
    } else {
      setSelectedTopics(["Trending"]);
      localStorage.setItem("news_topics", JSON.stringify(["Trending"]));
    }

    if (savedRegion) {
      setSelectedRegion(savedRegion);
    } else {
      localStorage.setItem("news_region", "Belgium");
    }
  }, []);

  const toggleTopic = (topic: string) => {
    const newTopics = selectedTopics.includes(topic)
      ? selectedTopics.filter((t) => t !== topic)
      : [...selectedTopics, topic];
    setSelectedTopics(newTopics);
    localStorage.setItem("news_topics", JSON.stringify(newTopics));
  };

  const setRegion = (region: string) => {
    setSelectedRegion(region);
    localStorage.setItem("news_region", region);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border p-6">
        <div className="flex items-center gap-3 mb-2">
          <Compass className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold font-display">Discover</h1>
        </div>
        <p className="text-muted-foreground">Customize your news feed.</p>
      </div>

      <div className="p-6 space-y-10 max-w-2xl mx-auto">
        {/* Region Section */}
        <section>
          <div className="flex items-center gap-2 mb-5 text-lg font-bold text-foreground/90">
            <Globe className="w-5 h-5 text-accent" />
            <h2>Region Preference</h2>
          </div>
          <div className="space-y-6">
            {regionGroups.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                  {group.flag} {group.label}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {group.regions.map((region) => (
                    <button
                      key={region}
                      data-testid={`region-${region.toLowerCase().replace(/\s+/g, "-")}`}
                      onClick={() => setRegion(region)}
                      className={cn(
                        "relative p-3 rounded-xl border-2 text-left transition-all duration-200 ease-out",
                        selectedRegion === region
                          ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(236,72,153,0.15)]"
                          : "border-border bg-card hover:border-primary/50"
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <span className={cn("text-sm font-semibold", selectedRegion === region ? "text-primary" : "text-muted-foreground")}>
                          {region}
                        </span>
                        {selectedRegion === region && (
                          <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Topics Section */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-lg font-bold text-foreground/90">
            <Hash className="w-5 h-5 text-accent" />
            <h2>Topics of Interest</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {topics.map((topic) => {
              const isSelected = selectedTopics.includes(topic);
              return (
                <motion.button
                  key={topic}
                  whileTap={{ scale: 0.95 }}
                  data-testid={`topic-${topic.toLowerCase()}`}
                  onClick={() => toggleTopic(topic)}
                  className={cn(
                    "px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border",
                    isSelected
                      ? "bg-accent text-white border-accent shadow-lg shadow-accent/20"
                      : "bg-card text-muted-foreground border-border hover:border-accent/50 hover:text-accent"
                  )}
                >
                  {topic}
                  {isSelected && <span className="ml-2">✕</span>}
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Save/Apply Button */}
        <div className="pt-8">
          <Button
            data-testid="button-apply-preferences"
            onClick={() => setLocation("/")}
            className="w-full h-14 text-lg rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 font-bold"
          >
            Apply Preferences & Browse Feed
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Preferences are auto-saved to your device.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
