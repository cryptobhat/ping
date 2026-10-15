/**
 * Profile Setup Screen
 * 
 * New users set up their profile after OTP verification.
 * They can enter their name and optionally add a profile picture.
 * 
 * Features:
 * - Name input with validation
 * - Profile picture picker
 * - Skip option for later
 * - Camera and gallery options for profile pic
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import { useTheme, TextInput, Button, HelperText, Avatar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { AuthStackParamList } from '../../navigation/types';
import { isValidName } from '../../utils/helpers';
import { registerUser, uploadProfilePic } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

// Define navigation prop types
type ProfileSetupNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'ProfileSetup'
>;

type ProfileSetupRouteProp = RouteProp<
  AuthStackParamList,
  'ProfileSetup'
>;

const ProfileSetupScreen = () => {
  const navigation = useNavigation<ProfileSetupNavigationProp>();
  const route = useRoute<ProfileSetupRouteProp>();
  const theme = useTheme();
  
  const { phone, isNewUser } = route.params;
  const login = useAuthStore((state) => state.login);
  const setAuthenticating = useAuthStore((state) => state.setAuthenticating);
  
  const [name, setName] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Request camera and storage permissions
   */
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const cameraPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      const storagePermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
      );
      
      return cameraPermission === PermissionsAndroid.RESULTS.GRANTED &&
             storagePermission === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  /**
   * Pick image from gallery
   */
  const pickImage = async () => {
    const permissionsGranted = await requestPermissions();
    if (!permissionsGranted) {
      Alert.alert(
        'Permission Required',
        'Please grant camera and storage permissions to pick profile picture.'
      );
      return;
    }
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setProfilePic(asset.uri);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to pick image.');
    }
  };

  /**
   * Take photo using camera
   */
  const takePhoto = async () => {
    const permissionsGranted = await requestPermissions();
    if (!permissionsGranted) {
      Alert.alert(
        'Permission Required',
        'Please grant camera permission to take photo.'
      );
      return;
    }
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setProfilePic(asset.uri);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to take photo.');
    }
  };

  /**
   * Handle profile setup
   * Creates user profile and logs them in
   */
  const handleSetupProfile = async () => {
    if (!isValidName(name)) {
      setError('Please enter a valid name (2-50 characters, letters only)');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setAuthenticating(true);
    
    try {
      // Upload profile picture if selected
      let profilePicUrl: string | undefined;
      
      if (profilePic) {
        try {
          profilePicUrl = await uploadProfilePic(profilePic, 'profile.jpg');
        } catch (err: any) {
          console.warn('Failed to upload profile pic, continuing without it:', err.message);
          // Continue without profile pic if upload fails
        }
      }
      
      // Register user
      const response = await registerUser({
        phone,
        name: name.trim(),
        profilePic: profilePicUrl,
      });
      
      if (response.success) {
        // Login user
        login({
          id: response.user.id,
          phone: response.user.phone,
          name: response.user.name,
          profilePic: response.user.profilePic,
        }, response.token);
      } else {
        setError(response.message || 'Failed to create profile.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create profile. Please try again.');
    } finally {
      setIsLoading(false);
      setAuthenticating(false);
    }
  };

  /**
   * Skip profile setup
   * Just register with phone number only
   */
  const handleSkip = async () => {
    setIsLoading(true);
    setAuthenticating(true);
    
    try {
      // Register with just phone number
      const response = await registerUser({
        phone,
        name: `User ${phone.slice(-4)}`, // Default name
      });
      
      if (response.success) {
        // Login user
        login({
          id: response.user.id,
          phone: response.user.phone,
          name: response.user.name,
          profilePic: response.user.profilePic,
        }, response.token);
      } else {
        setError(response.message || 'Failed to create profile.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create profile. Please try again.');
    } finally {
      setIsLoading(false);
      setAuthenticating(false);
    }
  };

  /**
   * Show image picker options
   */
  const showImagePickerOptions = () => {
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  /**
   * Remove profile picture
   */
  const removeProfilePic = () => {
    setProfilePic(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.innerContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            Set Up Profile
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            Let others know who you are
          </Text>
        </View>

        {/* Profile Picture */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={showImagePickerOptions}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.avatar} />
            ) : (
              <Avatar.Text
                size={120}
                label={name.slice(0, 2).toUpperCase() || '?'}
                style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
                labelStyle={{ color: theme.colors.onPrimary, fontSize: 40 }}
              />
            )}
            <View style={styles.avatarEdit}>
              <Icon name="camera" size={28} color={theme.colors.onPrimary} />
            </View>
          </TouchableOpacity>
          
          {profilePic && (
            <TouchableOpacity onPress={removeProfilePic} style={styles.removePicButton}>
              <Icon name="delete" size={20} color={theme.colors.error} />
              <Text style={[styles.removePicText, { color: theme.colors.error }]}>
                Remove
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Name Input */}
        <View style={styles.inputContainer}>
          <TextInput
            mode="outlined"
            label="Your Name"
            placeholder="Enter your name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError(null);
            }}
            maxLength={50}
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            theme={{
              colors: {
                primary: theme.colors.primary,
                text: theme.colors.onSurface,
                placeholder: theme.colors.onSurfaceVariant,
                background: theme.colors.surface,
                outline: theme.colors.outline,
              },
            }}
            left={
              <TextInput.Icon icon="account-outline" color={theme.colors.onSurfaceVariant} />
            }
          />
          
          <HelperText
            type="info"
            visible={true}
            style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}
          >
            This name will be visible to your contacts
          </HelperText>
          
          {error && (
            <HelperText type="error" visible={!!error} style={styles.errorText}>
              {error}
            </HelperText>
          )}
        </View>

        {/* Setup Button */}
        <Button
          mode="contained"
          onPress={handleSetupProfile}
          loading={isLoading}
          disabled={!name.trim() || isLoading}
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={[styles.buttonLabel, { color: theme.colors.onPrimary }]}
          buttonColor={theme.colors.primary}
        >
          Continue
        </Button>

        {/* Skip Button */}
        <TouchableOpacity onPress={handleSkip} disabled={isLoading}>
          <Text style={[styles.skipText, { color: theme.colors.onSurfaceVariant }]}>
            Skip for now
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  avatarEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  removePicText: {
    marginLeft: 8,
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    height: 56,
    borderRadius: 8,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    marginBottom: 8,
  },
  errorText: {
    marginTop: -8,
    marginBottom: 8,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 4,
    marginBottom: 16,
  },
  buttonContent: {
    height: 50,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  skipText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ProfileSetupScreen;
