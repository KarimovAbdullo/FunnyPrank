/**
 * Prank AI Chat - chat screen with predefined AI responses
 * User messages on right, AI on left. Edit button to set AI responses in advance.
 */
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  documentDirectory,
  getInfoAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from "expo-file-system/legacy";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BackIcon } from "@/components";
import { showRewardedAd } from "@/services/ads";
import {
  addAiChatCredit,
  consumeAiChatCredit,
  useAiChatCredits,
} from "@/services/premium";

const AI_RESPONSES_FILE = "prank_ai_chat_responses.json";

type Message = {
  id: string;
  type: "user" | "ai" | "loading";
  text: string;
  typingLength?: number;
};

const DEFAULT_AI_RESPONSES = [
  "Sure, I'm here! What's up?",
  "That's funny 😄",
  "Give me a sec...",
  "Okay, done!",
  "Haha, nice one.",
];

let idCounter = 0;
function nextId() {
  return `msg_${++idCounter}_${Date.now()}`;
}

export default function PrankAiChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [aiResponses, setAiResponses] =
    useState<string[]>(DEFAULT_AI_RESPONSES);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editResponses, setEditResponses] = useState<string[]>([]);
  const listRef = useRef<FlatList>(null);
  const aiResponseIndex = useRef(0);
  const [keyboardBottomPadding, setKeyboardBottomPadding] = useState(0);
  const credits = useAiChatCredits();
  const [showPaywall, setShowPaywall] = useState(false);
  const [loadingAd, setLoadingAd] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const dir = documentDirectory;
    if (!dir) return;
    const path = `${dir}${AI_RESPONSES_FILE}`;
    getInfoAsync(path)
      .then((info) => (info.exists ? readAsStringAsync(path) : null))
      .then((raw) => {
        if (cancelled) return;
        try {
          const parsed = raw != null ? JSON.parse(raw) : null;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAiResponses(parsed.filter((r) => typeof r === "string"));
          }
        } catch {}
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setMessages((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i--) {
          const m = next[i];
          if (
            m.type === "ai" &&
            m.typingLength !== undefined &&
            m.typingLength < m.text.length
          ) {
            next[i] = {
              ...m,
              typingLength: Math.min(m.text.length, m.typingLength + 1),
            };
            return next;
          }
        }
        return prev;
      });
    }, 45);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const windowHeight = Dimensions.get("window").height;
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        const keyboardTop = e.endCoordinates.screenY;
        setKeyboardBottomPadding(Math.max(0, windowHeight - keyboardTop));
      },
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardBottomPadding(0),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const deliverMessage = useCallback(
    (text: string) => {
      setInputText("");
      const userMsg: Message = { id: nextId(), type: "user", text };
      setMessages((prev) => [...prev, userMsg]);

      const loadingId = nextId();
      setMessages((prev) => [
        ...prev,
        { id: loadingId, type: "loading", text: "..." },
      ]);

      const responses = aiResponses.length > 0 ? aiResponses : ["..."];
      const reply = responses[aiResponseIndex.current % responses.length];
      aiResponseIndex.current += 1;

      const delay = 2000 + Math.random() * 1000;
      setTimeout(() => {
        setMessages((prev) =>
          prev
            .filter((m) => m.id !== loadingId)
            .concat([
              { id: nextId(), type: "ai", text: reply, typingLength: 0 },
            ]),
        );
      }, delay);
    },
    [aiResponses],
  );

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;

    const consumed = await consumeAiChatCredit();
    if (!consumed) {
      setShowPaywall(true);
      return;
    }
    deliverMessage(text);
  }, [inputText, deliverMessage]);

  const watchAdForCredit = useCallback(async () => {
    if (loadingAd) return;
    setLoadingAd(true);
    const earned = await showRewardedAd(() => {
      addAiChatCredit();
    });
    setLoadingAd(false);
    setShowPaywall(false);
    if (!earned) return;

    // Auto-send the already-typed message using the freshly granted credit.
    const text = inputText.trim();
    if (!text) return;
    const consumed = await consumeAiChatCredit();
    if (consumed) deliverMessage(text);
  }, [loadingAd, inputText, deliverMessage]);

  const openEdit = useCallback(() => {
    setEditResponses([...aiResponses]);
    setShowEditModal(true);
  }, [aiResponses]);

  const saveEdit = useCallback(() => {
    const saved = editResponses.filter((r) => r.trim().length > 0);
    setAiResponses(saved);
    setShowEditModal(false);
    const dir = documentDirectory;
    if (dir) {
      writeAsStringAsync(`${dir}${AI_RESPONSES_FILE}`, JSON.stringify(saved));
    }
  }, [editResponses]);

  const addEditRow = useCallback(() => {
    setEditResponses((prev) => [...prev, ""]);
  }, []);

  const updateEditRow = useCallback((index: number, value: string) => {
    setEditResponses((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const removeEditRow = useCallback((index: number) => {
    setEditResponses((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isUser = item.type === "user";
    const isLoading = item.type === "loading";
    const displayText =
      item.type === "ai"
        ? item.text.slice(0, item.typingLength ?? item.text.length)
        : isLoading
          ? "..."
          : item.text;
    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.messageRowUser : styles.messageRowAi,
        ]}
      >
        <View
          style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}
        >
          <Text style={styles.bubbleText}>
            {displayText}
            {item.type === "ai" && (item.typingLength ?? 0) < item.text.length
              ? "▌"
              : ""}
          </Text>
        </View>
      </View>
    );
  }, []);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={[styles.main, { paddingBottom: keyboardBottomPadding }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <BackIcon />
          </Pressable>
          <View style={{ flexDirection: "row" }}>
            <Image
              source={require("@/assets/images/buttons/ai.webp")}
              style={{
                width: 60,
                height: 60,
                position: "absolute",
                left: 90,
                top: -15,
              }}
              resizeMode="contain"
            />
            <Text style={styles.title}> AI Chat</Text>
          </View>
          <Pressable onPress={openEdit} style={styles.editBtn}>
            <Ionicons name="pencil" size={22} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.creditBar}>
          <Ionicons name="flash" size={14} color="#facc15" />
          <Text style={styles.creditText}>{credits} left</Text>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: 80 }]}
          onContentSizeChange={scrollToEnd}
          onLayout={scrollToEnd}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        <View
          style={[
            styles.inputRow,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Message..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
          />
          <Pressable
            style={[
              styles.sendBtn,
              !inputText.trim() && styles.sendBtnDisabled,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={22} color="#fff" />
          </Pressable>
        </View>
      </View>

      <Modal
        visible={showPaywall}
        transparent
        animationType="fade"
        onRequestClose={() => (loadingAd ? null : setShowPaywall(false))}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => (loadingAd ? null : setShowPaywall(false))}
        >
          <Pressable
            style={styles.paywallCard}
            onPress={(e) => e.stopPropagation()}
          >
            <Ionicons name="flash" size={36} color="#facc15" />
            <Text style={styles.paywallTitle}>You ran out of replies</Text>
            <Text style={styles.paywallHint}>
              Watch a short ad to unlock one more message.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setShowPaywall(false)}
                disabled={loadingAd}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.doneBtn, loadingAd && styles.sendBtnDisabled]}
                onPress={watchAdForCredit}
                disabled={loadingAd}
              >
                <Text style={styles.doneBtnText}>
                  {loadingAd ? "Loading ad…" : "Watch ad"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showEditModal} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowEditModal(false)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>AI responses (predefined)</Text>
            <Text style={styles.modalHint}>
              These replies will be sent in order when the user writes.
            </Text>

            <FlatList
              data={editResponses}
              keyExtractor={(_, i) => `r${i}`}
              renderItem={({ item, index }) => (
                <View style={styles.editRow}>
                  <TextInput
                    style={styles.editInput}
                    value={item}
                    onChangeText={(v) => updateEditRow(index, v)}
                    placeholder={`Response ${index + 1}`}
                    placeholderTextColor="#888"
                  />
                  <Pressable
                    onPress={() => removeEditRow(index)}
                    style={styles.removeBtn}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </Pressable>
                </View>
              )}
              style={styles.editList}
            />

            <Pressable onPress={addEditRow} style={styles.addBtn}>
              <Ionicons name="add" size={24} color="#22c55e" />
              <Text style={styles.addBtnText}>Add response</Text>
            </Pressable>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.doneBtn} onPress={saveEdit}>
                <Text style={styles.doneBtnText}>Done</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#202123",
  },
  main: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  backBtn: { padding: 8, marginRight: 4 },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  editBtn: { padding: 8, position: "absolute", right: 0, top: 20 },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  messageRow: {
    marginBottom: 12,
    maxWidth: "82%",
  },
  messageRowUser: {
    alignSelf: "flex-end",
  },
  messageRowAi: {
    alignSelf: "flex-start",
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: "100%",
  },
  bubbleUser: {
    backgroundColor: "#0ea5e9",
    borderBottomRightRadius: 4,
  },
  bubbleAi: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    color: "#fff",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 16,
    color: "#fff",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0ea5e9",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  modalHint: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 16,
  },
  editList: {
    maxHeight: 240,
    marginBottom: 12,
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  editInput: {
    flex: 1,
    backgroundColor: "#334155",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#fff",
  },
  removeBtn: { padding: 8 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.5)",
    borderRadius: 12,
  },
  addBtnText: { fontSize: 15, color: "#22c55e", fontWeight: "600" },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 16, color: "#fff", fontWeight: "600" },
  doneBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#22c55e",
    alignItems: "center",
  },
  doneBtnText: { fontSize: 16, color: "#fff", fontWeight: "700" },
  creditBar: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: "rgba(250,204,21,0.12)",
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.4)",
  },
  creditText: {
    fontSize: 12,
    color: "#facc15",
    fontWeight: "700",
  },
  paywallCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  paywallTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    marginTop: 12,
    textAlign: "center",
  },
  paywallHint: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    marginTop: 8,
    marginBottom: 20,
    textAlign: "center",
  },
});
