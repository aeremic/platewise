import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { hasNativeGlass } from '@/components/glass/Glass';
import { seedDefaultCategories } from '@/data/categoriesRepo';
import { db } from '@/db/client';
import { colors } from '@/theme';

import migrations from '../../drizzle/migrations';

SplashScreen.preventAutoHideAsync();

// When the app opens directly on another screen (a link, or the OS restoring the app), keep the
// calendar underneath it so there's always a back button to the home screen.
export const unstable_settings = {
  anchor: 'index',
};

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    primary: colors.accent,
  },
};

// On iOS 26 a transparent sheet gets the system Liquid Glass background.
const sheetBackground = hasNativeGlass ? 'transparent' : colors.sheetBackground;

export default function RootLayout() {
  const migration = useMigrations(db, migrations);
  const [seeded, setSeeded] = useState(false);
  const [seedError, setSeedError] = useState<Error>();
  const error = migration.error ?? seedError;

  useEffect(() => {
    if (!migration.success) return;
    seedDefaultCategories().then(() => setSeeded(true), setSeedError);
  }, [migration.success]);

  useEffect(() => {
    if (seeded || error) SplashScreen.hideAsync();
  }, [seeded, error]);

  if (error) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorTitle}>Couldn’t open your food diary</Text>
        <Text style={styles.errorText}>{error.message}</Text>
      </View>
    );
  }
  if (!seeded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen
            name="day"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: [0.7, 1],
              sheetGrabberVisible: true,
              sheetCornerRadius: 32,
              contentStyle: { backgroundColor: sheetBackground },
            }}
          />
          <Stack.Screen
            name="categories/index"
            options={{
              headerShown: true,
              title: 'Categories',
              headerLargeTitle: Platform.OS === 'ios',
              headerTransparent: Platform.OS === 'ios',
              headerTintColor: colors.text,
              headerStyle: Platform.OS === 'ios' ? undefined : { backgroundColor: colors.background },
              headerBackButtonDisplayMode: 'minimal',
            }}
          />
          <Stack.Screen
            name="categories/[id]"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: [1],
              sheetGrabberVisible: true,
              sheetCornerRadius: 32,
              contentStyle: { backgroundColor: sheetBackground },
            }}
          />
          <Stack.Screen
            name="entry/[id]"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: 'fitToContents',
              sheetGrabberVisible: true,
              sheetCornerRadius: 32,
              contentStyle: { backgroundColor: sheetBackground },
            }}
          />
          <Stack.Screen
            name="settings/index"
            options={{
              headerShown: true,
              title: 'Settings',
              headerLargeTitle: Platform.OS === 'ios',
              headerTransparent: Platform.OS === 'ios',
              headerTintColor: colors.text,
              headerStyle: Platform.OS === 'ios' ? undefined : { backgroundColor: colors.background },
              headerBackButtonDisplayMode: 'minimal',
            }}
          />
          <Stack.Screen
            name="settings/backup"
            options={{
              headerShown: true,
              title: 'Backup',
              headerLargeTitle: Platform.OS === 'ios',
              headerTransparent: Platform.OS === 'ios',
              headerTintColor: colors.text,
              headerStyle: Platform.OS === 'ios' ? undefined : { backgroundColor: colors.background },
              headerBackButtonDisplayMode: 'minimal',
            }}
          />
          <Stack.Screen
            name="settings/goals"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: 'fitToContents',
              sheetGrabberVisible: true,
              sheetCornerRadius: 32,
              contentStyle: { backgroundColor: sheetBackground },
            }}
          />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  error: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
});
