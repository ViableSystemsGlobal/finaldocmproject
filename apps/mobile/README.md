# DOCM Church Mobile App

A beautiful React Native mobile app built with Expo for Demonstration of Christ Ministries church members.

## 🎨 Features

### 📱 Modern UI Design
- **Dark Theme**: Elegant dark interface with orange accent colors
- **Beautiful Cards**: Event and sermon cards with gradient overlays
- **Smooth Navigation**: Bottom tab navigation with custom icons
- **Floating Action Button**: Quick check-in access

### 🏠 Home Screen
- **Welcome Message**: Personalized greeting for users
- **Quick Actions**: 
  - Join a Group
  - Request Prayer
  - Give (Donations)
  - Request Ride
- **Upcoming Events**: Horizontal scrolling event carousel
- **Latest Sermons**: Sermon thumbnails with play buttons
- **Check-In FAB**: Orange floating action button for event check-in

### 📅 Events Screen
- **Featured Event**: Large event card with date badge
- **Event List**: Upcoming church events with join buttons
- **Event Details**: Date, time, location for each event

### 🎥 Sermons Screen
- **Latest Sermon**: Featured sermon with YouTube integration
- **Sermon List**: Recent messages from Pastor Evans and Elder Mike Davis
- **Video Integration**: Direct YouTube video thumbnails and metadata

### 👤 Profile Screen
- **User Profile**: Member photo, name, and role
- **Quick Stats**: Services attended, groups joined, prayer requests
- **Menu Options**: 
  - My Groups
  - Check-In History
  - Request Prayer
  - My Prayer Requests
  - Request Ride
  - Notifications
  - Help & Support
  - Sign Out

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Expo Go app on your phone (iOS/Android)

### Installation

1. **Navigate to mobile directory:**
   ```bash
   cd apps/mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open on your device:**
   - Install "Expo Go" app on your phone
   - Scan the QR code that appears in your terminal
   - The app will open on your device!

### Development Scripts

```bash
# Start Expo development server
npm start

# Run on Android emulator
npm run android

# Run on iOS simulator (macOS only)
npm run ios

# Run in web browser
npm run web
```

### From Root Directory

You can also run the mobile app from the project root:

```bash
# Start mobile app
npm run mobile:start

# Run on Android
npm run mobile:android

# Run on iOS
npm run mobile:ios

# Run on web
npm run mobile:web
```

## 🎨 Design System

### Colors
- **Primary Background**: `#1f2937` (Dark Gray)
- **Secondary Background**: `#374151` (Medium Gray)
- **Accent Color**: `#F59E0B` (Orange)
- **Text Primary**: `#FFFFFF` (White)
- **Text Secondary**: `#9CA3AF` (Light Gray)

### Typography
- **Headers**: Bold, large text for section titles
- **Body**: Medium weight for content
- **Captions**: Light gray for metadata

### Components
- **Cards**: Rounded corners (12px), shadow effects
- **Buttons**: Orange gradient, rounded corners
- **Icons**: Ionicons with consistent sizing
- **Images**: Rounded corners, aspect ratio maintained

## 📂 Project Structure

```
apps/mobile/
├── App.tsx                 # Main app component with navigation
├── src/
│   └── screens/
│       ├── HomeScreen.tsx      # Main home screen
│       ├── EventsScreen.tsx    # Events listing
│       ├── SermonsScreen.tsx   # Sermons with video integration
│       └── ProfileScreen.tsx   # User profile and menu
├── app.json                # Expo configuration
├── babel.config.js         # Babel configuration
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## 🔧 Technologies Used

- **Expo**: React Native framework for cross-platform development
- **React Navigation**: Tab and stack navigation
- **Expo Linear Gradient**: Beautiful gradient effects
- **React Native Safe Area Context**: Safe area handling
- **Ionicons**: Beautiful icon set
- **TypeScript**: Type safety and better development experience

## 📱 Real Data Integration

The app is designed to integrate with your existing Supabase backend:

- **Sermons**: Ready to connect to `/api/sermons` endpoint
- **Events**: Ready to connect to events data
- **User Profile**: Integration with church member data
- **Authentication**: Supabase Auth integration ready

## 🚢 Deployment

### Expo Application Services (EAS)

1. **Install EAS CLI:**
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Configure EAS:**
   ```bash
   eas build:configure
   ```

3. **Build for both platforms:**
   ```bash
   eas build --platform all
   ```

4. **Submit to app stores:**
   ```bash
   eas submit --platform all
   ```

## 🎯 Next Steps

1. **Connect to Supabase**: Integrate with your existing church database
2. **Authentication**: Add member login/signup flow
3. **Push Notifications**: Church announcements and event reminders
4. **Offline Support**: Cache sermons and events for offline viewing
5. **Giving Integration**: Stripe payment integration for donations
6. **Live Streaming**: Sunday service live stream integration

## 📞 Support

For questions or issues with the mobile app:
- Check the Expo documentation: https://docs.expo.dev/
- Review React Navigation docs: https://reactnavigation.org/
- Contact the development team

---

**Built with ❤️ for Demonstration of Christ Ministries**

*"Demonstrating CHRIST to the World!"* 