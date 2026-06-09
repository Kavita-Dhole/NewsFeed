import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

interface FiltersState {
  region: string;
  topics: string[];
  setRegion: (region: string) => void;
  toggleTopic: (topic: string) => void;
}

const FiltersContext = createContext<FiltersState>({
  region: "Belgium",
  topics: ["Trending"],
  setRegion: () => {},
  toggleTopic: () => {},
});

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [region, setRegionState] = useState("Belgium");
  const [topics, setTopics] = useState<string[]>(["Trending"]);

  useEffect(() => {
    (async () => {
      const savedRegion = await AsyncStorage.getItem("news_region");
      const savedTopics = await AsyncStorage.getItem("news_topics");
      if (savedRegion) setRegionState(savedRegion);
      if (savedTopics) {
        try {
          setTopics(JSON.parse(savedTopics));
        } catch {}
      }
    })();
  }, []);

  const setRegion = useCallback(async (r: string) => {
    setRegionState(r);
    await AsyncStorage.setItem("news_region", r);
  }, []);

  const toggleTopic = useCallback(
    async (topic: string) => {
      const next = topics.includes(topic)
        ? topics.filter((t) => t !== topic)
        : [...topics, topic];
      setTopics(next);
      await AsyncStorage.setItem("news_topics", JSON.stringify(next));
    },
    [topics]
  );

  return (
    <FiltersContext.Provider value={{ region, topics, setRegion, toggleTopic }}>
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters() {
  return useContext(FiltersContext);
}
