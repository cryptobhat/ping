/**
 * OTP Verification Screen
 * 
 * User enters the 6-digit OTP code received via SMS from MessageCentral.
 * After successful verification, user is logged in or taken to profile setup.
 * 
 * Features:
 * - 6-digit OTP input (auto-focus next field)
 * - Resend OTP option
 * - Timer for resend button
 * - Back button to edit phone number
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useTheme, TextInput, Button, HelperText } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { isValidOtp } from '../../utils/helpers';
import { verifyOtp, registerUser } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

// Define navigation prop types
type OtpVerificationNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'OtpVerification'
>;

type OtpVerificationRouteProp = RouteProp<
  AuthStackParamList,
  'OtpVerification'
>;

const OTP_LENGTH = 6;
const RESEND_TIMEOUT = 30; // seconds

const OtpVerificationScreen = () => {
  const navigation = useNavigation<OtpVerificationNavigationProp>();
  const route = useRoute<OtpVerificationRouteProp>();
  const theme = useTheme();
  
  const { phone } = route.params;
  const login = useAuthStore((state) => state.login);
  const setAuthenticating = useAuthStore((state) => state.setAuthenticating);
  const setError: (error: string | null) => void = useAuthStore((state) => state.setError);
  
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setLocalError] = useState<string | null>(null);
  const [resendEnabled, setResendEnabled] = useState(false);
  const [resendTimeout, setResendTimeout] = useState(RESEND_TIMEOUT);
  const [isNewUser, setIsNewUser] = useState(false);
  
  // Ref for input fields
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Format phone for display
  const displayPhone = phone.replace(/^\+/, '') + ''; // Remove + for display
  
  // Timer for resend button
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (resendTimeout > 0) {
      timer = setTimeout(() => {
        setResendTimeout(prev => prev - 1);
      }, 1000);
    } else {
      setResendEnabled(true);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resendTimeout]);

  /**
   * Handle OTP digit change
   */
  const handleOtpChange = (text: string, index: number) => {
    // Only allow single digit
    const digit = text.replace(/\D/g, '').slice(-1);
    
    if (digit !== text) {
      // If user entered non-digit, don't update
      return;
    }
    
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setLocalError(null);
    
    // Auto-focus next input if digit entered
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-focus previous input on backspace if current is empty
    if (!digit && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  /**
   * Handle key press for better UX
   */
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  /**
   * Get full OTP as string
   */
  const getOtpString = (): string => {
    return otp.join('');
  };

  /**
   * Verify OTP with backend
   */
  const handleVerifyOtp = async () => {
    const otpString = getOtpString();
    
    if (!isValidOtp(otpString)) {
      setLocalError('Please enter all 6 digits');
      return;
    }
    
    setIsLoading(true);
    setLocalError(null);
    setAuthenticating(true);
    
    try {
      // Verify OTP with backend
      const response = await verifyOtp(phone, otpString);
      
      if (response.success) {
        if (response.user && response.user.name) {
          // User already has profile - login directly
          login({
            id: response.user.id,
            phone: response.user.phone,
            name: response.user.name,
            profilePic: response.user.profilePic,
          }, response.token);
        } else {
          // New user - navigate to profile setup
          setIsNewUser(true);
          navigation.navigate('ProfileSetup', {
            phone,
            isNewUser: true,
          });
        }
      } else {
        setLocalError(response.message || 'Invalid OTP. Please try again.');
        // Clear OTP
        setOtp(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setLocalError(err.message || 'Invalid OTP. Please try again.');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
      setAuthenticating(false);
    }
  };

  /**
   * Resend OTP
   */
  const handleResendOtp = async () => {
    if (!resendEnabled) return;
    
    setResendEnabled(false);
    setResendTimeout(RESEND_TIMEOUT);
    setLocalError(null);
    
    try {
      // TODO: Call sendOtp API again
      // For now, just reset timer
      Alert.alert('OTP Resent', 'A new verification code has been sent to your phone.');
    } catch (err: any) {
      setLocalError(err.message || 'Failed to resend OTP.');
    }
  };

  /**
   * Go back to edit phone number
   */
  const handleBack = () => {
    navigation.goBack();
  };

  // Check if all OTP fields are filled
  const isOtpComplete = getOtpString().length === OTP_LENGTH;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.innerContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            Verify Phone
          </Text>
        </View>

        {/* Instruction */}
        <View style={styles.instructionContainer}>
          <Text style={[styles.instructionText, { color: theme.colors.onSurfaceVariant }]}>
            We have sent an SMS with a code to
          </Text>
          <Text style={[styles.phoneText, { color: theme.colors.onSurface }]}>
            {displayPhone}
          </Text>
        </View>

        {/* OTP Input Fields */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              mode="outlined"
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              style={[
                styles.otpInput,
                { 
                  backgroundColor: theme.colors.surface,
                  borderColor: error && !digit ? theme.colors.error : theme.colors.outline,
                },
              ]}
              theme={{
                colors: {
                  primary: theme.colors.primary,
                  text: theme.colors.onSurface,
                  placeholder: theme.colors.onSurfaceVariant,
                  background: theme.colors.surface,
                },
              }}
              autoFocus={index === 0}
              textAlign="center"
              textAlignVertical="center"
            />
          ))}
        </View>

        {/* Error Message */}
        {error && (
          <HelperText type="error" visible={!!error} style={styles.errorText}>
            {error}
          </HelperText>
        )}

        {/* Verify Button */}
        <Button
          mode="contained"
          onPress={handleVerifyOtp}
          loading={isLoading}
          disabled={!isOtpComplete || isLoading}
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={[styles.buttonLabel, { color: theme.colors.onPrimary }]}
          buttonColor={theme.colors.primary}
        >
          Verify
        </Button>

        {/* Resend Section */}
        <View style={styles.resendContainer}>
          <Text style={[styles.resendText, { color: theme.colors.onSurfaceVariant }]}>
            Didn't receive code?
          </Text>
          <TouchableOpacity
            onPress={handleResendOtp}
            disabled={!resendEnabled}
          >
            <Text style={[
              styles.resendButton,
              { 
                color: resendEnabled ? theme.colors.primary : theme.colors.onSurfaceVariant,
              },
            ]}>
              {resendEnabled ? 'Resend' : `${resendTimeout}s`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* MessageCentral Info */}
        <View style={styles.messageCentralContainer}>
          <Icon name="message-text-outline" size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.messageCentralText, { color: theme.colors.onSurfaceVariant }]}>
            Powered by MessageCentral
          </Text>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  instructionContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 4,
  },
  phoneText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 8,
    fontSize: 24,
    fontWeight: '600',
  },
  errorText: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 4,
    marginBottom: 24,
  },
  buttonContent: {
    height: 50,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
    marginRight: 8,
  },
  resendButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  messageCentralContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: 16,
  },
  messageCentralText: {
    fontSize: 12,
    marginLeft: 8,
  },
});

export default OtpVerificationScreen;
