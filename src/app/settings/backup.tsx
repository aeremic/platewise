import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, View } from 'react-native';

import { Glass } from '@/components/glass/Glass';
import { GlassButton } from '@/components/glass/GlassButton';
import { Icon } from '@/components/Icon';
import { LargeTitleScrollView } from '@/components/LargeTitleScrollView';
import { readAllData } from '@/data/backupRepo';
import { fromDateKey } from '@/domain/dates';
import type { BackupSummary } from '@/domain/backup';
import { useLiveData } from '@/hooks/useLiveData';
import { haptics } from '@/lib/haptics';
import {
  importBackup,
  pickBackup,
  saveBackupToFolder,
  shareBackup,
  undoAvailableSince,
  undoLastImport,
} from '@/services/backupFiles';
import { colors, spacing, type, withAlpha } from '@/theme';

type Busy = 'save' | 'share' | 'import' | 'undo' | null;

export default function BackupScreen() {
  const [busy, setBusy] = useState<Busy>(null);
  const [undoSince, setUndoSince] = useState(() => undoAvailableSince());
  const { data } = useLiveData(readAllData, ['categories', 'entries', 'daily_goals'], 'all');

  const counts = data
    ? {
        categories: data.categories.filter((c) => c.deletedAt == null).length,
        entries: data.entries.length,
        goalChanges: data.dailyGoals.filter((g) => g.effectiveFrom !== '0000-01-01').length,
      }
    : null;

  const run = async (kind: Exclude<Busy, null>, action: () => Promise<void>) => {
    setBusy(kind);
    try {
      await action();
    } catch (error) {
      haptics.warning();
      Alert.alert('Something went wrong', error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(null);
      setUndoSince(undoAvailableSince());
    }
  };

  const onSave = () =>
    run('save', async () => {
      const result = await saveBackupToFolder();
      if (result.status === 'canceled') return;
      haptics.success();
      Alert.alert('Backup saved', `${result.fileName} was saved to “${result.folder}”.`);
    });

  const onShare = () =>
    run('share', async () => {
      await shareBackup();
      haptics.success();
    });

  const onImport = () =>
    run('import', async () => {
      const picked = await pickBackup();
      if (picked.status === 'canceled') return;
      if (picked.status === 'invalid') {
        haptics.warning();
        Alert.alert('Can’t import this file', picked.error);
        return;
      }
      const confirmed = await confirm(
        'Replace all data?',
        `${describeSummary(picked.summary)}\n\nEverything on this phone will be replaced by this backup. You can undo this afterwards.`,
        'Replace',
      );
      if (!confirmed) return;
      await importBackup(picked.backup);
      haptics.success();
      Alert.alert('Backup imported', `${plural(picked.summary.entries, 'logged food', 'logged foods')} and your goals are now on this phone.`);
    });

  const onUndo = () =>
    run('undo', async () => {
      const confirmed = await confirm(
        'Undo last import?',
        'Your data goes back to how it was right before the last import.',
        'Undo import',
      );
      if (!confirmed) return;
      await undoLastImport();
      haptics.success();
    });

  return (
    <LargeTitleScrollView>
      <Glass radius={22} style={styles.card}>
        <SectionTitle ios="square.and.arrow.up" android="upload" title="Export" />
        <Text style={styles.body}>
          {Platform.OS === 'android'
            ? 'Saves all your categories, logged foods and goals to one file. Save it to a folder on this phone, or share it to Google Drive, email or your other phone. Works between Android and iPhone.'
            : 'Saves all your categories, logged foods and goals to one file. Use “Save to Files” for iCloud Drive or this iPhone, or AirDrop it to your other phone. Works between iPhone and Android.'}
        </Text>
        {counts ? (
          <Text style={styles.meta}>
            {plural(counts.categories, 'category', 'categories')} · {plural(counts.entries, 'logged food', 'logged foods')} ·{' '}
            {plural(counts.goalChanges, 'goal change', 'goal changes')}
          </Text>
        ) : null}
        {Platform.OS === 'android' ? (
          <>
            <ActionButton label="Save to phone…" busy={busy === 'save'} disabled={busy != null} onPress={onSave} tint />
            <ActionButton label="Share…" busy={busy === 'share'} disabled={busy != null} onPress={onShare} />
          </>
        ) : (
          <ActionButton label="Export backup" busy={busy === 'share'} disabled={busy != null} onPress={onShare} tint />
        )}
      </Glass>

      <Glass radius={22} style={styles.card}>
        <SectionTitle ios="square.and.arrow.down" android="download" title="Import" />
        <Text style={styles.body}>
          Choose a Platewise backup file. It replaces everything on this phone, so it’s best for moving to a new
          phone. You’ll see what’s in the file before anything changes.
        </Text>
        <ActionButton label="Import backup…" busy={busy === 'import'} disabled={busy != null} onPress={onImport} />
        {undoSince ? (
          <View style={styles.undo}>
            <Text style={styles.meta}>
              Data from before the import on {format(parseISO(undoSince), 'MMM d, HH:mm')} is kept.
            </Text>
            <ActionButton label="Undo last import" busy={busy === 'undo'} disabled={busy != null} onPress={onUndo} />
          </View>
        ) : null}
      </Glass>
    </LargeTitleScrollView>
  );
}

function describeSummary(summary: BackupSummary): string {
  const platform = summary.platform === 'ios' ? 'iPhone' : summary.platform === 'android' ? 'Android' : summary.platform;
  const range =
    summary.firstDate && summary.lastDate
      ? `\nFoods from ${format(fromDateKey(summary.firstDate), 'MMM d, yyyy')} to ${format(fromDateKey(summary.lastDate), 'MMM d, yyyy')}`
      : '';
  return (
    `Exported ${format(parseISO(summary.exportedAt), 'MMM d, yyyy HH:mm')} from ${platform}\n` +
    `${plural(summary.categories, 'category', 'categories')} · ${plural(summary.entries, 'logged food', 'logged foods')} · ${plural(summary.goalChanges, 'goal change', 'goal changes')}` +
    range
  );
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

function confirm(title: string, message: string, action: string): Promise<boolean> {
  return new Promise((resolve) =>
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: action, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    ),
  );
}

function SectionTitle({ ios, android, title }: { ios: Parameters<typeof Icon>[0]['ios']; android: string; title: string }) {
  return (
    <View style={styles.titleRow}>
      <View style={styles.titleIcon}>
        <Icon ios={ios} android={android} size={16} color={colors.accent} />
      </View>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

function ActionButton({
  label,
  busy,
  disabled,
  onPress,
  tint = false,
}: {
  label: string;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
  tint?: boolean;
}) {
  return (
    <GlassButton
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      tint={tint ? colors.accent : undefined}
      radius={16}
      contentStyle={[styles.button, disabled && !busy && styles.buttonDisabled]}>
      {busy ? <ActivityIndicator color={colors.text} /> : <Text style={styles.buttonText}>{label}</Text>}
    </GlassButton>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.accent, 0.18),
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
  meta: {
    color: colors.textTertiary,
    fontSize: 13,
  },
  undo: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  button: {
    height: 48,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
