/**
 * Create Group Screen
 * 
 * User can create a new group by selecting participants from their contacts.
 * 
 * Features:
 * - Search and select contacts
 * - Set group name
 * - Set group profile picture
 * - Create group with selected participants
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme, TextInput, Button, Avatar, Searchbar, Checkbox } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { useAuthStore, useUser } from '../../store/authStore';
import { createGroup } from '../../services/api';
import { getInitials, isValidName } from '../../utils/helpers';
import { Contact, searchUsers } from '../../services/api';

// Define navigation prop type
type CreateGroupNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'CreateGroup'
>;

const CreateGroupScreen = () => {
  const navigation = useNavigation<CreateGroupNavigationProp>();
  const theme = useTheme();
  const user = useUser();
  
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Search for users/contacts
   */
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 1) {
      setContacts([]);
      return;
    }
    
    try {
      const results = await searchUsers(query);
      // Filter out current user
      setContacts(results.filter(c => c.id !== user?.id));
    } catch (err: any) {
      setError(err.message || 'Failed to search users');
    }
  };

  /**
   * Toggle contact selection
   */
  const toggleContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  /**
   * Check if contact is selected
   */
  const isSelected = (contactId: string): boolean => {
    return selectedContacts.has(contactId);
  };

  /**
   * Create new group
   */
  const handleCreateGroup = async () => {
    if (!isValidName(groupName)) {
      setError('Please enter a valid group name (2-50 characters, letters only)');
      return;
    }
    
    if (selectedContacts.size === 0) {
      setError('Please select at least one participant');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get phone numbers of selected contacts
      const participantPhones = Array.from(selectedContacts);
      
      // Create group
      const response = await createGroup({
        name: groupName.trim(),
        participantPhones,
      });
      
      if (response.success) {
        // Navigate to group chat
        navigation.replace('Chat', {
          conversationId: response.conversation.id,
          conversationName: response.conversation.name,
          conversationType: 'group',
        });
      } else {
        setError(response.message || 'Failed to create group');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Render contact item
   */
  const renderContact = ({ item }: { item: Contact }) => {
    const selected = isSelected(item.id);
    const initials = getInitials(item.name);
    
    return (
      <TouchableOpacity
        style={[styles.contactItem, { backgroundColor: theme.colors.surface }]}
        onPress={() => toggleContact(item.id)}
        activeOpacity={0.8}
      >
        {/* Avatar */}
        {item.profilePic ? (
          <Avatar.Image
            source={{ uri: item.profilePic }}
            size={48}
            style={styles.avatar}
          />
        ) : (
          <Avatar.Text
            size={48}
            label={initials}
            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
            labelStyle={{ color: theme.colors.onPrimary }}
          />
        )}
        
        {/* Info */}
        <View style={styles.contactInfo}>
          <Text style={[styles.contactName, { color: theme.colors.onSurface }]}>
            {item.name}
          </Text>
          <Text style={[styles.contactPhone, { color: theme.colors.onSurfaceVariant }]}>
            {item.phone}
          </Text>
        </View>
        
        {/* Checkbox */}
        <Checkbox.Android
          status={selected ? 'checked' : 'unchecked'}
          onPress={() => toggleContact(item.id)}
          color={theme.colors.primary}
        />
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
          New Group
        </Text>
        <TouchableOpacity
          onPress={handleCreateGroup}
          disabled={!groupName.trim() || selectedContacts.size === 0 || isLoading}
          style={styles.createButton}
        >
          <Text style={[styles.createButtonText, { 
            color: (!groupName.trim() || selectedContacts.size === 0 || isLoading) 
              ? theme.colors.onSurfaceVariant 
              : theme.colors.primary,
          }]}>
            Create
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Group Name Input */}
      <View style={[styles.groupNameContainer, { backgroundColor: theme.colors.surface }]}>
        <TextInput
          mode="outlined"
          label="Group Name"
          placeholder="Enter group name"
          value={groupName}
          onChangeText={(text) => {
            setGroupName(text);
            setError(null);
          }}
          maxLength={50}
          style={[styles.groupNameInput, { backgroundColor: theme.colors.surface }]}
          theme={{
            colors: {
              primary: theme.colors.primary,
              text: theme.colors.onSurface,
              placeholder: theme.colors.onSurfaceVariant,
              background: theme.colors.surface,
              outline: theme.colors.outline,
            },
          }}
        />
        
        {error && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        )}
      </View>
      
      {/* Selected Contacts */}
      {selectedContacts.size > 0 && (
        <View style={[styles.selectedContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.selectedTitle, { color: theme.colors.onSurfaceVariant }]}>
            Selected ({selectedContacts.size})
          </Text>
          <View style={styles.selectedList}>
            {Array.from(selectedContacts).map(contactId => {
              const contact = contacts.find(c => c.id === contactId);
              if (!contact) return null;
              
              return (
                <View key={contactId} style={styles.selectedItem}>
                  <Avatar.Text
                    size={32}
                    label={getInitials(contact.name)}
                    style={[styles.selectedAvatar, { backgroundColor: theme.colors.primary }]}
                    labelStyle={{ color: theme.colors.onPrimary, fontSize: 12 }}
                  />
                  <Text style={[styles.selectedName, { color: theme.colors.onSurface }]}>
                    {contact.name}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
      
      {/* Search Bar */}
      <Searchbar
        placeholder="Search contacts"
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
      
      {/* Contacts List */}
      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={(
          <View style={styles.emptyContainer}>
            {searchQuery.length > 0 ? (
              <>
                <Icon name="account-search" size={48} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                  No contacts found
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
                  Try searching with a different query
                </Text>
              </>
            ) : (
              <>
                <Icon name="account-plus" size={48} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                  Search for contacts
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
                  Type a name or phone number to find contacts
                </Text>
              </>
            )}
          </View>
        )}
      />
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
    flex: 1,
  },
  createButton: {
    padding: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  groupNameContainer: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  groupNameInput: {
    height: 48,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  selectedContainer: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedTitle: {
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  selectedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    padding: 6,
    borderRadius: 16,
  },
  selectedAvatar: {
    marginRight: 6,
  },
  selectedName: {
    fontSize: 12,
  },
  search: {
    margin: 16,
    borderRadius: 8,
    elevation: 0,
  },
  listContent: {
    paddingBottom: 24,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatar: {
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
  },
  contactPhone: {
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

export default CreateGroupScreen;
