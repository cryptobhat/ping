/**
 * Chat List Screen
 * 
 * This is the main screen showing all conversations (private chats and groups).
 * User can see their recent conversations and start new chats.
 * 
 * Features:
 * - List of conversations with last message preview
 * - Search functionality
 * - Floating action button to start new chat
 * - Unread message indicators
 * - Pull to refresh
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTheme, FAB, Searchbar, Avatar, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { useChatStore, Conversation, useConversations, useIsLoadingConversations } from '../../store/chatStore';
import { useAuthStore, useUser } from '../../store/authStore';
import { getConversations, createConversation } from '../../services/api';
import { formatMessageTime, getInitials, truncateText } from '../../utils/helpers';
import { useWebSocket } from '../../hooks/useWebSocket';

// Define navigation prop type
type ChatListNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'Home'
>;

const ChatListScreen = () => {
  const navigation = useNavigation<ChatListNavigationProp>();
  const theme = useTheme();
  const user = useUser();
  
  const conversations = useConversations();
  const isLoading = useIsLoadingConversations();
  const setConversations = useChatStore((state) => state.setConversations);
  const setLoadingConversations = useChatStore((state) => state.setLoadingConversations);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Initialize WebSocket connection
  useWebSocket();

  /**
   * Load conversations from backend
   */
  const loadConversations = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoadingConversations(true);
      const data = await getConversations();
      setConversations(data);
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [user, setConversations, setLoadingConversations]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  /**
   * Handle conversation press
   * Navigate to individual chat screen
   */
  const handleConversationPress = (conversation: Conversation) => {
    setActiveConversation(conversation.id);
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      conversationName: conversation.name,
      conversationType: conversation.type,
    });
  };

  /**
   * Handle new chat button press
   * For now, navigate to search users screen
   */
  const handleNewChat = () => {
    navigation.navigate('SearchUsers');
  };

  /**
   * Handle search
   */
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  /**
   * Render individual conversation item
   */
  const renderConversation = ({ item }: { item: Conversation }) => {
    // Check if this conversation matches search query
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.participants.some(p => 
                           p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.phone.includes(searchQuery)
                         );
    
    if (!matchesSearch && searchQuery) return null;
    
    // Get conversation avatar
    const otherParticipant = item.type === 'private' ? 
      item.participants.find(p => p.id !== user?.id) :
      null;
    
    const avatarUri = item.type === 'group' ?
      item.groupPic :
      otherParticipant?.profilePic;
    
    const initials = item.type === 'group' ?
      getInitials(item.name) :
      otherParticipant ? getInitials(otherParticipant.name) : '?';
    
    // Format last message preview
    const lastMessagePreview = item.lastMessage?.content || 
                              (item.type === 'group' ? 'New group' : 'New chat');
    
    // Check if message is from current user
    const isFromMe = item.lastMessage?.senderId === user?.id;
    
    return (
      <TouchableOpacity
        style={[styles.conversationItem, { backgroundColor: theme.colors.surface }]}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.8}
      >
        {/* Avatar */}
        {avatarUri ? (
          <Avatar.Image
            source={{ uri: avatarUri }}
            size={56}
            style={styles.avatar}
          />
        ) : (
          <Avatar.Text
            size={56}
            label={initials}
            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
            labelStyle={{ color: theme.colors.onPrimary }}
          />
        )}
        
        {/* Content */}
        <View style={styles.content}>
          {/* Top row - name and time */}
          <View style={styles.topRow}>
            <Text style={[styles.name, { color: theme.colors.onSurface }]}>
              {item.name}
            </Text>
            <Text style={[styles.time, { color: theme.colors.onSurfaceVariant }]}>
              {item.lastMessageTime && formatMessageTime(item.lastMessageTime)}
            </Text>
          </View>
          
          {/* Bottom row - message preview */}
          <View style={styles.bottomRow}>
            {isFromMe && (
              <Icon name="check-all" size={16} 
                color={item.lastMessage?.status === 'read' ? theme.colors.secondary : theme.colors.onSurfaceVariant}
              />
            )}
            <Text
              style={[styles.messagePreview, { color: theme.colors.onSurfaceVariant }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {isFromMe ? `You: ${truncateText(lastMessagePreview, 30)}` : truncateText(lastMessagePreview, 35)}
            </Text>
          </View>
        </View>
        
        {/* Unread count badge */}
        {item.unreadCount > 0 && (
          <View style={[styles.unreadBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.unreadText, { color: theme.colors.onPrimary }]}>
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  /**
   * Extract key for FlatList
   */
  const keyExtractor = (item: Conversation) => item.id;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          Chats
        </Text>
      </View>
      
      {/* Search Bar */}
      <Searchbar
        placeholder="Search chats"
        onChangeText={handleSearch}
        value={searchQuery}
        style={[styles.search, { backgroundColor: theme.colors.surface }]}
        iconColor={theme.colors.onSurfaceVariant}
        placeholderTextColor={theme.colors.onSurfaceVariant}
        inputStyle={{ color: theme.colors.onSurface }}
        theme={{
          colors: {
            primary: theme.colors.primary,
          },
        }}
      />
      
      {/* Conversation List */}
      {isLoading && Object.keys(conversations).length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            Loading conversations...
          </Text>
        </View>
      ) : (
        <FlatList
          data={Object.values(conversations)}
          renderItem={renderConversation}
          keyExtractor={keyExtractor}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={(
            <View style={styles.emptyContainer}>
              <Icon name="message-outline" size={64} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                No conversations yet
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
                Start a new chat by tapping the + button
              </Text>
            </View>
          )}
        />
      )}
      
      {/* Floating Action Button */}
      <FAB
        icon="message-plus"
        onPress={handleNewChat}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        size="medium"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  search: {
    margin: 16,
    borderRadius: 8,
    elevation: 0,
  },
  listContent: {
    paddingBottom: 80, // Space for FAB
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatar: {
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messagePreview: {
    fontSize: 14,
    marginLeft: 4,
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    borderRadius: 28,
  },
});

export default ChatListScreen;
