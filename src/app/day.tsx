import { addDays, addMonths, format, startOfMonth } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MonthGrid } from '@/components/calendar/MonthGrid';
import { CategoryChip, HealthDot } from '@/components/CategoryChip';
import { Glass } from '@/components/glass/Glass';
import { GlassButton, IconButton } from '@/components/glass/GlassButton';
import { Icon } from '@/components/Icon';
import { listActiveCategories } from '@/data/categoriesRepo';
import { addEntries, deleteEntry, getDaySummaries, getEntriesForDate } from '@/data/entriesRepo';
import { fromDateKey, gridRange, isDateKey, todayKey, toDateKey, type DateKey } from '@/domain/dates';
import { HEALTH_LABELS, HEALTH_LEVELS, scoreDay } from '@/domain/health';
import { useLiveData } from '@/hooks/useLiveData';
import { haptics } from '@/lib/haptics';
import { colors, healthColor, spacing, type } from '@/theme';

export default function DaySheet() {
  const params = useLocalSearchParams<{ date?: string }>();
  const insets = useSafeAreaInsets();

  const [date, setDate] = useState<DateKey>(() => (isDateKey(params.date) ? params.date : todayKey()));
  const [pickerMonth, setPickerMonth] = useState<Date | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [query, setQuery] = useState('');

  const { data: logged = [] } = useLiveData(
    () => getEntriesForDate(date),
    ['entries', 'categories'],
    date,
  );
  const { data: categories = [] } = useLiveData(listActiveCategories, ['categories'], 'active');

  const pickerRange = pickerMonth ? gridRange(pickerMonth) : null;
  const { data: pickerSummaries } = useLiveData(
    () => (pickerRange ? getDaySummaries(pickerRange.from, pickerRange.to) : Promise.resolve(undefined)),
    ['entries', 'categories'],
    pickerRange ? `${pickerRange.from}:${pickerRange.to}` : 'closed',
  );

  const dayLevel = scoreDay(logged.map((e) => e.health));
  const day = fromDateKey(date);
  const isToday = date === todayKey();

  const normalizedQuery = query.trim().toLowerCase();
  const visibleCategories = normalizedQuery
    ? categories.filter((c) => c.name.toLowerCase().includes(normalizedQuery))
    : categories;

  const changeDate = (next: DateKey) => {
    haptics.tap();
    setDate(next);
    setPickerMonth(null);
  };

  const toggle = (id: number) => {
    haptics.tap();
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  };

  const save = async () => {
    if (selectedIds.length === 0) return;
    await addEntries(date, selectedIds);
    haptics.success();
    router.back();
  };

  const remove = (id: number) => {
    haptics.warning();
    void deleteEntry(id);
  };

  const count = selectedIds.length;

  return (
    <View style={styles.sheet}>
      <View style={styles.topBar}>
        <IconButton size={40} accessibilityLabel="Close" onPress={() => router.back()}>
          <Icon ios="xmark" android="close" size={16} />
        </IconButton>
        <GlassButton
          accessibilityLabel={count > 0 ? `Save ${count} ${count === 1 ? 'item' : 'items'}` : 'Save'}
          onPress={save}
          disabled={count === 0}
          tint={count > 0 ? colors.accent : undefined}
          contentStyle={[styles.saveButton, count === 0 && styles.saveDisabled]}>
          <Text style={styles.saveText}>{count > 0 ? `Save ${count}` : 'Save'}</Text>
        </GlassButton>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
      {/* Date navigation */}
      <View style={styles.header}>
        <IconButton size={36} accessibilityLabel="Previous day" onPress={() => changeDate(toDateKey(addDays(day, -1)))}>
          <Icon ios="chevron.left" android="chevron_left" size={16} />
        </IconButton>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Change date, currently ${format(day, 'EEEE, MMMM d')}`}
          onPress={() => {
            haptics.tap();
            setPickerMonth((m) => (m ? null : startOfMonth(day)));
          }}
          style={styles.dateButton}>
          <Text style={styles.overline}>{isToday ? 'Today' : format(day, 'EEEE')}</Text>
          <View style={styles.dateRow}>
            <Text style={styles.dateTitle}>{format(day, 'MMM d, yyyy')}</Text>
            <Icon
              ios={pickerMonth ? 'chevron.up' : 'chevron.down'}
              android={pickerMonth ? 'expand_less' : 'expand_more'}
              size={12}
              color={colors.textSecondary}
            />
          </View>
        </Pressable>

        <IconButton size={36} accessibilityLabel="Next day" onPress={() => changeDate(toDateKey(addDays(day, 1)))}>
          <Icon ios="chevron.right" android="chevron_right" size={16} />
        </IconButton>
      </View>

      {pickerMonth ? (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)}>
          <Glass radius={24} style={styles.picker}>
            <View style={styles.pickerHeader}>
              <IconButton
                size={32}
                accessibilityLabel="Previous month"
                onPress={() => setPickerMonth((m) => m && addMonths(m, -1))}>
                <Icon ios="chevron.left" android="chevron_left" size={14} />
              </IconButton>
              <Text style={styles.pickerTitle}>{format(pickerMonth, 'MMMM yyyy')}</Text>
              <IconButton
                size={32}
                accessibilityLabel="Next month"
                onPress={() => setPickerMonth((m) => m && addMonths(m, 1))}>
                <Icon ios="chevron.right" android="chevron_right" size={14} />
              </IconButton>
            </View>
            <MonthGrid
              compact
              month={pickerMonth}
              summaries={pickerSummaries}
              selectedKey={date}
              onSelectDay={changeDate}
            />
          </Glass>
        </Animated.View>
      ) : null}

      {/* Already logged */}
      <Animated.View layout={LinearTransition.duration(200)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Logged</Text>
          {dayLevel != null ? (
            <View style={styles.dayLevel}>
              <HealthDot level={dayLevel} />
              <Text style={[styles.dayLevelText, { color: healthColor(dayLevel) }]}>
                {HEALTH_LABELS[dayLevel]} day
              </Text>
            </View>
          ) : null}
        </View>
        {logged.length > 0 ? (
          <View style={styles.chips}>
            {logged.map((entry) => (
              <CategoryChip
                key={entry.id}
                name={entry.name}
                emoji={entry.emoji}
                health={entry.health}
                removable
                accessibilityLabel={`Remove ${entry.name}`}
                onPress={() => remove(entry.id)}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.empty}>Nothing logged for this day yet.</Text>
        )}
      </Animated.View>

      {/* Add food */}
      <Animated.View layout={LinearTransition.duration(200)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Add food</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/categories/[id]', params: { id: 'new' } })}
            hitSlop={8}>
            <Text style={styles.link}>New category</Text>
          </Pressable>
        </View>

        <View style={styles.search}>
          <Icon ios="magnifyingglass" android="search" size={16} color={colors.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search categories"
            placeholderTextColor={colors.textTertiary}
            style={styles.searchInput}
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>

        {HEALTH_LEVELS.map((level) => {
          const group = visibleCategories.filter((c) => c.health === level);
          if (group.length === 0) return null;
          return (
            <View key={level} style={styles.group}>
              <View style={styles.groupHeader}>
                <HealthDot level={level} />
                <Text style={styles.groupTitle}>{HEALTH_LABELS[level]}</Text>
              </View>
              <View style={styles.chips}>
                {group.map((category) => (
                  <CategoryChip
                    key={category.id}
                    name={category.name}
                    emoji={category.emoji}
                    health={category.health}
                    selected={selectedIds.includes(category.id)}
                    onPress={() => toggle(category.id)}
                  />
                ))}
              </View>
            </View>
          );
        })}
        {visibleCategories.length === 0 ? (
          <Text style={styles.empty}>No categories match “{query.trim()}”.</Text>
        ) : null}
      </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  content: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButton: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  overline: {
    ...type.overline,
    color: colors.textTertiary,
  },
  dateTitle: {
    ...type.title,
    color: colors.text,
  },
  picker: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  pickerTitle: {
    ...type.headline,
    color: colors.text,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...type.headline,
    color: colors.text,
  },
  dayLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayLevelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  link: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  empty: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: 0,
  },
  group: {
    gap: spacing.sm,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  groupTitle: {
    ...type.caption,
    color: colors.textSecondary,
  },
  saveButton: {
    height: 40,
    minWidth: 84,
    paddingHorizontal: spacing.lg,
  },
  saveDisabled: {
    opacity: 0.45,
  },
  saveText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
