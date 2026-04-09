import '../src/utils/ReactotronConfig';

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as NavigationBar from 'expo-navigation-bar';
import NetInfo from '@react-native-community/netinfo';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { ImageBackground, Modal, Platform, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { reportAppVersionOnce } from '../src/services/appVersionCheck';

const BACKGROUND_IMAGE = require('@/assets/images/backg.png');

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const isHome = pathname === '/' || pathname === '/index' || pathname === '';
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden').catch(() => {});
    }
  }, []);

  // Ilovaga kirganda GET /app-versions so'rovini bir marta yuborish
  useEffect(() => {
    reportAppVersionOnce();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={styles.root}>
        <ImageBackground
          source={BACKGROUND_IMAGE}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          {!isHome && (
            <BlurView
              intensity={35}
              tint={colorScheme === 'dark' ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          )}
        </ImageBackground>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: styles.transparent,
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="photoPrank" />
          <Stack.Screen name="soundPrank" />
          <Stack.Screen name="spinnerChallenge" />
          <Stack.Screen name="fakeCall" />
          <Stack.Screen name="prankAiChat" />
        </Stack>
      </View>

      <Modal visible={isOffline} transparent animationType="fade">
        <View style={styles.offlineOverlay}>
          <View style={styles.offlineCard}>
            <Ionicons name="cloud-offline" size={56} color="#f59e0b" />
            <Text style={styles.offlineTitle}>No internet</Text>
            <Text style={styles.offlineText}>Turn on Wi‑Fi or mobile data</Text>
          </View>
        </View>
      </Modal>

      <StatusBar style="light" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  offlineOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  offlineCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
  },
  offlineTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
  },
  offlineText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
});
