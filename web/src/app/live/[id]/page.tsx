'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { liveApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import {
  Mic, MicOff, Radio, Users, ArrowLeft, Send, Volume2, VolumeX,
  BookOpen, Clock, Hand, X, UserMinus, Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Speaker {
  userId: string;
  userName: string;
  userImage?: string;
  isMuted: boolean;
  joinedAt: string;
}

interface HandRaiseRequest {
  userId: string;
  userName: string;
  userImage?: string;
  requestedAt: string;
}

interface LiveRoom {
  id: string;
  hostId: string;
  hostName: string;
  hostImage?: string;
  title: string;
  contentId?: string;
  contentTitle?: string;
  listenerCount: number;
  speakers: Speaker[];
  pendingRequests: HandRaiseRequest[];
  startedAt: string;
  isActive: boolean;
}

interface ChatMessage {
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

interface FloatingReaction {
  id: number;
  emoji: string;
}

const REACTION_EMOJIS = [
  { emoji: '\u2764\uFE0F', label: 'Love' },
  { emoji: '\uD83D\uDC4F', label: 'Clap' },
  { emoji: '\uD83D\uDD25', label: 'Fire' },
  { emoji: '\uD83D\uDE0D', label: 'Heart Eyes' },
];

export default function LiveRoomPage() {
  const { id: roomId } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [room, setRoom] = useState<LiveRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [ended, setEnded] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [muted, setMuted] = useState(false);
  const [listenerCount, setListenerCount] = useState(0);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [pendingRequests, setPendingRequests] = useState<HandRaiseRequest[]>([]);
  const [handRaised, setHandRaised] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [audioLevels, setAudioLevels] = useState<Record<string, number>>({});
  const [showHandRaises, setShowHandRaises] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const reactionIdRef = useRef(0);

  // Refs for audio playback (listener side)
  const playbackContextRef = useRef<AudioContext | null>(null);
  const audioQueuesRef = useRef<Map<string, ArrayBuffer[]>>(new Map());
  const playingRef = useRef<Set<string>>(new Set());

  // Load room details
  useEffect(() => {
    if (!roomId) return;
    (async () => {
      try {
        const res = await liveApi.getRoom(roomId as string);
        const roomData = res.data.data;
        setRoom(roomData);
        setListenerCount(roomData.listenerCount);
        setSpeakers(roomData.speakers || []);
        setPendingRequests(roomData.pendingRequests || []);
        setIsHost(user?.id === roomData.hostId);
        setIsSpeaker(
          (roomData.speakers || []).some((s: Speaker) => s.userId === user?.id)
        );
      } catch {
        setEnded(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [roomId, user?.id]);

  // Socket connection and event handlers
  useEffect(() => {
    if (!room || !isAuthenticated || ended) return;

    const socket = getSocket();
    if (!socket) return;

    if (isHost) {
      socket.emit('live:host', { roomId: room.id });
    } else {
      socket.emit('live:join', { roomId: room.id });
    }

    socket.on('live:listener_count', (data: { count: number }) => {
      setListenerCount(data.count);
    });

    socket.on('live:ended', () => {
      setEnded(true);
      stopStreaming();
      toast('The live reading has ended', { icon: '\uD83D\uDC4B' });
    });

    socket.on('live:reaction', (data: { emoji: string; userId: string }) => {
      const id = ++reactionIdRef.current;
      setReactions((prev) => [...prev, { id, emoji: data.emoji }]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id));
      }, 2000);
    });

    socket.on('live:chat', (data: ChatMessage) => {
      setChatMessages((prev) => [...prev.slice(-100), data]);
    });

    // Multi-speaker events
    socket.on('live:speakers_updated', (data: { speakers: Speaker[]; pendingRequests?: HandRaiseRequest[] }) => {
      setSpeakers(data.speakers);
      if (data.pendingRequests) setPendingRequests(data.pendingRequests);
      // Check if current user is now a speaker
      setIsSpeaker(data.speakers.some((s) => s.userId === user?.id));
    });

    socket.on('live:speaker-approved', (data: { roomId: string; speaker: Speaker }) => {
      setIsSpeaker(true);
      setHandRaised(false);
      toast.success('You are now a speaker! You can unmute to talk.');
      // Register as speaker
      socket.emit('live:speaker-ready', { roomId: room.id });
    });

    socket.on('live:speaker-removed', () => {
      setIsSpeaker(false);
      stopStreaming();
      toast('You were moved back to listener', { icon: '\uD83D\uDC4B' });
    });

    socket.on('live:you-were-muted', () => {
      if (audioStreamRef.current) {
        const track = audioStreamRef.current.getAudioTracks()[0];
        if (track) track.enabled = false;
      }
      setMuted(true);
      toast('The host muted your mic', { icon: '\uD83D\uDD07' });
    });

    socket.on('live:hand-raised', (data: { pendingRequests: HandRaiseRequest[] }) => {
      setPendingRequests(data.pendingRequests);
    });

    socket.on('live:hand-raise-ack', () => {
      setHandRaised(true);
      toast.success('Hand raised! Waiting for host to approve.');
    });

    socket.on('live:hand-denied', () => {
      setHandRaised(false);
      toast('Your request to speak was denied', { icon: '\uD83D\uDC4B' });
    });

    // Audio from any speaker
    socket.on('live:audio', (data: { chunk: ArrayBuffer; speakerId: string }) => {
      if (data.chunk && data.speakerId !== user?.id) {
        playAudioChunk(data.chunk, data.speakerId);
      }
    });

    return () => {
      if (!isHost) {
        socket.emit('live:leave', { roomId: room.id });
      }
      socket.off('live:listener_count');
      socket.off('live:ended');
      socket.off('live:reaction');
      socket.off('live:chat');
      socket.off('live:audio');
      socket.off('live:speakers_updated');
      socket.off('live:speaker-approved');
      socket.off('live:speaker-removed');
      socket.off('live:you-were-muted');
      socket.off('live:hand-raised');
      socket.off('live:hand-raise-ack');
      socket.off('live:hand-denied');
    };
  }, [room, isAuthenticated, isHost, ended]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // --- Speaker Audio Streaming (host or approved speakers) ---
  const startStreaming = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
          channelCount: 1,
        },
      });
      audioStreamRef.current = stream;

      // Audio analyzer for visualizer
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start visualizer loop
      const updateLevel = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
        const level = avg / 255;
        setAudioLevels((prev) => ({ ...prev, [user?.id || '']: level }));
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      // MediaRecorder for streaming
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && room) {
          const socket = getSocket();
          if (socket) {
            event.data.arrayBuffer().then((buffer) => {
              socket.emit('live:audio', { roomId: room.id, chunk: buffer });
            });
          }
        }
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setStreaming(true);

      if (isHost) {
        toast.success('You are now live!');
      } else {
        toast.success('Mic is on!');
      }
    } catch (err: any) {
      console.error('[Live] Mic error:', err);
      toast.error('Could not access microphone. Please check permissions.');
    }
  }, [room, user?.id, isHost]);

  const stopStreaming = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    analyserRef.current = null;
    setStreaming(false);
    setAudioLevels((prev) => {
      const next = { ...prev };
      delete next[user?.id || ''];
      return next;
    });
  }, [user?.id]);

  const toggleMute = useCallback(() => {
    if (audioStreamRef.current) {
      const track = audioStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setMuted(!track.enabled);
      }
    }
  }, []);

  const handleEndRoom = useCallback(async () => {
    if (!room) return;
    stopStreaming();
    try {
      await liveApi.endRoom(room.id);
      const socket = getSocket();
      if (socket) {
        socket.emit('live:end', { roomId: room.id });
      }
    } catch {
      // Room may already be ended
    }
    router.push('/live');
  }, [room, stopStreaming, router]);

  // --- Raise Hand ---
  const handleRaiseHand = useCallback(() => {
    if (!room || handRaised) return;
    const socket = getSocket();
    if (socket) {
      socket.emit('live:raise-hand', {
        roomId: room.id,
        userName: user?.name || 'Anonymous',
        userImage: user?.profileImage,
      });
    }
  }, [room, handRaised, user]);

  // --- Host: Approve/Deny/Remove/Mute ---
  const approveSpeaker = useCallback(
    (targetUserId: string) => {
      if (!room) return;
      const socket = getSocket();
      if (socket) {
        socket.emit('live:approve-speaker', { roomId: room.id, userId: targetUserId });
      }
    },
    [room]
  );

  const denyHandRaise = useCallback(
    (targetUserId: string) => {
      if (!room) return;
      const socket = getSocket();
      if (socket) {
        socket.emit('live:deny-hand', { roomId: room.id, userId: targetUserId });
      }
    },
    [room]
  );

  const removeSpeaker = useCallback(
    (targetUserId: string) => {
      if (!room) return;
      const socket = getSocket();
      if (socket) {
        socket.emit('live:remove-speaker', { roomId: room.id, userId: targetUserId });
      }
    },
    [room]
  );

  const muteSpeaker = useCallback(
    (targetUserId: string) => {
      if (!room) return;
      const socket = getSocket();
      if (socket) {
        socket.emit('live:mute-speaker', { roomId: room.id, userId: targetUserId });
      }
    },
    [room]
  );

  // --- Multi-speaker Audio Playback ---
  const playAudioChunk = useCallback(async (chunk: ArrayBuffer, speakerId: string) => {
    if (!audioQueuesRef.current.has(speakerId)) {
      audioQueuesRef.current.set(speakerId, []);
    }
    audioQueuesRef.current.get(speakerId)!.push(chunk);

    if (!playingRef.current.has(speakerId)) {
      playingRef.current.add(speakerId);
      processSpeakerQueue(speakerId);
    }
  }, []);

  const processSpeakerQueue = useCallback(async (speakerId: string) => {
    const queue = audioQueuesRef.current.get(speakerId);
    if (!queue) {
      playingRef.current.delete(speakerId);
      return;
    }

    while (queue.length > 0) {
      const chunk = queue.shift();
      if (!chunk) continue;

      try {
        const blob = new Blob([chunk], { type: 'audio/webm;codecs=opus' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.volume = muted ? 0 : 1;

        await new Promise<void>((resolve) => {
          audio.onended = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
          audio.play().catch(() => {
            URL.revokeObjectURL(url);
            resolve();
          });
        });
      } catch {
        // Skip bad chunks
      }
    }

    playingRef.current.delete(speakerId);
  }, [muted]);

  // --- Chat ---
  const sendChat = useCallback(() => {
    if (!chatInput.trim() || !room) return;
    const socket = getSocket();
    if (socket) {
      socket.emit('live:chat', {
        roomId: room.id,
        message: chatInput.trim(),
        userName: user?.name || 'Anonymous',
      });
    }
    setChatInput('');
  }, [chatInput, room, user?.name]);

  // --- Reactions ---
  const sendReaction = useCallback(
    (emoji: string) => {
      if (!room) return;
      const socket = getSocket();
      if (socket) {
        socket.emit('live:reaction', { roomId: room.id, emoji });
      }
    },
    [room]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
      if (playbackContextRef.current) {
        playbackContextRef.current.close();
      }
    };
  }, [stopStreaming]);

  const timeSince = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'Just started';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  // --- Loading ---
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="skeleton h-8 w-48 rounded-lg mb-4" />
        <div className="skeleton h-64 rounded-2xl mb-4" />
        <div className="skeleton h-48 rounded-2xl" />
      </div>
    );
  }

  // --- Ended / Not Found ---
  if (ended || !room) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-warm-100 dark:bg-warm-800 flex items-center justify-center mx-auto mb-6">
          <Radio className="w-10 h-10 text-warm-300 dark:text-warm-600" />
        </div>
        <h1 className="text-xl font-bold text-warm-900 dark:text-warm-100 mb-2">
          This live reading has ended
        </h1>
        <p className="text-warm-500 mb-6">
          The host has ended the session. Check out other live readings or come back later.
        </p>
        <Button variant="primary" onClick={() => router.push('/live')}>
          Browse Live Rooms
        </Button>
      </div>
    );
  }

  const canSpeak = isHost || isSpeaker;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/live')}
          className="p-2 hover:bg-warm-100 dark:hover:bg-warm-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-warm-600 dark:text-warm-400" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-warm-900 dark:text-warm-100 truncate">
              {room.title}
            </h1>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium flex-shrink-0">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              LIVE
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-warm-400 mt-0.5">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {listenerCount} listening
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {timeSince(room.startedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Mic className="w-3.5 h-3.5" />
              {speakers.length} speaker{speakers.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Host: Hand raise count badge */}
        {isHost && pendingRequests.length > 0 && (
          <button
            onClick={() => setShowHandRaises(!showHandRaises)}
            className="relative p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
          >
            <Hand className="w-5 h-5 text-amber-500" />
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
              {pendingRequests.length}
            </span>
          </button>
        )}
      </div>

      {/* Hand Raise Requests Panel (host only) */}
      {isHost && showHandRaises && pendingRequests.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
          <div className="flex items-center gap-2 mb-3">
            <Hand className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-warm-900 dark:text-warm-100">
              Raise hand requests ({pendingRequests.length})
            </h3>
          </div>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div key={req.userId} className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-warm-900">
                <Avatar src={req.userImage} name={req.userName} size="sm" />
                <span className="flex-1 text-sm font-medium text-warm-800 dark:text-warm-200">{req.userName}</span>
                <button
                  onClick={() => approveSpeaker(req.userId)}
                  className="px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => denyHandRaise(req.userId)}
                  className="px-3 py-1.5 rounded-lg bg-warm-200 dark:bg-warm-700 text-warm-600 dark:text-warm-300 text-xs font-medium hover:bg-warm-300 dark:hover:bg-warm-600 transition-colors"
                >
                  Deny
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Area */}
        <div className="lg:col-span-2 space-y-5">
          {/* Speaker Stage (Clubhouse-style) */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-warm-900 via-warm-800 to-warm-900 dark:from-warm-950 dark:via-warm-900 dark:to-warm-950 p-6 lg:p-8">
            {/* Floating Reactions */}
            <div className="absolute bottom-4 right-4 pointer-events-none">
              {reactions.map((r) => (
                <span
                  key={r.id}
                  className="absolute bottom-0 right-0 text-2xl animate-float-up"
                  style={{
                    animation: 'floatUp 2s ease-out forwards',
                    left: `${Math.random() * 60}px`,
                  }}
                >
                  {r.emoji}
                </span>
              ))}
            </div>

            {/* Speaker Avatars Row */}
            <div className="flex items-center justify-center gap-4 lg:gap-6 flex-wrap mb-6">
              {speakers.map((speaker) => {
                const level = audioLevels[speaker.userId] || 0;
                const speakerIsHost = speaker.userId === room.hostId;
                return (
                  <div key={speaker.userId} className="flex flex-col items-center gap-2 relative group">
                    {/* Audio ring indicator */}
                    <div className="relative">
                      <div
                        className={cn(
                          'absolute inset-0 rounded-full transition-all duration-150',
                          level > 0.05 && !speaker.isMuted && 'ring-4 ring-green-400/60'
                        )}
                        style={
                          level > 0.05 && !speaker.isMuted
                            ? {
                                transform: `scale(${1 + level * 0.25})`,
                                boxShadow: `0 0 ${level * 40}px ${level * 12}px rgba(74, 222, 128, ${level * 0.35})`,
                              }
                            : undefined
                        }
                      />
                      <Avatar
                        src={speaker.userImage}
                        name={speaker.userName}
                        size="lg"
                        border
                        className={cn(
                          'relative z-10',
                          speaker.isMuted && 'opacity-60'
                        )}
                      />
                      {/* Host crown */}
                      {speakerIsHost && (
                        <div className="absolute -top-2 -right-1 z-20 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow">
                          <Crown className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {/* Muted indicator */}
                      {speaker.isMuted && (
                        <div className="absolute -bottom-1 -right-1 z-20 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                          <MicOff className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-white/80 font-medium max-w-[80px] truncate text-center">
                      {speaker.userId === user?.id ? 'You' : speaker.userName}
                    </span>

                    {/* Host controls on hover (not for self) */}
                    {isHost && speaker.userId !== user?.id && (
                      <div className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-30">
                        <button
                          onClick={() => muteSpeaker(speaker.userId)}
                          className="w-6 h-6 rounded-full bg-yellow-500 text-white flex items-center justify-center hover:bg-yellow-600 transition-colors"
                          title="Mute speaker"
                        >
                          <MicOff className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeSpeaker(speaker.userId)}
                          className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                          title="Remove speaker"
                        >
                          <UserMinus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Room Title */}
            <div className="text-center mb-4">
              {room.contentTitle && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs mb-2">
                  <BookOpen className="w-3.5 h-3.5" />
                  Reading: {room.contentTitle}
                </div>
              )}
            </div>

            {/* Audio Visualizer Bars (when any speaker is active) */}
            {Object.values(audioLevels).some((l) => l > 0.02) && (
              <div className="flex items-end justify-center gap-1 h-10 mb-4">
                {Array.from({ length: 20 }).map((_, i) => {
                  const maxLevel = Math.max(...Object.values(audioLevels), 0);
                  return (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-green-400/80 transition-all duration-100"
                      style={{
                        height: `${Math.max(4, maxLevel * (20 + Math.sin(Date.now() / 200 + i) * 20))}px`,
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              {/* Host controls */}
              {isHost && (
                <>
                  {!streaming ? (
                    <Button
                      variant="primary"
                      onClick={startStreaming}
                      icon={<Mic className="w-4 h-4" />}
                      className="bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30"
                    >
                      Start Reading
                    </Button>
                  ) : (
                    <>
                      <button
                        onClick={toggleMute}
                        className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center transition-all',
                          muted
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        )}
                      >
                        {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={handleEndRoom}
                        className="px-5 py-2.5 rounded-full bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30"
                      >
                        End Reading
                      </button>
                    </>
                  )}
                </>
              )}

              {/* Speaker (non-host) controls */}
              {!isHost && isSpeaker && (
                <>
                  {!streaming ? (
                    <Button
                      variant="primary"
                      onClick={startStreaming}
                      icon={<Mic className="w-4 h-4" />}
                      className="bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30"
                    >
                      Unmute
                    </Button>
                  ) : (
                    <button
                      onClick={toggleMute}
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center transition-all',
                        muted
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      )}
                    >
                      {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                  )}
                </>
              )}

              {/* Listener controls: volume + raise hand */}
              {!isHost && !isSpeaker && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMuted(!muted)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
                      muted
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    )}
                  >
                    {muted ? (
                      <><VolumeX className="w-4 h-4" /> Muted</>
                    ) : (
                      <><Volume2 className="w-4 h-4" /> Listening</>
                    )}
                  </button>
                  {/* Raise Hand button */}
                  <button
                    onClick={handleRaiseHand}
                    disabled={handRaised}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
                      handRaised
                        ? 'bg-amber-500/20 text-amber-400 cursor-not-allowed'
                        : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                    )}
                  >
                    <Hand className="w-4 h-4" />
                    {handRaised ? 'Hand Raised' : 'Raise Hand'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Reaction Bar */}
          <div className="flex items-center justify-center gap-2">
            {REACTION_EMOJIS.map(({ emoji, label }) => (
              <button
                key={emoji}
                onClick={() => sendReaction(emoji)}
                className="w-12 h-12 rounded-full bg-warm-100 dark:bg-warm-800 hover:bg-warm-200 dark:hover:bg-warm-700 flex items-center justify-center text-xl transition-all hover:scale-110 active:scale-95"
                title={label}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Content Link */}
          {room.contentId && (
            <Link
              href={`/content/${room.contentId}`}
              className="block p-4 rounded-xl bg-warm-50 dark:bg-warm-800/50 border border-warm-100 dark:border-warm-800 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm text-warm-600 dark:text-warm-400">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="font-medium">Read the story: </span>
                <span className="text-primary truncate">{room.contentTitle}</span>
              </div>
            </Link>
          )}
        </div>

        {/* Chat Sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-white dark:bg-warm-900 border border-warm-100 dark:border-warm-800 flex flex-col h-[500px] lg:h-[600px]">
            <div className="px-4 py-3 border-b border-warm-100 dark:border-warm-800">
              <h3 className="font-semibold text-sm text-warm-900 dark:text-warm-100">
                Live Chat
              </h3>
            </div>

            {/* Messages */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide"
            >
              {chatMessages.length === 0 && (
                <p className="text-center text-xs text-warm-400 py-8">
                  No messages yet. Say something!
                </p>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className="text-sm">
                  <span
                    className={cn(
                      'font-medium',
                      msg.userId === room.hostId
                        ? 'text-red-500'
                        : speakers.some((s) => s.userId === msg.userId)
                          ? 'text-green-500'
                          : msg.userId === user?.id
                            ? 'text-primary'
                            : 'text-warm-600 dark:text-warm-400'
                    )}
                  >
                    {msg.userName}
                    {msg.userId === room.hostId && (
                      <span className="ml-1 text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-full">
                        HOST
                      </span>
                    )}
                    {msg.userId !== room.hostId && speakers.some((s) => s.userId === msg.userId) && (
                      <span className="ml-1 text-[10px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded-full">
                        SPEAKER
                      </span>
                    )}
                  </span>
                  <span className="text-warm-700 dark:text-warm-300 ml-1.5">{msg.message}</span>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            {isAuthenticated ? (
              <div className="p-3 border-t border-warm-100 dark:border-warm-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                    placeholder="Say something..."
                    className="flex-1 px-3 py-2 rounded-xl bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 text-sm text-warm-900 dark:text-warm-100 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    maxLength={300}
                  />
                  <button
                    onClick={sendChat}
                    disabled={!chatInput.trim()}
                    className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 border-t border-warm-100 dark:border-warm-800 text-center">
                <Link href="/login" className="text-primary text-sm font-medium hover:underline">
                  Sign in to chat
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS for floating reactions */}
      <style jsx>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-120px) scale(1.5);
          }
        }
      `}</style>
    </div>
  );
}
