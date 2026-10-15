/**
 * Search Users Screen
 * 
 * User can search for other users by name or phone number to start a new chat.
 * 
 * Features:
 * - Search users from contacts or all users
 * - Start chat with selected user
 * - Shows user profile info
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useTheme, Searchbar, Avatar, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { useAuthStore, useUser } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { searchUsers, createConversation } from '../../services/api';
import { Contact } from '../../services/api';
import { getInitials } from '../../utils/helpers';

// Define navigation prop type
type SearchUsersNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'SearchUsers'
>;

const SearchUsersScreen = () => {
  const navigation = useNavigation<SearchUsersNavigationProp>();
  const theme = useTheme();
  const user = useUser();
  
  const setConversations = useChatStore((state) => state.addConversation);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Search for users
   */
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 1) {
      setUsers([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await searchUsers(query);
      // Filter out current user
      setUsers(results.filter(u => u.id !== user?.id));
    } catch (err: any) {
      setError(err.message || 'Failed to search users');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Start chat with user
   */
  const startChat = async (contact: Contact) => {
    try {
      // Check if conversation already exists
      // For simplicity, just create new conversation
      const conversation = await createConversation(contact.phone);
      
      // Add to store
      setActiveConversation(conversation.id);
      
      // Navigate to chat
      navigation.navigate('Chat', {
        conversationId: conversation.id,
        conversationName: contact.name,
        conversationType: 'private',
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to start chat');
    }
  };

  /**
   * Render user item
   */
  const renderUser = ({ item }: { item: Contact }) => {
    const initials = getInitials(item.name);
    
    return (
      <TouchableOpacity
        style={[styles.userItem, { backgroundColor: theme.colors.surface }]}
        onPress={() => startChat(item)}
        activeOpacity={0.8}
      >
        {/* Avatar */}
        {item.profilePic ? (
          <Avatar.Image
            source={{ uri: item.profilePic }}
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
        
        {/* Info */}
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.colors.onSurface }]}>
            {item.name}
          </Text>
          <Text style={[styles.userPhone, { color: theme.colors.onSurfaceVariant }]}>
            {item.phone}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Extract key for FlatList
   */
  const keyExtractor = (item: Contact) => item.id;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          New Chat
        </Text>
      </View>
      
      {/* Search Bar */}
      <Searchbar
        placeholder="Search users by name or phone number"
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
        autoFocus={true}
      />
      
      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        </View>
      )}
      
      {/* Users List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={(
            <View style={styles.emptyContainer}>
              {searchQuery.length > 0 ? (
                <>
                  <Icon name="account-search" size={48} color={theme.colors.onSurfaceVariant} />
                  <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                    No users found
                  </Text>
                  <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
                    Try searching with a different name or phone number
                  </Text>
                </>
              ) : (
                <>
                  <Icon name="magnify" size={48} color={theme.colors.onSurfaceVariant} />
                  <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                    Search for users
                  </Text>
                  <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
                    Type a name or phone number
                  </Text>
                </>
              )}
            </View>
          )}
        />
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
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  search: {
    margin: 16,
    borderRadius: 8,
    elevation: 0,
  },
  errorContainer: {
    padding: 16,
  },
  errorText: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatar: {
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  userPhone: {
    fontSize: 14,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default SearchUsersScreen;
