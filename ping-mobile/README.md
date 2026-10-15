# Ping Mobile App

A WhatsApp-like messaging app built with React Native, focusing on privacy, speed, and scalability. This is the frontend mobile application for the Ping messaging platform.

## Features

### Authentication
- Phone number login via OTP (using MessageCentral)
- Secure OTP verification
- Profile setup for new users

### Messaging
- 1-to-1 encrypted text messaging
- Real-time message delivery via WebSocket
- Read receipts (blue ticks)
- Typing indicators
- Message search

### Media Sharing
- Send and receive images
- Send and receive videos
- Voice note recording and playback
- Location sharing
- File sharing

### Groups
- Create groups with multiple participants
- Join groups via invite links
- Group management
- Group profile pictures
- Member count display

### User Experience
- Dark mode theme
- Pull to refresh
- Infinite scroll for messages
- Unread message indicators
- Online/offline status
- Last seen privacy controls

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | React Native + Expo | Cross-platform mobile app |
| UI Components | React Native Paper | Material Design components |
| Navigation | React Navigation | App navigation |
| State Management | Zustand | Lightweight state management |
| HTTP Client | Axios | API requests |
| Real-time | WebSocket | Real-time messaging |
| Audio | Expo AV | Voice recording and playback |
| Camera | Expo Camera | Photo/video capture |
| Location | Expo Location | Location sharing |
| Image Picker | Expo Image Picker | Media selection |
| Storage | AsyncStorage | Local data persistence |

## Project Structure

```
ping-mobile/
├── App.tsx                      # Root component
├── app.json                     # Expo configuration
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript configuration
├── babel.config.js              # Babel configuration
├── .eslintrc.json               # ESLint configuration
├── .prettierrc                  # Prettier configuration
├── .gitignore                   # Git ignore rules
│
├── src/
│   ├── theme/
│   │   └── index.ts             # App theme and colors
│   │
│   ├── store/
│   │   ├── authStore.ts        # Authentication state
│   │   └── chatStore.ts        # Chat-related state
│   │
│   ├── services/
│   │   └── api.ts              # API service layer
│   │
│   ├── hooks/
│   │   └── useWebSocket.ts     # WebSocket connection hook
│   │
│   ├── utils/
│   │   └── helpers.ts          # Utility functions
│   │
│   ├── navigation/
│   │   ├── types.ts            # Navigation type definitions
│   │   ├── RootNavigator.tsx   # Root navigation
│   │   ├── AuthNavigator.tsx   # Auth flow navigation
│   │   └── MainTabNavigator.tsx # Main app tabs
│   │
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── PhoneInputScreen.tsx    # Phone number input
│   │   │   ├── OtpVerificationScreen.tsx # OTP verification
│   │   │   └── ProfileSetupScreen.tsx   # Profile setup
│   │   │
│   │   ├── chat/
│   │   │   ├── ChatListScreen.tsx      # Chat list
│   │   │   └── ChatScreen.tsx          # Individual chat
│   │   │
│   │   ├── groups/
│   │   │   ├── GroupsScreen.tsx        # Groups list
│   │   │   └── CreateGroupScreen.tsx    # Create new group
│   │   │
│   │   ├── settings/
│   │   │   └── SettingsScreen.tsx      # App settings
│   │   │
│   │   └── common/
│   │       └── SearchUsersScreen.tsx   # Search users
│   │
│   └── components/
│       └── index.ts            # Reusable components
│
└── assets/                    # Static assets (images, fonts)
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio / Xcode (for emulator)
- Physical device with Expo Go app (for testing)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ping-mobile
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Configure backend URL:
Edit `src/services/api.ts` and update:
```typescript
export const API_BASE_URL = 'http://YOUR_BACKEND_URL/api';
```

4. Configure WebSocket URL:
Edit `src/hooks/useWebSocket.ts` and update:
```typescript
const WS_URL = 'ws://YOUR_BACKEND_WS_URL/ws';
```

### Running the App

#### Development
```bash
# Start Expo development server
npm start
# or
expo start
```

Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Or scan QR code with Expo Go app on your phone

#### Production Build

For Android:
```bash
expo build:android
```

For iOS:
```bash
expo build:ios
```

## Configuration

### Backend API

The app expects the following API endpoints:

- `POST /auth/send-otp` - Send OTP to phone
- `POST /auth/verify-otp` - Verify OTP and login
- `POST /auth/register` - Register new user
- `GET /conversations` - Get all conversations
- `POST /conversations` - Create new conversation
- `GET /messages` - Get messages for conversation
- `POST /messages` - Send message
- `GET /users/search` - Search users
- `POST /groups` - Create group
- `GET /groups/{id}/invite-link` - Get group invite link
- `POST /upload/media` - Upload media files

### MessageCentral Integration

The OTP service uses MessageCentral. Make sure:
1. Your backend is configured to send OTPs via MessageCentral
2. MessageCentral credentials are properly set in your backend

## Features Implementation

### Authentication Flow
1. User enters phone number on PhoneInputScreen
2. OTP is sent via MessageCentral
3. User enters OTP on OtpVerificationScreen
4. On successful verification, user is logged in or taken to profile setup
5. New users set up their profile on ProfileSetupScreen

### Messaging Flow
1. User opens ChatListScreen to see all conversations
2. Tapping a conversation opens ChatScreen
3. Messages are loaded and displayed in bubbles
4. User can send text, images, videos, voice notes, or locations
5. Messages are sent to backend and delivered in real-time via WebSocket

### Group Management
1. User can create groups on CreateGroupScreen
2. Users can be added by searching and selecting
3. Group invite links can be generated and shared
4. Users can join groups via invite links

### Real-time Features
- WebSocket connection is maintained throughout the session
- Messages are delivered instantly
- Typing indicators show when others are typing
- Online/offline status updates in real-time

## State Management

The app uses Zustand for state management with two main stores:

### Auth Store
- Manages user authentication state
- Persists to AsyncStorage
- Tracks user info, token, and auth status

### Chat Store
- Manages conversations and messages
- Tracks active conversation
- Manages unread counts
- Handles message status (sending, sent, delivered, read)

## Styling

The app uses React Native Paper for UI components with a custom dark theme:

- Primary color: `#6A5ACD` (Slate Blue)
- Secondary color: `#20B2AA` (Light Sea Green)
- Background: `#1a1a2e` (Dark Blue-Gray)
- Surface: `#16213e` (Slightly lighter)

## Customization

### Colors
Edit `src/theme/index.ts` to change the app's color scheme.

### Fonts
Modify the `typography` section in `src/theme/index.ts`.

### Navigation
Edit navigation files in `src/navigation/` to change the app's navigation structure.

## Security Considerations

- All API requests use HTTPS
- Authentication token is stored securely in AsyncStorage
- Sensitive operations require user confirmation
- WebSocket connection uses secure protocol (wss:// in production)

## Performance

- Messages are paginated for smooth scrolling
- Images are loaded with appropriate sizes
- WebSocket connection is efficient with auto-reconnect
- State updates are optimized to prevent unnecessary re-renders

## Testing

### Manual Testing
1. Test authentication flow with different phone numbers
2. Test message sending and receiving
3. Test media sharing (images, videos, voice notes, locations)
4. Test group creation and management
5. Test real-time features (typing indicators, read receipts)
6. Test offline behavior and reconnection

### Automated Testing
Consider adding:
- Unit tests for utility functions
- Component tests for UI elements
- Integration tests for API calls
- E2E tests for user flows

## Troubleshooting

### Common Issues

1. **WebSocket connection fails**
   - Check if backend WebSocket server is running
   - Verify WebSocket URL is correct
   - Ensure CORS is configured properly

2. **Messages not delivering**
   - Check WebSocket connection status
   - Verify message status updates
   - Check backend logs for errors

3. **Media upload fails**
   - Check file permissions
   - Verify storage limits
   - Ensure media URLs are accessible

4. **App crashes on launch**
   - Check console logs for errors
   - Verify all dependencies are installed
   - Ensure Expo SDK version is compatible

### Debugging

Use React Native Debugger or Flipper for debugging:
```bash
npm install -g react-native-debugger
```

Enable debug mode in development:
```typescript
// In App.tsx
import { LogBox } from 'react-native';
LogBox.install();
```

## Deployment

### App Stores

To deploy to app stores:

1. **Android**
```bash
# Build APK
expo build:android --type apk

# Build App Bundle
expo build:android --type app-bundle
```

2. **iOS**
```bash
# Build IPA
expo build:ios
```

3. **Follow app store guidelines**
   - Set up proper app metadata
   - Configure app icons and screenshots
   - Set privacy policy URLs
   - Configure permissions properly

## Future Enhancements

1. **End-to-End Encryption**
   - Implement Signal Protocol for message encryption
   - Add key verification

2. **Multi-device Support**
   - Sync messages across devices
   - Manage device sessions

3. **Call Features**
   - Voice calling
   - Video calling
   - Group calling

4. **Advanced Media**
   - Document sharing
   - Contact sharing
   - GIF support

5. **Enhanced Groups**
   - Group admin controls
   - Group announcements
   - Group media albums

6. **Privacy Features**
   - Disappearing messages
   - Message reactions
   - Forward message restrictions

7. **Performance**
   - Message search indexing
   - Media compression
   - Lazy loading optimization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary. All rights reserved.

## Contact

For questions or issues, please contact the development team.

---

Built with React Native, Expo, and TypeScript.
