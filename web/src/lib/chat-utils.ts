export type ChatParticipant = {
  userId: string;
  user: { id: string; username: string; name: string; profileImage?: string | null };
};

export type ChatConversation = {
  id: string;
  participants: ChatParticipant[];
  messages: {
    id: string;
    content: string;
    senderId: string;
    isRead?: boolean;
    createdAt: string;
  }[];
};

export type ChatMessage = {
  id: string;
  content: string;
  senderId: string;
  messageType?: string;
  createdAt: string;
  sender?: { id: string; username: string; name: string; profileImage?: string | null };
};

export function getOtherParticipant(convo: ChatConversation, myUserId: string | undefined) {
  if (!myUserId) return null;
  const row = convo.participants?.find((p) => p.userId !== myUserId);
  return row?.user ?? null;
}

export function formatChatListTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24 && d.getDate() === now.getDate()) return `${hrs}h`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function dayKey(iso: string | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function dayDividerLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const today = dayKey(now.toISOString());
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  const yKey = dayKey(y.toISOString());
  const key = dayKey(iso);
  if (key === today) return 'Today';
  if (key === yKey) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

const CLUSTER_MS = 6 * 60 * 1000;

export function messageVisualMeta(
  messages: ChatMessage[],
  index: number,
  myId: string | undefined
) {
  const m = messages[index];
  const prev = messages[index - 1];
  const next = messages[index + 1];
  const mine = !!myId && m.senderId === myId;
  const prevSame = prev && prev.senderId === m.senderId;
  const nextSame = next && next.senderId === m.senderId;
  const prevClose =
    prev && new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < CLUSTER_MS;
  const nextClose =
    next && new Date(next.createdAt).getTime() - new Date(m.createdAt).getTime() < CLUSTER_MS;
  return {
    mine,
    showAvatar:
      !mine &&
      (!prevSame || !prevClose || dayKey(prev?.createdAt) !== dayKey(m.createdAt)),
    clusterTop: !prevSame || !prevClose || dayKey(prev?.createdAt) !== dayKey(m.createdAt),
    clusterBottom: !nextSame || !nextClose || dayKey(next?.createdAt) !== dayKey(m.createdAt),
  };
}
