/**
 * Authentication Navigator
 * 
 * This handles the authentication flow:
 * 1. PhoneInput - User enters their phone number
 * 2. OtpVerification - User enters OTP received via SMS
 * 3. ProfileSetup - New users set up their profile (optional)
 * 
 * The flow is linear - user must complete each step before moving to the next.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import PhoneInputScreen from '../screens/auth/PhoneInputScreen';
import OtpVerificationScreen from '../screens/auth/OtpVerificationScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="PhoneInput"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="PhoneInput"
        component={PhoneInputScreen}
        options={{ title: 'Enter Phone Number' }}
      />
      <Stack.Screen
        name="OtpVerification"
        component={OtpVerificationScreen}
        options={{ title: 'Verify OTP' }}
      />
      <Stack.Screen
        name="ProfileSetup"
        component={ProfileSetupScreen}
        options={{ title: 'Set Up Profile' }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
