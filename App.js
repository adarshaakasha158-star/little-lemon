import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Home from './screens/Home';
import Onboarding from './screens/Onboarding';
import Profile from './screens/Profile';
import theme from './constants/theme';
import { clearUserData, getIsOnboarded, getUserProfile, saveUserProfile } from './utils/storage';

const Stack = createNativeStackNavigator();

export default function App() {
  const [checkingStorage, setCheckingStorage] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function restoreUserState() {
      try {
        const [onboarded, profile] = await Promise.all([getIsOnboarded(), getUserProfile()]);
        if (mounted) {
          const hasUsableProfile = Boolean(profile?.firstName && profile?.email);
          setUserProfile(profile);
          setIsOnboarded(onboarded && hasUsableProfile);
        }
      } catch (error) {
        console.error('Could not restore Little Lemon user state.', error);
        if (mounted) {
          setStorageError(true);
          setUserProfile(null);
          setIsOnboarded(false);
        }
      } finally {
        if (mounted) {
          setCheckingStorage(false);
        }
      }
    }

    restoreUserState();
    return () => {
      mounted = false;
    };
  }, []);

  async function completeOnboarding(profile) {
    setUserProfile(profile);
    setIsOnboarded(true);
    setStorageError(false);
  }

  async function saveProfile(profile) {
    const savedProfile = await saveUserProfile(profile, { isOnboarded: true });
    setUserProfile(savedProfile);
    return savedProfile;
  }

  async function logout() {
    await clearUserData();
    setUserProfile(null);
    setIsOnboarded(false);
    setStorageError(false);
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {checkingStorage ? (
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color={theme.colors.green} />
          <Text style={styles.loadingLabel}>Welcome to Little Lemon</Text>
        </View>
      ) : (
        <NavigationContainer>
          <Stack.Navigator
            key={isOnboarded ? 'signed-in' : 'onboarding'}
            initialRouteName={isOnboarded ? 'Home' : 'Onboarding'}
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.colors.background },
              animation: 'slide_from_right'
            }}
          >
            {isOnboarded ? (
              <>
                <Stack.Screen name="Home">
                  {(screenProps) => <Home {...screenProps} userProfile={userProfile} />}
                </Stack.Screen>
                <Stack.Screen
                  name="Profile"
                  options={{
                    headerShown: true,
                    title: 'Your profile',
                    headerStyle: { backgroundColor: theme.colors.background },
                    headerTintColor: theme.colors.green,
                    headerTitleStyle: { color: theme.colors.charcoal, fontWeight: '800' },
                    headerShadowVisible: false,
                    headerBackTitle: 'Back'
                  }}
                >
                  {(screenProps) => (
                    <Profile
                      {...screenProps}
                      userProfile={userProfile}
                      onProfileSaved={saveProfile}
                      onLogout={logout}
                    />
                  )}
                </Stack.Screen>
              </>
            ) : (
              <Stack.Screen name="Onboarding">
                {(screenProps) => <Onboarding {...screenProps} onComplete={completeOnboarding} />}
              </Stack.Screen>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      )}
      {storageError && !checkingStorage && (
        <View pointerEvents="none" style={styles.storageNotice}>
          <Text style={styles.storageNoticeText}>Saved profile unavailable. Please enter your details again.</Text>
        </View>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: theme.colors.background
  },
  loadingLabel: {
    color: theme.colors.green,
    fontSize: 15,
    fontWeight: '700'
  },
  storageNotice: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    left: 16,
    padding: 12,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.lightOrange
  },
  storageNoticeText: {
    color: theme.colors.charcoal,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center'
  }
});
