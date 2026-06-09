import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { formatDistanceToNow } from "date-fns";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { NewsItem } from "@/types/news";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface Props {
  item: NewsItem;
}

export function NewsCard({ item }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [liked, setLiked] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const timeAgo = item.createdAt
    ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
    : "Just now";

  const handleLike = () => {
    setLiked((v) => !v);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleReadMore = () => {
    setShowDetail(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleOpenOriginal = () => {
    if (item.externalId) {
      Linking.openURL(item.externalId).catch(() => {});
    }
  };

  return (
    <View style={[styles.container, { width: SCREEN_WIDTH, height: SCREEN_HEIGHT }]}>
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
      )}

      <LinearGradient
        colors={["rgba(0,0,0,0.35)", "transparent", "rgba(0,0,0,0.92)"]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.rightActions,
          { bottom: insets.bottom + 100 },
        ]}
      >
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <Feather
            name="heart"
            size={26}
            color={liked ? colors.primary : "#fff"}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleReadMore}>
          <Feather name="message-circle" size={26} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Feather name="share-2" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.bottomContent,
          {
            paddingBottom: insets.bottom + 90,
            paddingLeft: 20,
            paddingRight: 80,
          },
        ]}
      >
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeText}>{item.topic}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: "rgba(0,0,0,0.4)" }]}>
            <Feather name="globe" size={10} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.badgeText}>{item.region}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: "rgba(0,0,0,0.4)" }]}>
            <Feather name="clock" size={10} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.badgeText}>{timeAgo}</Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={3}>
          {item.title}
        </Text>
        <Text style={styles.summary} numberOfLines={2}>
          {item.summary}
        </Text>
        <Text style={[styles.source, { color: colors.primary }]}>
          {item.source}
        </Text>

        <TouchableOpacity style={styles.readMoreBtn} onPress={handleReadMore}>
          <Text style={styles.readMoreText}>Read Summary</Text>
          <Feather name="chevron-up" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetail(false)}
      >
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingTop: insets.top || 16 }]}>
            <View style={styles.modalBadges}>
              <View style={[styles.badge, { backgroundColor: colors.primary + "20", borderWidth: 1, borderColor: colors.primary + "40" }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>{item.topic}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: colors.muted }]}>
                <Text style={styles.badgeText}>{item.region}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setShowDetail(false)}
              style={[styles.closeBtn, { backgroundColor: colors.muted }]}
            >
              <Feather name="x" size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {item.title}
            </Text>
            <Text style={[styles.modalMeta, { color: colors.mutedForeground }]}>
              By{" "}
              <Text style={{ color: colors.foreground, fontWeight: "600" }}>
                {item.source}
              </Text>{" "}
              • {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Today"}
            </Text>

            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.modalImage}
                resizeMode="cover"
              />
            ) : null}

            <Text style={[styles.modalLabel, { color: colors.primary }]}>
              English Summary & Content:
            </Text>

            {item.content.split("\n").map((para, i) =>
              para.trim() ? (
                <Text key={i} style={[styles.modalParagraph, { color: "#D1D1E0" }]}>
                  {para}
                </Text>
              ) : null
            )}

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                onPress={handleOpenOriginal}
              >
                <Text style={styles.primaryBtnText}>View Original Article</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: colors.border }]}
                onPress={() => setShowDetail(false)}
              >
                <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "#000",
  },
  rightActions: {
    position: "absolute",
    right: 16,
    flexDirection: "column",
    gap: 20,
    alignItems: "center",
  },
  actionBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    gap: 8,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
    textShadow: "0px 1px 4px rgba(0,0,0,0.6)",
  },
  summary: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    lineHeight: 20,
    textShadow: "0px 1px 3px rgba(0,0,0,0.5)",
  },
  source: {
    fontSize: 13,
    fontWeight: "700",
  },
  readMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    marginTop: 4,
  },
  readMoreText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  modal: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalBadges: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
    flexWrap: "wrap",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  modalScroll: {
    flex: 1,
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
    marginBottom: 8,
  },
  modalMeta: {
    fontSize: 13,
    marginBottom: 16,
  },
  modalImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  modalParagraph: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    paddingBottom: 40,
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
