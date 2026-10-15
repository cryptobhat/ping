/**
 * Phone Input Screen
 * 
 * This is the first screen users see when they open the app.
 * User enters their phone number to receive OTP for login.
 * 
 * Features:
 * - Phone number input with validation
 * - Country code selector (for now, just +91 for India)
 * - Continue button that validates input and sends OTP
 * - Clean, modern UI matching WhatsApp style
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme, TextInput, Button, HelperText } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { isValidPhoneNumber } from '../../utils/helpers';
import { sendOtp } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

// Define navigation prop type
type PhoneInputNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'PhoneInput'
>;

const PhoneInputScreen = () => {
  const navigation = useNavigation<PhoneInputNavigationProp>();
  const theme = useTheme();
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuthenticating = useAuthStore((state) => state.setAuthenticating);
  const setError: (error: string | null) => void = useAuthStore((state) => state.setError);

  // Validate phone number
  const isValid = isValidPhoneNumber(`${countryCode}${phone}`);

  /**
   * Handle sending OTP
   * Validates phone number and sends OTP via MessageCentral
   */
  const handleSendOtp = async () => {
    if (!isValid) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Format phone number with country code
      const fullPhone = `${countryCode}${phone}`;
      
      // Call API to send OTP
      const response = await sendOtp(fullPhone);
      
      if (response.success) {
        // Navigate to OTP verification screen
        navigation.navigate('OtpVerification', { phone: fullPhone });
      } else {
        setError(response.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Format phone number for display
   * Adds spaces for better readability
   */
  const formatDisplayPhone = (input: string): string => {
    // Remove all non-digits
    const digits = input.replace(/\D/g, '');
    
    // Format as XXX XXX XXXX
    if (digits.length > 3 && digits.length <= 6) {
      return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    }
    if (digits.length > 6) {
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
    }
    return digits;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.innerContainer}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={[styles.logo, { backgroundColor: theme.colors.primary }]}>
            <Icon name="message-outline" size={40} color={theme.colors.onPrimary} />
          </View>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            Ping
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Fast, private messaging
          </Text>
        </View>

        {/* Phone Input */}
        <View style={styles.inputContainer}>
          {/* Country Code Selector */}
          <View style={styles.countryCodeContainer}>
            <TouchableOpacity
              style={[styles.countryCodeButton, { backgroundColor: theme.colors.surface }]}
              onPress={() => {
                // For now, just support +91 (India)
                // Can be expanded to support other countries
                setCountryCode(countryCode === '+91' ? '+1' : '+91');
              }}
            >
              <Text style={[styles.countryCodeText, { color: theme.colors.onSurface }]}>
                {countryCode}
              </Text>
              <Icon name="chevron-down" size={20} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Phone Number Input */}
          <View style={styles.phoneInputContainer}>
            <TextInput
              mode="outlined"
              label="Phone Number"
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(text) => {
                // Only allow digits
                const digits = text.replace(/\D/g, '');
                setPhone(digits);
                setError(null);
              }}
              maxLength={10}
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
                <TextInput.Icon icon="phone-outline" color={theme.colors.onSurfaceVariant} />
              }
            />
            
            {/* Display formatted phone number */}
            {phone.length > 0 && (
              <Text style={[styles.formattedPhone, { color: theme.colors.onSurfaceVariant }]}>
                {formatDisplayPhone(phone)}
              </Text>
            )}
          </View>

          {/* Error Message */}
          {error && (
            <HelperText type="error" visible={!!error} style={styles.errorText}>
              {error}
            </HelperText>
          )}
        </View>

        {/* Info Text */}
        <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
          We will send you an SMS with a verification code
        </Text>

        {/* Continue Button */}
        <Button
          mode="contained"
          onPress={handleSendOtp}
          loading={isLoading}
          disabled={!isValid || phone.length < 10}
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={[styles.buttonLabel, { color: theme.colors.onPrimary }]}
          buttonColor={theme.colors.primary}
        >
          Continue
        </Button>

        {/* Terms and Privacy */}
        <Text style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
          By continuing, you agree to our Terms and Privacy Policy
        </Text>
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
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    width: 100,
  },
  countryCodeText: {
    fontSize: 16,
    marginRight: 8,
  },
  phoneInputContainer: {
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderRadius: 8,
  },
  formattedPhone: {
    fontSize: 14,
    marginTop: 4,
    marginLeft: 16,
  },
  errorText: {
    marginTop: -8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
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
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default PhoneInputScreen;
