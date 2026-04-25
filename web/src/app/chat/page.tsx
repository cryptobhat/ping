'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { chatApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import {
  MessageCircle,
  Search,
  Plus,
  Send,
  Loader2,
  Sparkles,
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

export default function ChatPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [isWide, setIsWide] = useState(true);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => setIsWide(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) {
      setListLoading(false);
      return;
    }
    setListLoading(true);
    try {
      const { data } = await chatApi.getConversations();
      const body = data as { data?: ChatConversation[] };
      const list = body?.data ?? [];
      setConversations(Array.isArray(list) ? list : []);
    } catch {
      setConversations([]);
      toast.error('Could not load conversations');
    } finally {
      setListLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading) loadConversations();
  }, [authLoading, loadConversations]);

  const loadMessages = useCallback(
    async (conversationId: string) => {
      if (!isAuthenticated) return;
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
    },
    [isAuthenticated]
  );

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, msgLoading]);

  const filteredConvos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const other = getOtherParticipant(c, user?.id);
      const name = (other?.name || '').toLowerCase();
      const un = (other?.username || '').toLowerCase();
      return name.includes(q) || un.includes(q);
    });
  }, [conversations, searchQuery, user?.id]);

  const selectedConvo = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  const otherUser = selectedConvo ? getOtherParticipant(selectedConvo, user?.id) : null;

  const handleSelectConvo = (id: string) => {
    if (!isWide) {
      router.push(`/chat/${id}`);
      return;
    }
    setSelectedId(id);
  };

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text || !selectedId || sending) return;
    setSending(true);
    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      content: text,
      senderId: user!.id,
      createdAt: new Date().toISOString(),
      sender: user
        ? { id: user.id, username: user.username, name: user.name, profileImage: user.profileImage }
        : undefined,
    };
    setMessages((prev) => [...prev, optimistic]);
    setMessageText('');
    try {
      const { data } = await chatApi.sendMessage(selectedId, { content: text, messageType: 'TEXT' });
      const sent = (data as { data?: ChatMessage })?.data ?? (data as unknown as ChatMessage);
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
      <div className="flex h-[calc(100dvh-3.5rem-5rem)] lg:h-[calc(100dvh-4rem)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-warm-900 dark:text-warm-50 mb-2">Sign in to message</h1>
        <p className="text-sm text-warm-500 mb-6">Chat with writers and readers after you log in.</p>
        <Button variant="primary" onClick={() => router.push('/login?next=/chat')}>
          Go to login
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem-5rem)] lg:h-[calc(100dvh-4.5rem)] overflow-hidden rounded-2xl lg:rounded-none border border-warm-100 dark:border-warm-800 lg:border-0 -mx-4 lg:mx-0">
      {/* Conversation list */}
      <div
        className={cn(
          'w-full lg:w-[min(100%,380px)] xl:w-[400px] flex-shrink-0 flex flex-col bg-white dark:bg-warm-950',
          'border-r border-warm-100 dark:border-warm-800',
          selectedId && !isWide && 'max-lg:hidden'
        )}
      >
        <div className="px-4 pt-4 pb-3 border-b border-warm-100/80 dark:border-warm-800/80 bg-gradient-to-b from-warm-50/80 to-transparent dark:from-warm-900/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                <MessageCircle className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-warm-900 dark:text-warm-50 leading-tight">Messages</h1>
                <p className="text-[11px] text-warm-500">Readers & writers you’ve chatted with</p>
              </div>
            </div>
            <Link
              href="/discover"
              className="p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
              title="Find people to message"
            >
              <Plus className="w-5 h-5" />
            </Link>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-warm-900/90 border border-warm-200/80 dark:border-warm-700 rounded-xl shadow-sm">
            <Search className="w-4 h-4 text-warm-400 flex-shrink-0" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name…"
              className="flex-1 bg-transparent text-sm outline-none text-warm-900 dark:text-warm-100 placeholder:text-warm-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {listLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-warm-200 dark:bg-warm-800" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 w-1/3 bg-warm-200 dark:bg-warm-800 rounded" />
                    <div className="h-2 w-full bg-warm-100 dark:bg-warm-800 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConvos.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title={searchQuery ? 'No matches' : 'No conversations yet'}
              description={
                searchQuery
                  ? 'Try another name or clear search.'
                  : 'Follow writers from Discover and open their profile to start a chat.'
              }
            />
          ) : (
            <ul className="py-2 px-2 space-y-0.5">
              {filteredConvos.map((conv) => {
                const other = getOtherParticipant(conv, user?.id);
                const last = conv.messages?.[0];
                const unread =
                  last && last.senderId !== user?.id && last.isRead === false;
                const active = selectedId === conv.id && isWide;
                return (
                  <li key={conv.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectConvo(conv.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-all duration-200',
                        active
                          ? 'bg-primary/[0.12] ring-1 ring-primary/20 shadow-sm'
                          : 'hover:bg-warm-50 dark:hover:bg-warm-900/80',
                        unread && !active && 'bg-primary/[0.04]'
                      )}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar src={other?.profileImage ?? undefined} name={other?.name || 'User'} size="md" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            className={cn(
                              'text-sm truncate',
                              unread ? 'font-bold text-warm-900 dark:text-warm-50' : 'font-semibold text-warm-800 dark:text-warm-200'
                            )}
                          >
                            {other?.name || 'Conversation'}
                          </span>
                          {last && (
                            <span className="text-[10px] text-warm-400 tabular-nums flex-shrink-0">
                              {formatChatListTime(last.createdAt)}
                            </span>
                          )}
                        </div>
                        <p
                          className={cn(
                            'text-xs truncate mt-0.5',
                            unread ? 'text-warm-700 dark:text-warm-300 font-medium' : 'text-warm-500'
                          )}
                        >
                          {last?.content || 'No messages yet'}
                        </p>
                      </div>
                      {unread && (
                        <span className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 ring-4 ring-primary/15" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Thread */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 bg-[#FAF8F5] dark:bg-warm-950 relative',
          !selectedId && !isWide && 'max-lg:hidden'
        )}
      >
        {/* subtle pattern */}
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.12] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2378716c' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {selectedConvo && otherUser ? (
          <>
            <header className="relative z-10 flex items-center gap-3 px-4 lg:px-5 py-3 border-b border-warm-200/60 dark:border-warm-800 bg-white/90 dark:bg-warm-900/95 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="p-2 hover:bg-warm-100 dark:hover:bg-warm-800 rounded-xl lg:hidden"
                aria-label="Back to list"
              >
                <svg className="w-5 h-5 text-warm-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <Link href={`/user/${otherUser.username}`} className="flex items-center gap-3 flex-1 min-w-0 group">
                <Avatar src={otherUser.profileImage ?? undefined} name={otherUser.name} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-warm-900 dark:text-warm-100 truncate group-hover:text-primary transition-colors">
                    {otherUser.name}
                  </p>
                  <p className="text-[11px] text-warm-500 truncate">@{otherUser.username}</p>
                </div>
              </Link>
            </header>

            <div className="relative z-10 flex-1 overflow-y-auto px-3 sm:px-6 py-4">
              {msgLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <p className="text-sm text-warm-500">No messages here yet. Say hello!</p>
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
                          {!meta.mine && (
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
                              meta.clusterTop && !meta.mine && 'mt-1',
                              !meta.clusterBottom && (meta.mine ? 'rounded-br-lg' : 'rounded-bl-lg'),
                              meta.clusterBottom && meta.mine && 'mb-2',
                              meta.clusterBottom && !meta.mine && 'mb-2'
                            )}
                          >
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
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

            <footer className="relative z-10 border-t border-warm-200/60 dark:border-warm-800 bg-white/95 dark:bg-warm-900/95 backdrop-blur-md px-3 sm:px-5 py-3">
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
                  className="flex-1 resize-none px-4 py-3 rounded-2xl text-sm text-warm-900 dark:text-warm-100 bg-warm-50 dark:bg-warm-800/80 border border-warm-200 dark:border-warm-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow min-h-[48px] max-h-[120px] placeholder:text-warm-400"
                />
                <button
                  type="button"
                  disabled={!messageText.trim() || sending}
                  onClick={() => void handleSend()}
                  className={cn(
                    'flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all',
                    messageText.trim() && !sending
                      ? 'gradient-primary text-white shadow-lg shadow-primary/25 hover:opacity-95 active:scale-[0.98]'
                      : 'bg-warm-100 dark:bg-warm-800 text-warm-400 cursor-not-allowed'
                  )}
                  aria-label="Send"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-[10px] text-warm-400 text-center mt-2 hidden sm:block">
                Press <kbd className="px-1 py-0.5 rounded bg-warm-100 dark:bg-warm-800 text-[10px]">Enter</kbd> to send ·{' '}
                <kbd className="px-1 py-0.5 rounded bg-warm-100 dark:bg-warm-800 text-[10px]">Shift+Enter</kbd> for new line
              </p>
            </footer>
          </>
        ) : (
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center mb-5 shadow-inner">
              <MessageCircle className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-warm-900 dark:text-warm-50 mb-2">Your messages</h2>
            <p className="text-sm text-warm-500 max-w-sm mb-6">
              {isWide
                ? 'Pick a conversation on the left, or discover writers to start something new.'
                : 'Open a chat from the list, or find people in Discover.'}
            </p>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              <Sparkles className="w-4 h-4" />
              Browse Discover
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
