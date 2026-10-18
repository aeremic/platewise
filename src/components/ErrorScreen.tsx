import * as Application from 'expo-application';
import * as Linking from 'expo-linking';
import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SUPPORT_EMAIL } from '@/config/app';
import { colors, spacing, type } from '@/theme';

type Props = {
  title: string;
  message: string;
  error: Error;
  /** Shows a "Try again" button (screen errors can retry; startup errors can't). */
  onRetry?: () => void;
};

/** Full-screen error with a way to contact support; the technical details go into the email. */
export function ErrorScreen({ title, message, error, onRetry }: Props) {
  const insets = useSafeAreaInsets();

  const emailSupport = async () => {
    const version = Application.nativeApplicationVersion ?? '';
    const subject = encodeURIComponent(`Platewise ${version} error`);
    const body = encodeURIComponent(`What happened:\n\n\nError details: ${error.message}`);
    try {
      await Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
    } catch {
      Alert.alert('Contact support', `Write to us at ${SUPPORT_EMAIL}`);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xxl },
      ]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry} style={[styles.button, styles.primary]}>
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      ) : null}
      <Pressable accessibilityRole="button" onPress={emailSupport} style={styles.button}>
        <Text style={styles.buttonText}>Contact support</Text>
      </Pressable>
      <Text style={styles.details} selectable>
        {error.message}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  title: {
    ...type.title,
    color: colors.text,
  },
  message: {
    ...type.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  button: {
    minHeight: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  primary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  buttonText: {
    ...type.headline,
    color: colors.text,
  },
  details: {
    ...type.caption,
    color: colors.textTertiary,
    marginTop: spacing.lg,
  },
});
