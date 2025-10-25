import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Navigation types
type RootStackParamList = {
  Main: undefined;
  EventDetails: { event: any };
  SermonDetails: { sermon: any };
  Notifications: undefined;
  NotificationSettings: undefined;
  Groups: undefined;
  PrayerRequest: undefined;
  Give: undefined;
  RideRequest: undefined;
  MyGroups: undefined;
  MyGiving: undefined;
  CheckInHistory: undefined;
  MyPrayerRequests: undefined;
  MyRideRequests: undefined;
};

type TabParamList = {
  Home: undefined;
  Events: undefined;
  CheckIn: undefined;
  Sermons: undefined;
  Profile: undefined;
};

// Import contexts
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { NotificationsProvider } from './src/contexts/NotificationsContext';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import EventsScreen from './src/screens/EventsScreen';
import SermonsScreen from './src/screens/SermonsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import EventDetailsScreen from './src/screens/EventDetailsScreen';
import SermonDetailsScreen from './src/screens/SermonDetailsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';
import GroupsScreen from './src/screens/GroupsScreen';
import PrayerRequestScreen from './src/screens/PrayerRequestScreen';
import GiveScreen from './src/screens/GiveScreen';
import RideRequestScreen from './src/screens/RideRequestScreen';
import CheckInScreen from './src/screens/CheckInScreen';
import MyGroupsScreen from './src/screens/MyGroupsScreen';
import MyGivingScreen from './src/screens/MyGivingScreen';
import CheckInHistoryScreen from './src/screens/CheckInHistoryScreen';
import MyPrayerRequestsScreen from './src/screens/MyPrayerRequestsScreen';
import MyRideRequestsScreen from './src/screens/MyRideRequestsScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// Loading screen
function LoadingScreen() {
  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: '#1f2937', 
      justifyContent: 'center', 
      alignItems: 'center' 
    }}>
      <Ionicons name="home" size={80} color="#F59E0B" />
      <Text style={{ color: 'white', fontSize: 18, marginTop: 16 }}>
        Loading...
      </Text>
    </View>
  );
}

// Auth Navigation
function AuthNavigator() {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'login' | 'signup'>('welcome')

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return (
          <WelcomeScreen
            onLogin={() => setCurrentScreen('login')}
            onSignUp={() => setCurrentScreen('signup')}
          />
        )
      case 'login':
        return (
          <LoginScreen
            onBack={() => setCurrentScreen('welcome')}
            onSwitchToSignUp={() => setCurrentScreen('signup')}
          />
        )
      case 'signup':
        return (
          <SignUpScreen
            onBack={() => setCurrentScreen('welcome')}
            onSwitchToLogin={() => setCurrentScreen('login')}
          />
        )
      default:
        return null
    }
  }

  return renderScreen()
}

// Custom Tab Bar Component
function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={styles.fabContainer}
        onPress={() => navigation.navigate('CheckIn')}
      >
        <LinearGradient
          colors={['#F59E0B', '#D97706']}
          style={styles.fab}
        >
          <Ionicons name="checkmark" size={24} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          if (route.name === 'CheckIn') return null;

          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined 
            ? options.tabBarLabel 
            : options.title !== undefined 
            ? options.title 
            : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let iconName: keyof typeof Ionicons.glyphMap;
          if (route.name === 'Home') {
            iconName = isFocused ? 'home' : 'home-outline';
          } else if (route.name === 'Events') {
            iconName = isFocused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Sermons') {
            iconName = isFocused ? 'play-circle' : 'play-circle-outline';
          } else if (route.name === 'Profile') {
            iconName = isFocused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={styles.tabItem}
            >
              <Ionicons 
                name={iconName} 
                size={24} 
                color={isFocused ? '#F59E0B' : '#9CA3AF'} 
              />
              <Text style={[
                styles.tabLabel, 
                { color: isFocused ? '#F59E0B' : '#9CA3AF' }
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// Tab Navigator Component
function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="CheckIn" component={CheckInScreen} />
      <Tab.Screen name="Sermons" component={SermonsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Main App Navigator
function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#1f2937' },
      }}
    >
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
      <Stack.Screen name="SermonDetails" component={SermonDetailsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="Groups" component={GroupsScreen} />
      <Stack.Screen name="PrayerRequest" component={PrayerRequestScreen} />
      <Stack.Screen name="Give" component={GiveScreen} />
      <Stack.Screen name="RideRequest" component={RideRequestScreen} />
      <Stack.Screen name="MyGroups" component={MyGroupsScreen} />
      <Stack.Screen name="MyGiving" component={MyGivingScreen} />
      <Stack.Screen name="CheckInHistory" component={CheckInHistoryScreen} />
      <Stack.Screen name="MyPrayerRequests" component={MyPrayerRequestsScreen} />
      <Stack.Screen name="MyRideRequests" component={MyRideRequestsScreen} />
    </Stack.Navigator>
  );
}

// Main App Component
function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationsProvider>
          <AppContent />
          <StatusBar style="light" />
        </NotificationsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    position: 'relative',
    backgroundColor: '#1f2937',
  },
  fabContainer: {
    position: 'absolute',
    top: -25,
    left: '50%',
    marginLeft: -25,
    zIndex: 1,
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});
