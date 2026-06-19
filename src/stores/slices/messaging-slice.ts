import type { StateCreator } from "zustand";

export interface MessagingPageState {
  view: "kanban" | "list";
  submenu: string[];
  channels: string[];
  selectedMessage: string | null;
  threadMessage: string | null;
}

export interface MessagingSlice {
  messaging: MessagingPageState;
  setSelectedMessage: (id: string | null) => void;
  setThreadMessage: (id: string | null) => void;
  toggleChannel: (channel: string) => void;
  // Pulse bumped whenever the host actions a conversation (reply, flag,
  // archive, convert), so the read-on-open grace timer can cancel its
  // revert-to-unread for that conversation.
  conversationActionSignal: { conversationId: string; nonce: number } | null;
  noteConversationAction: (conversationId: string) => void;
}

export const createMessagingSlice: StateCreator<MessagingSlice, [], [], MessagingSlice> = (
  set,
  get,
) => ({
  messaging: {
    view: "kanban",
    submenu: ["overview"],
    channels: [],
    selectedMessage: null,
    threadMessage: null,
  },
  setSelectedMessage: (id) => set({ messaging: { ...get().messaging, selectedMessage: id } }),
  setThreadMessage: (id) => set({ messaging: { ...get().messaging, threadMessage: id } }),
  conversationActionSignal: null,
  noteConversationAction: (conversationId) =>
    set({
      conversationActionSignal: {
        conversationId,
        nonce: (get().conversationActionSignal?.nonce ?? 0) + 1,
      },
    }),
  toggleChannel: (channel) => {
    const current = get().messaging.channels;
    set({
      messaging: {
        ...get().messaging,
        channels: current.includes(channel)
          ? current.filter((c) => c !== channel)
          : [...current, channel],
      },
    });
  },
});
