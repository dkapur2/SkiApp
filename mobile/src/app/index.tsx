import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { isOfflineError } from '@/api/client';
import { resortCatalogQuery, resortConditionsQuery } from '@/api/queries';
import { AppScreen } from '@/components/app-screen';
import {
  ActionButton,
  Card,
  ForecastSkeleton,
  FreshnessBlock,
  Notice,
  SectionHeading,
} from '@/components/forecast-ui';
import { StatePanel } from '@/components/state-panel';
import { AppText } from '@/components/typography';
import { minimumTargetSize, radius, spacing, useSkiTheme } from '@/design/tokens';
import { formatDate, formatMeasurement, stateName, weatherIsPartial } from '@/utils/forecast';

const DEFAULT_RESORT_ID = 'elk-mountain';

export default function TodayScreen() {
  const router = useRouter();
  const theme = useSkiTheme();
  const canFetch = process.env.EXPO_OS !== 'web' || typeof window !== 'undefined';
  const [selectedId, setSelectedId] = useState(DEFAULT_RESORT_ID);
  const [search, setSearch] = useState('');
  const catalogQuery = useQuery(resortCatalogQuery(canFetch));

  const selectedResort =
    catalogQuery.data?.find((resort) => resort.id === selectedId) ?? catalogQuery.data?.[0];
  const conditionsQuery = useQuery(resortConditionsQuery(selectedResort?.id ?? '', canFetch));
  const results = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query || !catalogQuery.data) return [];
    return catalogQuery.data
      .filter((resort) => `${resort.name} ${resort.state}`.toLowerCase().includes(query))
      .slice(0, 6);
  }, [catalogQuery.data, search]);

  const selectResort = (id: string) => {
    setSelectedId(id);
    setSearch('');
  };

  return (
    <AppScreen testID="today-screen">
      <View style={styles.header}>
        <AppText variant="label" tone="brand">SkiTheEast</AppText>
        <AppText variant="display" accessibilityRole="header">Today</AppText>
        <AppText tone="soft">{formatDate(new Date().toISOString().slice(0, 10), 'long')}</AppText>
      </View>

      <View style={styles.intro}>
        <AppText variant="heading">Start with a mountain</AppText>
        <AppText tone="soft">
          Choose a resort to see its measured forecast. This preview is not a ranking or recommendation.
        </AppText>
      </View>

      <Card>
        <AppText variant="label" tone="faint">Mountain search</AppText>
        <TextInput
          accessibilityLabel="Search mountains"
          autoCapitalize="words"
          onChangeText={setSearch}
          placeholder={catalogQuery.data
            ? `Search ${catalogQuery.data.length} Eastern resorts`
            : 'Search Eastern resorts'}
          placeholderTextColor={theme.faint}
          returnKeyType="search"
          style={[styles.search, { backgroundColor: theme.raised, borderColor: theme.line, color: theme.text }]}
          value={search}
        />
        {search.length > 0 ? (
          <View accessibilityRole="list" style={styles.results}>
            {results.map((resort) => (
              <Pressable
                accessibilityRole="button"
                key={resort.id}
                onPress={() => selectResort(resort.id)}
                style={({ pressed }) => [styles.result, { borderBottomColor: theme.line }, pressed && styles.pressed]}>
                <View style={styles.resultCopy}>
                  <AppText variant="support">{resort.name}</AppText>
                  <AppText variant="support" tone="soft">{stateName(resort.state)}</AppText>
                </View>
                <AppText variant="support" tone="faint">
                  Peak {Math.round(resort.peak_elevation_ft).toLocaleString()} ft
                </AppText>
              </Pressable>
            ))}
            {catalogQuery.isSuccess && results.length === 0 ? (
              <AppText variant="support" tone="soft">No matching mountains.</AppText>
            ) : null}
          </View>
        ) : null}
      </Card>

      {catalogQuery.isPending ? <ForecastSkeleton label="Loading mountains" /> : null}
      {catalogQuery.isError ? (
        <StatePanel
          kind={isOfflineError(catalogQuery.error) ? 'offline' : 'error'}
          onRetry={() => void catalogQuery.refetch()}
        />
      ) : null}

      {selectedResort ? (
        <View style={styles.forecastSection}>
          <SectionHeading eyebrow="Selected mountain" title="Today’s forecast" />
          {conditionsQuery.isPending ? (
            <Card><ForecastSkeleton label={`Loading ${selectedResort.name}`} /></Card>
          ) : null}
          {conditionsQuery.isError ? (
            <StatePanel
              kind={isOfflineError(conditionsQuery.error) ? 'offline' : 'error'}
              onRetry={() => void conditionsQuery.refetch()}
            />
          ) : null}
          {conditionsQuery.data ? (
            <Card>
              <View style={styles.resortHeading}>
                <View style={styles.resortCopy}>
                  <AppText variant="title" accessibilityRole="header">{conditionsQuery.data.resort}</AppText>
                  <AppText variant="support" tone="soft">
                    {stateName(conditionsQuery.data.state)} · Mid mountain preview
                  </AppText>
                </View>
                <View style={[styles.livePill, { backgroundColor: theme.brandSoft }]}>
                  <AppText variant="label" tone="brand">Live forecast</AppText>
                </View>
              </View>

              {weatherIsPartial(conditionsQuery.data, 'mid') ? (
                <Notice title="Some forecast fields are unavailable">
                  Available measurements are shown; missing values stay explicitly unavailable.
                </Notice>
              ) : null}

              <View style={styles.previewMetrics}>
                <PreviewMetric
                  label="Temperature"
                  value={formatMeasurement(conditionsQuery.data.next_12_hours[0]?.mid.temperature_f, '°')}
                />
                <PreviewMetric
                  label="New snow"
                  value={formatMeasurement(conditionsQuery.data.forecast[0]?.mid.snowfall_in, ' in', 1)}
                />
                <PreviewMetric
                  label="Wind"
                  value={formatMeasurement(conditionsQuery.data.next_12_hours[0]?.mid.windspeed_mph, ' mph')}
                />
              </View>

              <ActionButton
                label="Open full forecast"
                onPress={() => router.push({ pathname: '/resorts/[resortId]', params: { resortId: selectedResort.id } })}
              />
              <FreshnessBlock
                weather={conditionsQuery.data.weather_metadata}
                operationsFetchedAt={conditionsQuery.data.ski_conditions?.fetched_at}
              />
            </Card>
          ) : null}
        </View>
      ) : null}
    </AppScreen>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.previewMetric}>
      <AppText variant="label" tone="faint">{label}</AppText>
      <AppText variant="heading">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs, paddingBottom: spacing.xl, paddingTop: spacing.xl },
  intro: { gap: spacing.sm, paddingBottom: spacing.xl },
  search: {
    borderRadius: radius.md,
    borderWidth: 1,
    fontSize: 16,
    minHeight: minimumTargetSize,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  results: { gap: spacing.xs },
  result: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingVertical: spacing.sm,
  },
  resultCopy: { flex: 1, gap: spacing.xs, paddingRight: spacing.md },
  pressed: { opacity: 0.72 },
  forecastSection: { gap: spacing.md, paddingTop: spacing.xxl },
  resortHeading: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' },
  resortCopy: { flex: 1, gap: spacing.xs },
  livePill: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  previewMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  previewMetric: { flexGrow: 1, gap: spacing.xs, minWidth: 92 },
});
