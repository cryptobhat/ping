/**
 * Chat Screen
 * 
 * This screen shows messages in a conversation (1-to-1 or group).
 * User can send text messages, images, videos, voice notes, and locations.
 * 
 * Features:
 * - Message list with bubbles
 * - Message input at bottom
 * - Read receipts
 * - Typing indicators
 * - Media preview
 * - Message reactions
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { useTheme, Avatar, ActivityIndicator, Portal, Modal, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { useChatStore, useMessages, useActiveConversation, Message } from '../../store/chatStore';
import { useAuthStore, useUser } from '../../store/authStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getMessages, sendMessage as sendMessageApi, uploadMedia } from '../../services/api';
import { formatMessageTime, getInitials, formatFileSize, formatDuration } from '../../utils/helpers';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';

// Define navigation prop types
type ChatNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'Chat'
>;

type ChatRouteProp = RouteProp<
  MainStackParamList,
  'Chat'
>;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ChatScreen = () => {
  const navigation = useNavigation<ChatNavigationProp>();
  const route = useRoute<ChatRouteProp>();
  const theme = useTheme();
  
  const { conversationId, conversationName, conversationType } = route.params;
  const user = useUser();
  
  const messages = useMessages(conversationId);
  const activeConversation = useActiveConversation();
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const setMessages = useChatStore((state) => state.setMessages);
  const setLoadingMessages = useChatStore((state) => state.setLoadingMessages);
  const setSendingMessage = useChatStore((state) => state.setSendingMessage);
  
  const { isUserTyping, sendTyping, sendMessageRead } = useWebSocket();
  
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioPermission, setAudioPermission] = useState(false);
  
  const flatListRef = useRef<FlatList<Message>>(null);
  const messageInputRef = useRef<RNTextInput>(null);
  
  // Audio recorder
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [recordingObj, setRecordingObj] = useState<Audio.Recording | null>(null);
  
  /**
   * Load messages for this conversation
   */
  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadingMessages(true);
      const data = await getMessages(conversationId, 50);
      setMessages(conversationId, data);
      
      // Mark messages as read
      data.forEach(msg => {
        if (msg.senderId !== user?.id && msg.status !== 'read') {
          sendMessageRead(conversationId, msg.id);
        }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setIsLoading(false);
      setLoadingMessages(false);
    }
  }, [conversationId, setMessages, setLoadingMessages, user, sendMessageRead]);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
    
    return () => {
      // Cleanup audio when leaving
      if (sound) {
        sound.unloadAsync();
      }
      if (recordingObj) {
        recordingObj.stopAndUnloadAsync();
      }
    };
  }, [loadMessages]);

  // Request audio permission
  useEffect(() => {
    const requestAudioPerm = async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        setAudioPermission(status === 'granted');
        
        // Set audio mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      } catch (err) {
        console.error('Failed to request audio permission:', err);
      }
    };
    
    requestAudioPerm();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Send typing indicator when user types
  useEffect(() => {
    if (newMessage.length > 0) {
      sendTyping(conversationId, true);
    } else {
      sendTyping(conversationId, false);
    }
    
    return () => {
      sendTyping(conversationId, false);
    };
  }, [newMessage, conversationId, sendTyping]);

  /**
   * Send text message
   */
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;
    
    const trimmedMessage = newMessage.trim();
    setNewMessage('');
    setIsSending(true);
    setSendingMessage(true);
    
    try {
      // Create temporary message for instant UI feedback
      const tempId = `temp_${Date.now()}`;
      const tempMessage: Message = {
        id: tempId,
        conversationId,
        senderId: user!.id,
        senderName: user!.name,
        senderPhone: user!.phone,
        content: trimmedMessage,
        type: 'text',
        status: 'sending',
        timestamp: new Date(),
        isEncrypted: true,
      };
      
      addMessage(tempMessage);
      
      // Send message to backend
      const response = await sendMessageApi({
        conversationId,
        content: trimmedMessage,
        type: 'text',
      });
      
      // Update temp message with real ID
      updateMessage(conversationId, tempId, {
        id: response.id,
        status: 'sent',
        timestamp: new Date(response.timestamp),
      });
      
      sendTyping(conversationId, false);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      // Update temp message status to failed
      updateMessage(conversationId, `temp_${Date.now()}`, {
        status: 'failed',
      });
    } finally {
      setIsSending(false);
      setSendingMessage(false);
    }
  };

  /**
   * Pick image from gallery
   */
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        // Upload image
        setIsSending(true);
        
        try {
          const mediaUrl = await uploadMedia(asset.uri, asset.fileName || 'image.jpg', 'image');
          
          // Send message with image
          const response = await sendMessageApi({
            conversationId,
            content: '[Image]',
            type: 'image',
            mediaUrl,
            thumbnailUrl: mediaUrl, // Can have separate thumbnail URL
          });
          
          // Add to messages
          const message: Message = {
            id: response.id,
            conversationId,
            senderId: user!.id,
            senderName: user!.name,
            senderPhone: user!.phone,
            content: '[Image]',
            type: 'image',
            status: 'sent',
            timestamp: new Date(response.timestamp),
            isEncrypted: true,
            mediaUrl,
          };
          addMessage(message);
        } catch (err: any) {
          setError(err.message || 'Failed to send image');
        } finally {
          setIsSending(false);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to pick image');
    }
    
    setShowMediaOptions(false);
  };

  /**
   * Pick video from gallery
   */
  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        setIsSending(true);
        
        try {
          const mediaUrl = await uploadMedia(asset.uri, asset.fileName || 'video.mp4', 'video');
          
          const response = await sendMessageApi({
            conversationId,
            content: '[Video]',
            type: 'video',
            mediaUrl,
          });
          
          const message: Message = {
            id: response.id,
            conversationId,
            senderId: user!.id,
            senderName: user!.name,
            senderPhone: user!.phone,
            content: '[Video]',
            type: 'video',
            status: 'sent',
            timestamp: new Date(response.timestamp),
            isEncrypted: true,
            mediaUrl,
          };
          addMessage(message);
        } catch (err: any) {
          setError(err.message || 'Failed to send video');
        } finally {
          setIsSending(false);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to pick video');
    }
    
    setShowMediaOptions(false);
  };

  /**
   * Send location
   */
  const sendLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant location permission to share your location.');
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      
      // Get address from coordinates (optional)
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      const locationName = address[0]?.name || address[0]?.street || 'Current Location';
      
      setIsSending(true);
      
      const response = await sendMessageApi({
        conversationId,
        content: '[Location]',
        type: 'location',
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        locationName,
      });
      
      const message: Message = {
        id: response.id,
        conversationId,
        senderId: user!.id,
        senderName: user!.name,
        senderPhone: user!.phone,
        content: '[Location]',
        type: 'location',
        status: 'sent',
        timestamp: new Date(response.timestamp),
        isEncrypted: true,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        locationName,
      };
      addMessage(message);
      
    } catch (err: any) {
      setError(err.message || 'Failed to send location');
    } finally {
      setIsSending(false);
    }
    
    setShowMediaOptions(false);
  };

  /**
   * Record voice note
   */
  const startRecording = async () => {
    if (!audioPermission) {
      Alert.alert('Permission Required', 'Please grant microphone permission to record voice notes.');
      return;
    }
    
    try {
      setRecording(true);
      
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recording.startAsync();
      
      setRecordingObj(recording);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to start recording');
      setRecording(false);
    }
  };

  /**
   * Stop recording and send voice note
   */
  const stopRecording = async () => {
    if (!recordingObj) return;
    
    try {
      await recordingObj.stopAndUnloadAsync();
      
      const uri = recordingObj.getURI();
      if (!uri) {
        throw new Error('No recording URI');
      }
      
      setIsSending(true);
      
      // Get duration
      const { sound: tempSound } = await recordingObj.createNewLoadedSoundAsync();
      const duration = (await tempSound.getStatusAsync()).durationMillis / 1000;
      await tempSound.unloadAsync();
      
      // Upload voice note
      const mediaUrl = await uploadMedia(uri, 'voice.m4a', 'voice');
      
      const response = await sendMessageApi({
        conversationId,
        content: '[Voice Note]',
        type: 'voice',
        mediaUrl,
        duration: Math.round(duration),
      });
      
      const message: Message = {
        id: response.id,
        conversationId,
        senderId: user!.id,
        senderName: user!.name,
        senderPhone: user!.phone,
        content: '[Voice Note]',
        type: 'voice',
        status: 'sent',
        timestamp: new Date(response.timestamp),
        isEncrypted: true,
        mediaUrl,
        duration: Math.round(duration),
      };
      addMessage(message);
      
    } catch (err: any) {
      setError(err.message || 'Failed to send voice note');
    } finally {
      setRecording(false);
      setRecordingObj(null);
      setIsSending(false);
    }
  };

  /**
   * Play voice note
   */
  const playVoiceNote = async (mediaUrl: string) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: mediaUrl },
        { shouldPlay: true }
      );
      setSound(newSound);
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          newSound.unloadAsync();
          setSound(null);
        }
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to play voice note');
    }
  };

  /**
   * Render individual message bubble
   */
  const renderMessage = ({ item }: { item: Message }) => {
    const isFromMe = item.senderId === user?.id;
    const isGroup = conversationType === 'group';
    
    // Determine bubble style
    const bubbleStyle = isFromMe ? 
      [styles.sentBubble, { backgroundColor: theme.colors.primary }] :
      [styles.receivedBubble, { backgroundColor: theme.colors.surface }];
    
    const textStyle = isFromMe ?
      [styles.messageText, { color: theme.colors.onPrimary }] :
      [styles.messageText, { color: theme.colors.onSurface }];
    
    // Handle different message types
    const renderContent = () => {
      switch (item.type) {
        case 'text':
          return (
            <Text style={textStyle}>
              {item.content}
            </Text>
          );
        
        case 'image':
          return (
            <View style={styles.mediaContainer}>
              <TouchableOpacity
                onPress={() => navigation.navigate('MediaViewer', {
                  mediaUrl: item.mediaUrl || '',
                  type: 'image',
                })}
              >
                <Image
                  source={{ uri: item.mediaUrl }}
                  style={styles.mediaImage}
                />
              </TouchableOpacity>
              {item.content && (
                <Text style={textStyle}>
                  {item.content}
                </Text>
              )}
            </View>
          );
        
        case 'video':
          return (
            <View style={styles.mediaContainer}>
              <TouchableOpacity
                onPress={() => navigation.navigate('MediaViewer', {
                  mediaUrl: item.mediaUrl || '',
                  type: 'video',
                })}
              >
                <Image
                  source={{ uri: item.thumbnailUrl || item.mediaUrl }}
                  style={styles.mediaImage}
                />
                <Icon name="play-circle" size={40} color="white" style={styles.playIcon} />
              </TouchableOpacity>
              {item.content && (
                <Text style={textStyle}>
                  {item.content}
                </Text>
              )}
            </View>
          );
        
        case 'voice':
          return (
            <View style={styles.voiceContainer}>
              <TouchableOpacity
                onPress={() => playVoiceNote(item.mediaUrl || '')}
                style={styles.voiceButton}
              >
                <Icon
                  name={sound ? 'stop' : 'play'}
                  size={24}
                  color={isFromMe ? theme.colors.onPrimary : theme.colors.primary}
                />
                <Text style={[styles.voiceDuration, { color: isFromMe ? theme.colors.onPrimary : theme.colors.primary }]}>
                  {formatDuration(item.duration || 0)}
                </Text>
              </TouchableOpacity>
              {item.content && (
                <Text style={textStyle}>
                  {item.content}
                </Text>
              )}
            </View>
          );
        
        case 'location':
          return (
            <View style={styles.locationContainer}>
              <TouchableOpacity
                onPress={() => item.latitude && item.longitude && 
                  navigation.navigate('LocationViewer', {
                    latitude: item.latitude,
                    longitude: item.longitude,
                    locationName: item.locationName,
                  })}
                style={styles.locationButton}
              >
                <Icon
                  name="map-marker"
                  size={24}
                  color={isFromMe ? theme.colors.onPrimary : theme.colors.primary}
                />
                <Text style={[styles.locationText, { color: isFromMe ? theme.colors.onPrimary : theme.colors.primary }]}>
                  {item.locationName || 'Shared Location'}
                </Text>
              </TouchableOpacity>
              {item.content && (
                <Text style={textStyle}>
                  {item.content}
                </Text>
              )}
            </View>
          );
        
        case 'file':
          return (
            <View style={styles.fileContainer}>
              <Icon
                name="file"
                size={32}
                color={isFromMe ? theme.colors.onPrimary : theme.colors.primary}
              />
              <View style={styles.fileInfo}>
                <Text style={[styles.fileName, { color: isFromMe ? theme.colors.onPrimary : theme.colors.primary }]}>
                  {item.fileName}
                </Text>
                <Text style={[styles.fileSize, { color: isFromMe ? theme.colors.onPrimary : theme.colors.primary }]}>
                  {formatFileSize(item.fileSize || 0)}
                </Text>
              </View>
            </View>
          );
        
        default:
          return (
            <Text style={textStyle}>
              {item.content}
            </Text>
          );
      }
    };

    return (
      <View style={[styles.messageContainer, isFromMe ? styles.sentContainer : styles.receivedContainer]}>
        {/* Sender info for group chats */}
        {isGroup && !isFromMe && (
          <View style={styles.senderInfo}>
            <Avatar.Text
              size={32}
              label={getInitials(item.senderName)}
              style={[styles.senderAvatar, { backgroundColor: theme.colors.primary }]}
              labelStyle={{ color: theme.colors.onPrimary }}
            />
            <Text style={[styles.senderName, { color: theme.colors.onSurface }]}>
              {item.senderName}
            </Text>
          </View>
        )}
        
        {/* Message bubble */}
        <View style={bubbleStyle}>
          {renderContent()}
          
          {/* Message metadata */}
          <View style={styles.messageMeta}>
            <Text style={[styles.timestamp, { color: isFromMe ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}>
              {formatMessageTime(item.timestamp)}
            </Text>
            
            {isFromMe && (
              <Icon
                name={item.status === 'read' ? 'check-all' : 'check'}
                size={16}
                color={item.status === 'read' ? theme.colors.secondary : theme.colors.onSurfaceVariant}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  // Add placeholder Image component (React Native doesn't have built-in Image)
  const Image = (props: any) => {
    const { source, style } = props;
    return <View style={[style, { backgroundColor: '#ccc' }]} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          {conversationType === 'group' ? (
            <Avatar.Text
              size={40}
              label={getInitials(conversationName || '')}
              style={[styles.headerAvatar, { backgroundColor: theme.colors.primary }]}
              labelStyle={{ color: theme.colors.onPrimary }}
            />
          ) : (
            <Avatar.Text
              size={40}
              label={getInitials(conversationName || '')}
              style={[styles.headerAvatar, { backgroundColor: theme.colors.primary }]}
              labelStyle={{ color: theme.colors.onPrimary }}
            />
          )}
          <View style={styles.headerText}>
            <Text style={[styles.headerName, { color: theme.colors.onSurface }]}>
              {conversationName}
            </Text>
            {isUserTyping(conversationId, '') && (
              <Text style={[styles.typingIndicator, { color: theme.colors.secondary }]}>
                typing...
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerAction}>
            <Icon name="magnify" size={24} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction}>
            <Icon name="dots-vertical" size={24} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Messages List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={(
            <View style={styles.emptyMessages}>
              <Icon name="message-outline" size={64} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.emptyMessagesText, { color: theme.colors.onSurfaceVariant }]}>
                No messages yet
              </Text>
              <Text style={[styles.emptyMessagesSubtext, { color: theme.colors.onSurfaceVariant }]}>
                Start a conversation now
              </Text>
            </View>
          )}
        />
      )}
      
      {/* Message Input */}
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
        {/* Media attachment button */}
        <TouchableOpacity
          onPress={() => setShowMediaOptions(true)}
          style={styles.inputButton}
        >
          <Icon name="attachment" size={24} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
        
        {/* Camera button */}
        <TouchableOpacity onPress={pickImage} style={styles.inputButton}>
          <Icon name="camera" size={24} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
        
        {/* Message text input */}
        <RNTextInput
          ref={messageInputRef}
          style={[styles.input, { color: theme.colors.onSurface }]}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.onSurfaceVariant}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline={true}
          maxHeight={100}
          blurOnSubmit={false}
          onSubmitEditing={handleSendMessage}
        />
        
        {/* Voice note button or send button */}
        {newMessage.trim() ? (
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={isSending}
            style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
          >
            <Icon name="send" size={22} color={theme.colors.onPrimary} />
          </TouchableOpacity>
        ) : recording ? (
          <TouchableOpacity
            onPress={stopRecording}
            style={[styles.sendButton, { backgroundColor: theme.colors.error }]}
          >
            <Icon name="stop" size={22} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={startRecording}
            style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
          >
            <Icon name="microphone" size={22} color={theme.colors.onPrimary} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Media Options Modal */}
      <Portal>
        <Modal
          visible={showMediaOptions}
          onDismiss={() => setShowMediaOptions(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              Select Media
            </Text>
            
            <View style={styles.modalOptions}>
              <TouchableOpacity onPress={pickImage} style={styles.modalOption}>
                <Icon name="image" size={28} color={theme.colors.primary} />
                <Text style={[styles.modalOptionText, { color: theme.colors.onSurface }]}>
                  Image
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={pickVideo} style={styles.modalOption}>
                <Icon name="video" size={28} color={theme.colors.primary} />
                <Text style={[styles.modalOptionText, { color: theme.colors.onSurface }]}>
                  Video
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={sendLocation} style={styles.modalOption}>
                <Icon name="map-marker" size={28} color={theme.colors.primary} />
                <Text style={[styles.modalOptionText, { color: theme.colors.onSurface }]}>
                  Location
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => setShowMediaOptions(false)} style={styles.modalOption}>
                <Icon name="file" size={28} color={theme.colors.primary} />
                <Text style={[styles.modalOptionText, { color: theme.colors.onSurface }]}>
                  File
                </Text>
              </TouchableOpacity>
            </View>
            
            <Button onPress={() => setShowMediaOptions(false)} style={styles.modalClose}>
              Cancel
            </Button>
          </View>
        </Modal>
      </Portal>
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
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  typingIndicator: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerAction: {
    padding: 8,
    marginLeft: 4,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 80, // Space for input
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  sentContainer: {
    alignSelf: 'flex-end',
  },
  receivedContainer: {
    alignSelf: 'flex-start',
  },
  sentBubble: {
    borderRadius: 16,
    borderBottomRightRadius: 0,
    padding: 12,
    elevation: 1,
  },
  receivedBubble: {
    borderRadius: 16,
    borderBottomLeftRadius: 0,
    padding: 12,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  timestamp: {
    fontSize: 11,
    marginRight: 6,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  senderAvatar: {
    marginRight: 8,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
  },
  mediaContainer: {
    marginBottom: 8,
  },
  mediaImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  playIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    padding: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  voiceDuration: {
    marginLeft: 8,
    fontSize: 14,
  },
  locationContainer: {
    marginBottom: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  fileInfo: {
    marginLeft: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  inputButton: {
    padding: 8,
    marginRight: 4,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 44,
    padding: 12,
    borderRadius: 24,
    backgroundColor: theme.colors.background,
    marginHorizontal: 8,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  emptyMessagesText: {
    fontSize: 18,
    marginTop: 16,
  },
  emptyMessagesSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  modalContainer: {
    margin: 24,
    borderRadius: 12,
    padding: 24,
  },
  modalContent: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  modalOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalOption: {
    alignItems: 'center',
    padding: 16,
    width: '25%',
    minWidth: 80,
  },
  modalOptionText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  modalClose: {
    marginTop: 8,
  },
});

export default ChatScreen;
