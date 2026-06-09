import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFilters } from "@/context/FiltersContext";
import { useColors } from "@/hooks/useColors";
import { REGION_GROUPS, TOPICS } from "@/types/news";

export default function DiscoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { region, topics, setRegion, toggleTopic } = useFilters();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSetRegion = (r: string) => {
    setRegion(r);
    Haptics.selectionAsync();
  };

  const handleToggleTopic = (t: string) => {
    toggleTopic(t);
    Haptics.selectionAsync();
  };

  const handleApply = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/");
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 8,
            backgroundColor: colors.background + "CC",
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Feather name="compass" size={28} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Discover</Text>
        </View>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          Customize your news feed
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: bottomPad + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="globe" size={18} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Region
            </Text>
          </View>

          {REGION_GROUPS.map((group) => (
            <View key={group.label} style={styles.regionGroup}>
              <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>
                {group.flag} {group.label}
              </Text>
              <View style={styles.regionGrid}>
                {group.regions.map((r) => {
                  const isSelected = region === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      onPress={() => handleSetRegion(r)}
                      style={[
                        styles.regionBtn,
                        {
                          borderColor: isSelected ? colors.primary : colors.border,
                          backgroundColor: isSelected
                            ? colors.primary + "12"
                            : colors.card,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.regionBtnText,
                          {
                            color: isSelected ? colors.primary : colors.mutedForeground,
                          },
                        ]}
                      >
                        {r}
                      </Text>
                      {isSelected && (
                        <View style={[styles.checkDot, { backgroundColor: colors.primary }]}>
                          <Feather name="check" size={10} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="hash" size={18} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Topics</Text>
          </View>
          <View style={styles.topicsRow}>
            {TOPICS.map((topic) => {
              const isSelected = topics.includes(topic);
              return (
                <TouchableOpacity
                  key={topic}
                  onPress={() => handleToggleTopic(topic)}
                  style={[
                    styles.topicChip,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.card,
                      borderColor: isSelected ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.topicChipText,
                      {
                        color: isSelected ? "#fff" : colors.mutedForeground,
                      },
                    ]}
                  >
                    {topic}
                    {isSelected ? "  ✕" : ""}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.applyContainer,
          {
            paddingBottom: bottomPad + 12,
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        <Pressable style={styles.applyBtn} onPress={handleApply}>
          <Text style={styles.applyBtnText}>Apply & Browse Feed</Text>
          <Feather name="arrow-right" size={20} color="#fff" />
        </Pressable>
        <Text style={[styles.applyNote, { color: colors.mutedForeground }]}>
          Preferences saved automatically
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 14,
  },
  scroll: {
    padding: 20,
    gap: 32,
  },
  section: {
    gap: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  regionGroup: {
    gap: 8,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    paddingHorizontal: 2,
  },
  regionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  regionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    minWidth: 100,
    gap: 6,
  },
  regionBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  checkDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  topicsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  topicChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1,
  },
  topicChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  applyContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
    alignItems: "center",
  },
  applyBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: "#E8245C",
  },
  applyBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  applyNote: {
    fontSize: 12,
  },
});
