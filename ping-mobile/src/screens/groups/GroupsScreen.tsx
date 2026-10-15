/**
 * Groups Screen
 * 
 * This screen shows all groups the user is part of.
 * User can create new groups, join groups via invite links, and manage existing groups.
 * 
 * Features:
 * - List of groups with member count
 * - Create new group button
 * - Join group via link
 * - Group management options
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Share,
} from 'react-native';
import { useTheme, FAB, Searchbar, Avatar, ActivityIndicator, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { useChatStore, useConversations, useIsLoadingConversations, Conversation } from '../../store/chatStore';
import { useAuthStore, useUser } from '../../store/authStore';
import { getConversations, createGroup as createGroupApi, getGroupInviteLink } from '../../services/api';
import { formatMessageTime, getInitials, truncateText } from '../../utils/helpers';
import Clipboard from 'expo-clipboard';

// Define navigation prop type
type GroupsNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'Groups'
>;

const GroupsScreen = () => {
  const navigation = useNavigation<GroupsNavigationProp>();
  const theme = useTheme();
  const user = useUser();
  
  const conversations = useConversations();
  const isLoading = useIsLoadingConversations();
  const setConversations = useChatStore((state) => state.setConversations);
  const setLoadingConversations = useChatStore((state) => state.setLoadingConversations);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showInviteOptions, setShowInviteOptions] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Conversation | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

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
   * Handle group press
   * Navigate to group chat
   */
  const handleGroupPress = (group: Conversation) => {
    setActiveConversation(group.id);
    navigation.navigate('Chat', {
      conversationId: group.id,
      conversationName: group.name,
      conversationType: group.type,
    });
  };

  /**
   * Handle create new group
   */
  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  /**
   * Handle join group via link
   */
  const handleJoinGroup = () => {
    Alert.prompt(
      'Join Group',
      'Enter group invite link',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async (link) => {
            try {
              // TODO: Call joinGroup API
              Alert.alert('Success', 'Joined group successfully!');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to join group');
            }
          },
        },
      ]
    );
  };

  /**
   * Generate invite link for a group
   */
  const generateInviteLink = async (group: Conversation) => {
    try {
      setSelectedGroup(group);
      setIsGeneratingLink(true);
      setShowInviteOptions(true);
      
      const response = await getGroupInviteLink(group.id);
      setInviteLink(response.link);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to generate invite link');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  /**
   * Copy invite link to clipboard
   */
  const copyInviteLink = async () => {
    if (!inviteLink) return;
    
    try {
      await Clipboard.setStringAsync(inviteLink);
      Alert.alert('Success', 'Invite link copied to clipboard!');
    } catch (err) {
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  /**
   * Share invite link
   */
  const shareInviteLink = async () => {
    if (!inviteLink) return;
    
    try {
      await Share.share({
        message: `Join my Ping group: ${inviteLink}`,
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to share link');
    }
  };

  /**
   * Handle group long press
   * Show options menu
   */
  const handleGroupLongPress = (group: Conversation) => {
    Alert.alert(
      group.name,
      'Group options',
      [
        {
          text: 'Share Invite Link',
          onPress: () => generateInviteLink(group),
        },
        {
          text: 'Group Info',
          onPress: () => {
            navigation.navigate('GroupInfo', { conversationId: group.id });
          },
        },
        {
          text: 'Leave Group',
          onPress: () => {
            Alert.alert(
              'Leave Group',
              `Are you sure you want to leave "${group.name}"?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Leave',
                  style: 'destructive',
                  onPress: () => {
                    // TODO: Call leaveGroup API
                    Alert.alert('Success', 'Left group successfully!');
                  },
                },
              ]
            );
          },
          style: 'destructive',
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  /**
   * Filter groups from conversations
   */
  const groups = Object.values(conversations).filter(c => c.type === 'group');

  /**
   * Render individual group item
   */
  const renderGroup = ({ item }: { item: Conversation }) => {
    // Check if this group matches search query
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.participants.some(p => 
                           p.name.toLowerCase().includes(searchQuery.toLowerCase())
                         );
    
    if (!matchesSearch && searchQuery) return null;
    
    // Get group avatar
    const avatarUri = item.groupPic;
    const initials = getInitials(item.name);
    
    // Format last message preview
    const lastMessagePreview = item.lastMessage?.content || 'New group';
    
    // Check if message is from current user
    const isFromMe = item.lastMessage?.senderId === user?.id;
    
    return (
      <TouchableOpacity
        style={[styles.groupItem, { backgroundColor: theme.colors.surface }]}
        onPress={() => handleGroupPress(item)}
        onLongPress={() => handleGroupLongPress(item)}
        activeOpacity={0.8}
        delayLongPress={500}
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
          
          {/* Bottom row - message preview and member count */}
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
              {isFromMe ? `You: ${truncateText(lastMessagePreview, 25)}` : truncateText(lastMessagePreview, 30)}
            </Text>
            
            <Text style={[styles.memberCount, { color: theme.colors.onSurfaceVariant }]}>
              {item.participants.length} members
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
          Groups
        </Text>
        
        <View style={styles.headerActions}>
          <Button
            onPress={handleJoinGroup}
            style={styles.joinButton}
            labelStyle={[styles.joinButtonLabel, { color: theme.colors.primary }]}
          >
            Join
          </Button>
        </View>
      </View>
      
      {/* Search Bar */}
      <Searchbar
        placeholder="Search groups"
        onChangeText={setSearchQuery}
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
      
      {/* Groups List */}
      {isLoading && groups.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            Loading groups...
          </Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroup}
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
              <Icon name="account-group-outline" size={64} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                No groups yet
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
                Create a new group by tapping the + button
              </Text>
            </View>
          )}
        />
      )}
      
      {/* Floating Action Button */}
      <FAB
        icon="account-group-plus"
        onPress={handleCreateGroup}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        size="medium"
      />
      
      {/* Invite Link Modal */}
      {showInviteOptions && selectedGroup && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              Share Invite Link
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              {selectedGroup.name}
            </Text>
            
            {isGeneratingLink ? (
              <ActivityIndicator size="large" color={theme.colors.primary} />
            ) : inviteLink ? (
              <View style={styles.inviteLinkContainer}>
                <Text
                  style={[styles.inviteLink, { color: theme.colors.onSurface }]}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {inviteLink}
                </Text>
                
                <View style={styles.inviteActions}>
                  <Button
                    onPress={copyInviteLink}
                    style={styles.inviteButton}
                    icon="content-copy"
                  >
                    Copy
                  </Button>
                  <Button
                    onPress={shareInviteLink}
                    style={styles.inviteButton}
                    icon="share"
                  >
                    Share
                  </Button>
                </View>
              </View>
            ) : null}
            
            <Button
              onPress={() => {
                setShowInviteOptions(false);
                setInviteLink('');
                setSelectedGroup(null);
              }}
              style={styles.modalClose}
            >
              Close
            </Button>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
  },
  joinButton: {
    marginLeft: 8,
  },
  joinButtonLabel: {
    fontSize: 14,
  },
  search: {
    margin: 16,
    borderRadius: 8,
    elevation: 0,
  },
  listContent: {
    paddingBottom: 80, // Space for FAB
  },
  groupItem: {
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
    flex: 1,
  },
  memberCount: {
    fontSize: 12,
    marginLeft: 8,
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    borderRadius: 12,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  inviteLinkContainer: {
    marginBottom: 24,
  },
  inviteLink: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  inviteActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  inviteButton: {
    marginHorizontal: 8,
  },
  modalClose: {
    marginTop: 8,
  },
});

export default GroupsScreen;
