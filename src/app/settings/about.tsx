import * as Application from 'expo-application';
import * as Linking from 'expo-linking';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Glass } from '@/components/glass/Glass';
import { Icon } from '@/components/Icon';
import { LargeTitleScrollView } from '@/components/LargeTitleScrollView';
import { PRIVACY_POLICY_URL, SUPPORT_EMAIL, WEBSITE_URL } from '@/config/app';
import { colors, spacing, type } from '@/theme';

/** App info, health disclaimer, privacy policy and support links (required by both stores). */
export default function AboutScreen() {
  const version = Application.nativeApplicationVersion ?? '';
  const build = Application.nativeBuildVersion;

  // The system browser, like Ask AI: the app itself never shows web pages, which keeps the
  // App Store "Unrestricted Web Access" answer a clear No.
  const openLink = (url: string) => void Linking.openURL(url);

  const emailSupport = async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Platewise ${version} feedback`)}`;
    try {
      await Linking.openURL(url);
    } catch {
      // No mail app configured: show the address so it can be copied.
      Alert.alert('Contact support', `Write to us at ${SUPPORT_EMAIL}`);
    }
  };

  return (
    <LargeTitleScrollView>
      <View style={styles.header}>
        <Text style={styles.appName}>Platewise</Text>
        <Text style={styles.version}>
          Version {version}
          {build ? ` (${build})` : ''}
        </Text>
      </View>

      <Glass radius={22} style={styles.card}>
        <SectionTitle ios="heart.text.square" android="health_and_safety" title="Not medical advice" />
        <Text style={styles.body}>
          Platewise is a food diary for everyday awareness. Nutrition values, day colors and goals are estimates and
          are not medical or dietary advice. If you have a medical condition, allergies or special dietary needs, talk
          to a doctor or registered dietitian.
        </Text>
      </Glass>

      <Glass radius={22} style={styles.card}>
        <SectionTitle ios="lock.shield" android="shield" title="Your data stays on this phone" />
        <Text style={styles.body}>
          No account, no ads, no tracking. Everything you log is stored only on this device. It leaves the phone only
          when you export a backup yourself or tap Ask AI, which opens a Google search for the food you typed.
        </Text>
      </Glass>

      <Glass radius={22} style={styles.list}>
        <LinkRow ios="hand.raised" android="policy" title="Privacy policy" onPress={() => openLink(PRIVACY_POLICY_URL)} />
        <LinkRow ios="globe" android="language" title="Website & help" onPress={() => openLink(WEBSITE_URL)} />
        <LinkRow ios="envelope" android="mail" title="Contact support" subtitle={SUPPORT_EMAIL} onPress={emailSupport} isLast />
      </Glass>
    </LargeTitleScrollView>
  );
}

function SectionTitle({ ios, android, title }: { ios: Parameters<typeof Icon>[0]['ios']; android: string; title: string }) {
  return (
    <View style={styles.titleRow}>
      <Icon ios={ios} android={android} size={16} color={colors.accent} />
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

function LinkRow({
  ios,
  android,
  title,
  subtitle,
  onPress,
  isLast = false,
}: {
  ios: Parameters<typeof Icon>[0]['ios'];
  android: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, !isLast && styles.rowDivider, pressed && { backgroundColor: colors.pressedFill }]}>
      <Icon ios={ios} android={android} size={18} color={colors.accent} />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Icon ios="arrow.up.right" android="open_in_new" size={12} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: 2,
  },
  appName: {
    ...type.title,
    color: colors.text,
  },
  version: {
    color: colors.textTertiary,
    fontSize: 13,
  },
  card: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...type.headline,
    color: colors.text,
  },
  body: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 21,
  },
  list: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    ...type.body,
    color: colors.text,
  },
  rowSubtitle: {
    color: colors.textTertiary,
    fontSize: 13,
    marginTop: 2,
  },
});
