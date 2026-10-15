/**
 * Settings Screen
 * 
 * This screen provides access to user settings and account management.
 * User can update their profile, manage privacy, and perform account actions.
 * 
 * Features:
 * - Profile section with photo and name
 * - Privacy settings
 * - Account management (logout, delete account)
 * - App information
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { useTheme, Avatar, Button, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { useAuthStore, useUser, useIsAuthenticated } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { logout, deleteAccount, updateProfile, updatePresence, setLastSeenPrivacy } from '../../services/api';
import { getInitials } from '../../utils/helpers';
import * as ImagePicker from 'expo-image-picker';
import { uploadProfilePic } from '../../services/api';

// Define navigation prop type
type SettingsNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'Settings'
>;

const SettingsScreen = () => {
  const navigation = useNavigation<SettingsNavigationProp>();
  const theme = useTheme();
  
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const logoutUser = useAuthStore((state) => state.logout);
  const updateUserProfile = useAuthStore((state) => state.updateProfile);
  const clearChat = useChatStore((state) => state.clearChat);
  
  const [isLoading, setIsLoading] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [lastSeenPrivacy, setLastSeenPrivacyState] = useState<'everyone' | 'contacts' | 'nobody'>('everyone');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              // Call logout API
              await logout();
              
              // Clear local state
              logoutUser();
              clearChat();
            } catch (err: any) {
              console.error('Logout error:', err);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  /**
   * Handle delete account
   */
  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and you will lose all your data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await deleteAccount();
              logoutUser();
              clearChat();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete account');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  /**
   * Handle profile edit
   */
  const handleEditProfile = () => {
    navigation.navigate('Profile');
  };

  /**
   * Handle privacy settings
   */
  const handleLastSeenPrivacy = async (value: 'everyone' | 'contacts' | 'nobody') => {
    try {
      await setLastSeenPrivacy(value);
      setLastSeenPrivacyState(value);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update privacy settings');
    }
  };

  /**
   * Handle online status toggle
   */
  const handleOnlineStatusToggle = async (value: boolean) => {
    try {
      await updatePresence(value);
      setOnlineStatus(value);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update presence');
    }
  };

  /**
   * Handle notifications toggle
   */
  const handleNotificationsToggle = (value: boolean) => {
    setNotificationsEnabled(value);
    // TODO: Call API to update notification settings
  };

  /**
   * Render settings item
   */
  const renderSettingsItem = (
    icon: string,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    showChevron: boolean = true
  ) => {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.settingsItem, { backgroundColor: theme.colors.surface }]}
        activeOpacity={0.8}
      >
        <View style={styles.itemIcon}>
          <Icon name={icon} size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, { color: theme.colors.onSurface }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.itemSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              {subtitle}
            </Text>
          )}
        </View>
        {showChevron && (
          <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
        )}
      </TouchableOpacity>
    );
  };

  /**
   * Render switch settings item
   */
  const renderSwitchItem = (
    icon: string,
    title: string,
    subtitle: string,
    value: boolean,
    onValueChange: (value: boolean) => void
  ) => {
    return (
      <View style={[styles.settingsItem, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.itemIcon}>
          <Icon name={icon} size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, { color: theme.colors.onSurface }]}>
            {title}
          </Text>
          <Text style={[styles.itemSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            {subtitle}
          </Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ true: theme.colors.primary, false: theme.colors.onSurfaceVariant }}
          thumbColor={value ? theme.colors.primary : theme.colors.onSurfaceVariant}
        />
      </View>
    );
  };

  if (!isAuthenticated) {
    // Redirect to login
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            Settings
          </Text>
        </View>
        
        {/* Profile Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
            Profile
          </Text>
          
          <TouchableOpacity
            onPress={handleEditProfile}
            style={styles.profileContainer}
          >
            <View style={styles.profileInfo}>
              <Avatar.Text
                size={64}
                label={user ? getInitials(user.name) : '?'}
                style={[styles.profileAvatar, { backgroundColor: theme.colors.primary }]}
                labelStyle={{ color: theme.colors.onPrimary, fontSize: 24 }}
              />
              <View style={styles.profileText}>
                <Text style={[styles.profileName, { color: theme.colors.onSurface }]}>
                  {user?.name || 'User'}
                </Text>
                <Text style={[styles.profilePhone, { color: theme.colors.onSurfaceVariant }]}>
                  {user?.phone}
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
        
        <Divider style={[styles.divider, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />
        
        {/* Privacy Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
            Privacy
          </Text>
          
          {renderSwitchItem(
            'eye-outline',
            'Last Seen',
            lastSeenPrivacy === 'everyone' ? 'Everyone' : 
            lastSeenPrivacy === 'contacts' ? 'My contacts' : 'Nobody',
            false,
            (value) => {
              const newPrivacy: 'everyone' | 'contacts' | 'nobody' = value ? 'everyone' : 'nobody';
              handleLastSeenPrivacy(newPrivacy);
            }
          )}
          
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Last Seen Privacy',
                'Choose who can see your last seen status',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Everyone',
                    onPress: () => handleLastSeenPrivacy('everyone'),
                  },
                  {
                    text: 'My contacts',
                    onPress: () => handleLastSeenPrivacy('contacts'),
                  },
                  {
                    text: 'Nobody',
                    onPress: () => handleLastSeenPrivacy('nobody'),
                  },
                ]
              );
            }}
            style={[styles.settingsItem, { backgroundColor: theme.colors.surface }]}
          >
            <View style={styles.itemIcon}>
              <Icon name="eye-settings-outline" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemTitle, { color: theme.colors.onSurface }]}>
                Last Seen
              </Text>
              <Text style={[styles.itemSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                {lastSeenPrivacy === 'everyone' ? 'Everyone' : 
                 lastSeenPrivacy === 'contacts' ? 'My contacts' : 'Nobody'}
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
          
          {renderSwitchItem(
            'shield-outline',
            'Read Receipts',
            'Show blue ticks when others read your messages',
            true,
            (value) => {}
          )}
          
          {renderSwitchItem(
            'incognito',
            'Online Status',
            onlineStatus ? 'Visible to all' : 'Hidden',
            onlineStatus,
            handleOnlineStatusToggle
          )}
        </View>
        
        <Divider style={[styles.divider, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />
        
        {/* Notifications Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
            Notifications
          </Text>
          
          {renderSwitchItem(
            'bell-outline',
            'Push Notifications',
            'Receive notifications for new messages',
            notificationsEnabled,
            handleNotificationsToggle
          )}
          
          {renderSettingsItem(
            'volume-high',
            'Notification Sound',
            'Default',
            () => {},
            true
          )}
        </View>
        
        <Divider style={[styles.divider, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />
        
        {/* Help & Support Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
            Help & Support
          </Text>
          
          {renderSettingsItem(
            'help-circle-outline',
            'Help Center',
            undefined,
            () => {},
            true
          )}
          
          {renderSettingsItem(
            'information-outline',
            'About Ping',
            undefined,
            () => {
              Alert.alert(
                'About Ping',
                'Ping is a fast, private messaging app that keeps your conversations secure and encrypted.'
              );
            },
            true
          )}
          
          {renderSettingsItem(
            'shield-check-outline',
            'Privacy Policy',
            undefined,
            () => {},
            true
          )}
        </View>
        
        <Divider style={[styles.divider, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />
        
        {/* Account Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
            Account
          </Text>
          
          {renderSettingsItem(
            'key-outline',
            'Change Number',
            undefined,
            () => {},
            true
          )}
          
          {renderSettingsItem(
            'backup-restore',
            'Chat Backup',
            undefined,
            () => {},
            true
          )}
          
          {renderSettingsItem(
            'exit-to-app',
            'Logout',
            undefined,
            handleLogout,
            false,
            false
          )}
          
          <TouchableOpacity
            onPress={handleDeleteAccount}
            style={[styles.settingsItem, { backgroundColor: theme.colors.surface }]}
          >
            <View style={styles.itemIcon}>
              <Icon name="delete-outline" size={24} color={theme.colors.error} />
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemTitle, { color: theme.colors.error }]}>
                Delete Account
              </Text>
              <Text style={[styles.itemSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                Permanently delete your account and all data
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Version */}
        <View style={[styles.versionContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.versionText, { color: theme.colors.onSurfaceVariant }]}>
            Ping v1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
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
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    padding: 16,
    paddingBottom: 8,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(106, 90, 205, 0.1)',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  profileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    marginRight: 16,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
  },
  profilePhone: {
    fontSize: 14,
    marginTop: 2,
  },
  versionContainer: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  versionText: {
    fontSize: 12,
  },
});

export default SettingsScreen;
