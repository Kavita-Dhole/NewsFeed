import { Feather } from "@expo/vector-icons";
import React, { useRef, useState, useCallback } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LoadingFeed } from "@/components/LoadingFeed";
import { NewsCard } from "@/components/NewsCard";
import { useFilters } from "@/context/FiltersContext";
import { useColors } from "@/hooks/useColors";
import { useNews } from "@/hooks/useNews";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function FeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { region, topics } = useFilters();
  const { data: news, isLoading, isError, refetch } = useNews({ region, topics });
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (isLoading) return <LoadingFeed />;

  if (isError) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          Couldn't load news
        </Text>
        <Pressable
          style={[styles.retryBtn, { borderColor: colors.border }]}
          onPress={() => refetch()}
        >
          <Feather name="refresh-cw" size={16} color={colors.foreground} />
          <Text style={[styles.retryText, { color: colors.foreground }]}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  if (!news || news.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="inbox" size={40} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          No news found
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
          Try changing your filters
        </Text>
        <Pressable
          style={[styles.discoverBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/discover")}
        >
          <Text style={styles.discoverBtnText}>Go to Discover</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      <FlatList
        data={news}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <NewsCard item={item} />}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEnabled={!!news && news.length > 0}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        ListFooterComponent={
          <View
            style={[
              styles.footer,
              {
                height: SCREEN_HEIGHT,
                backgroundColor: colors.background,
                borderTopColor: colors.border,
              },
            ]}
          >
            <Feather name="check-circle" size={32} color={colors.mutedForeground} />
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              You're all caught up!
            </Text>
            <Pressable
              style={[styles.retryBtn, { borderColor: colors.border }]}
              onPress={() => refetch()}
            >
              <Feather name="refresh-cw" size={16} color={colors.foreground} />
              <Text style={[styles.retryText, { color: colors.foreground }]}>Refresh</Text>
            </Pressable>
          </View>
        }
      />

      <View
        style={[
          styles.topBar,
          {
            paddingTop: topPad + 8,
            backgroundColor: "transparent",
            pointerEvents: "none" as const,
          },
        ]}
      >
        <Text style={styles.logo}>NewsFeed</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  logo: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.5,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 8,
  },
  retryText: {
    fontSize: 15,
    fontWeight: "600",
  },
  discoverBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
    marginTop: 8,
  },
  discoverBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
