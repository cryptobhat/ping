'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { chatApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import {
  MessageCircle,
  Search,
  Plus,
  Send,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  type ChatConversation,
  type ChatMessage,
  dayDividerLabel,
  dayKey,
  formatChatListTime,
  formatMessageTime,
  getOtherParticipant,
  messageVisualMeta,
} from '@/lib/chat-utils';

export default function ChatConversationPage() {
  const { id } = useParams();
  const router = useRouter();
  const conversationId = id as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) {
      setListLoading(false);
      return;
    }
    try {
      const { data } = await chatApi.getConversations();
      const body = data as { data?: ChatConversation[] };
      const list = body?.data ?? [];
      setConversations(Array.isArray(list) ? list : []);
    } catch {
      setConversations([]);
    } finally {
      setListLoading(false);
    }
  }, [isAuthenticated]);

  const loadMessages = useCallback(async () => {
    if (!conversationId || !isAuthenticated) return;
    setMsgLoading(true);
    try {
      const { data } = await chatApi.getMessages(conversationId, { limit: 80, page: 1 });
      const body = data as { data?: ChatMessage[] };
      const list = body?.data ?? [];
      setMessages(Array.isArray(list) ? list : []);
      await chatApi.markRead(conversationId).catch(() => {});
    } catch {
      setMessages([]);
      toast.error('Could not load messages');
    } finally {
      setMsgLoading(false);
    }
  }, [conversationId, isAuthenticated]);

  useEffect(() => {
    if (!authLoading) loadConversations();
  }, [authLoading, loadConversations]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible' && conversationId) loadMessages();
    }, 20000);
    return () => clearInterval(t);
  }, [conversationId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, msgLoading]);

  const currentConvo = useMemo(
    () => conversations.find((c) => c.id === conversationId),
    [conversations, conversationId]
  );

  const otherUser = useMemo(() => {
    if (currentConvo) return getOtherParticipant(currentConvo, user?.id);
    return null;
  }, [currentConvo, user?.id]);

  const filteredConvos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const o = getOtherParticipant(c, user?.id);
      return (
        (o?.name || '').toLowerCase().includes(q) || (o?.username || '').toLowerCase().includes(q)
      );
    });
  }, [conversations, searchQuery, user?.id]);

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text || !conversationId || sending || !user) return;
    setSending(true);
    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      content: text,
      senderId: user.id,
      createdAt: new Date().toISOString(),
      sender: {
        id: user.id,
        username: user.username,
        name: user.name,
        profileImage: user.profileImage,
      },
    };
    setMessages((prev) => [...prev, optimistic]);
    setMessageText('');
    try {
      const { data } = await chatApi.sendMessage(conversationId, { content: text, messageType: 'TEXT' });
      const raw = data as { data?: ChatMessage };
      const sent = raw?.data ?? (data as unknown as ChatMessage);
      if (sent && typeof sent === 'object' && 'id' in sent) {
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? (sent as ChatMessage) : m)));
      }
      loadConversations();
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setMessageText(text);
      toast.error('Message failed to send');
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-[100dvh] lg:h-[calc(100dvh-4rem)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-warm-900 dark:text-warm-50 mb-2">Sign in to continue</h1>
        <Button variant="primary" size="sm" onClick={() => router.push(`/login?next=/chat/${conversationId}`)}>
          Go to login
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] lg:h-[calc(100dvh-4.5rem)] overflow-hidden lg:-mx-0 lg:border lg:border-warm-100 dark:lg:border-warm-800 lg:rounded-2xl">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-[min(100%,380px)] xl:w-[400px] flex-shrink-0 flex-col border-r border-warm-100 dark:border-warm-800 bg-white dark:bg-warm-950">
        <div className="px-4 pt-4 pb-3 border-b border-warm-100/80 dark:border-warm-800/80">
          <div className="flex items-center justify-between mb-3">
            <Link href="/chat" className="flex items-center gap-2 text-warm-600 hover:text-primary text-sm font-medium">
              <MessageCircle className="w-4 h-4" />
              All chats
            </Link>
            <Link
              href="/discover"
              className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
            >
              <Plus className="w-5 h-5" />
            </Link>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-warm-50 dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl">
            <Search className="w-4 h-4 text-warm-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search…"
              className="flex-1 bg-transparent text-sm outline-none text-warm-900 dark:text-warm-100 placeholder:text-warm-400"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {listLoading ? (
            <div className="p-3 space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-warm-100 dark:bg-warm-800 rounded-xl" />
              ))}
            </div>
          ) : (
            <ul className="space-y-0.5">
              {filteredConvos.map((conv) => {
                const other = getOtherParticipant(conv, user?.id);
                const last = conv.messages?.[0];
                const active = conv.id === conversationId;
                const unread = last && last.senderId !== user?.id && last.isRead === false;
                return (
                  <li key={conv.id}>
                    <Link
                      href={`/chat/${conv.id}`}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors',
                        active
                          ? 'bg-primary/[0.12] ring-1 ring-primary/20'
                          : 'hover:bg-warm-50 dark:hover:bg-warm-900',
                        unread && !active && 'bg-primary/[0.04]'
                      )}
                    >
                      <Avatar src={other?.profileImage ?? undefined} name={other?.name || 'User'} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                          <span className="text-sm font-semibold truncate text-warm-900 dark:text-warm-100">
                            {other?.name}
                          </span>
                          {last && (
                            <span className="text-[10px] text-warm-400 flex-shrink-0">
                              {formatChatListTime(last.createdAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-warm-500 truncate">{last?.content || '…'}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Main thread */}
      <section className="flex-1 flex flex-col min-w-0 bg-[#FAF8F5] dark:bg-warm-950 relative">
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.12] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2378716c' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <header className="relative z-10 flex items-center gap-3 px-4 py-3 border-b border-warm-200/60 dark:border-warm-800 bg-white/90 dark:bg-warm-900/95 backdrop-blur-md">
          <Link href="/chat" className="p-2 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-800 lg:hidden" aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-warm-600" />
          </Link>
          {otherUser ? (
            <Link href={`/user/${otherUser.username}`} className="flex items-center gap-3 flex-1 min-w-0 group">
              <Avatar src={otherUser.profileImage ?? undefined} name={otherUser.name} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-warm-900 dark:text-warm-100 truncate group-hover:text-primary transition-colors">
                  {otherUser.name}
                </p>
                <p className="text-[11px] text-warm-500 truncate">@{otherUser.username}</p>
              </div>
            </Link>
          ) : (
            <div className="flex-1">
              <p className="text-sm font-medium text-warm-600">Conversation</p>
            </div>
          )}
        </header>

        <div className="relative z-10 flex-1 overflow-y-auto px-3 sm:px-6 py-4">
          {msgLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-1">
              {messages.map((msg, i) => {
                const showDay =
                  i === 0 || dayKey(messages[i - 1].createdAt) !== dayKey(msg.createdAt);
                const meta = messageVisualMeta(messages, i, user?.id);
                return (
                  <div key={msg.id}>
                    {showDay && (
                      <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-warm-200/80 dark:bg-warm-800" />
                        <span className="text-[10px] uppercase tracking-wider text-warm-400 font-semibold px-2">
                          {dayDividerLabel(msg.createdAt)}
                        </span>
                        <div className="flex-1 h-px bg-warm-200/80 dark:bg-warm-800" />
                      </div>
                    )}
                    <div className={cn('flex gap-2', meta.mine ? 'justify-end' : 'justify-start')}>
                      {!meta.mine && otherUser && (
                        <div className="w-8 flex-shrink-0 flex flex-col justify-end pb-1">
                          {meta.showAvatar ? (
                            <Avatar
                              src={otherUser.profileImage ?? undefined}
                              name={otherUser.name}
                              size="xs"
                            />
                          ) : (
                            <span className="w-8" />
                          )}
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-[min(100%,520px)] px-3.5 py-2 shadow-sm',
                          meta.mine
                            ? 'bg-gradient-to-br from-primary to-primary/90 text-white rounded-2xl rounded-br-md'
                            : 'bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-100 rounded-2xl rounded-bl-md border border-warm-100 dark:border-warm-700',
                          meta.clusterBottom && 'mb-2'
                        )}
                      >
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                        <p
                          className={cn(
                            'text-[10px] mt-1 tabular-nums',
                            meta.mine ? 'text-white/65' : 'text-warm-400'
                          )}
                        >
                          {formatMessageTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <footer className="relative z-10 border-t border-warm-200/60 dark:border-warm-800 bg-white/95 dark:bg-warm-900/95 backdrop-blur-md px-3 sm:px-5 py-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <div className="max-w-3xl mx-auto flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                const el = e.target;
                el.style.height = '0';
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
              }}
              onKeyDown={onKeyDown}
              placeholder="Write a message…"
              className="flex-1 resize-none px-4 py-3 rounded-2xl text-sm text-warm-900 dark:text-warm-100 bg-warm-50 dark:bg-warm-800/80 border border-warm-200 dark:border-warm-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none min-h-[48px] max-h-[120px] placeholder:text-warm-400"
            />
            <button
              type="button"
              disabled={!messageText.trim() || sending}
              onClick={() => void handleSend()}
              className={cn(
                'flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all',
                messageText.trim() && !sending
                  ? 'gradient-primary text-white shadow-lg shadow-primary/25'
                  : 'bg-warm-100 dark:bg-warm-800 text-warm-400 cursor-not-allowed'
              )}
              aria-label="Send"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
