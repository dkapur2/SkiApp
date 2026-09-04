import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { ElevationKey, ResortConditions } from '@/api/contracts';
import { isOfflineError } from '@/api/client';
import { resortCatalogQuery, resortConditionsQuery } from '@/api/queries';
import { AppScreen } from '@/components/app-screen';
import {
  ActionButton,
  Card,
  ElevationControl,
  ForecastSkeleton,
  FreshnessBlock,
  MetricCard,
  Notice,
  SectionHeading,
} from '@/components/forecast-ui';
import { StatePanel } from '@/components/state-panel';
import { AppText } from '@/components/typography';
import { minimumTargetSize, radius, spacing, useSkiTheme } from '@/design/tokens';
import {
  dailyAtElevation,
  elevationLabel,
  formatDate,
  formatMeasurement,
  formatTime,
  hasEnoughForecastData,
  hourlyAtElevation,
  isWeatherDataStale,
  stateName,
  weatherIsPartial,
} from '@/utils/forecast';

export default function ResortDetailScreen() {
  const params = useLocalSearchParams<{ resortId?: string | string[] }>();
  const resortId = Array.isArray(params.resortId) ? params.resortId[0] : (params.resortId ?? '');
  const router = useRouter();
  const theme = useSkiTheme();
  const canFetch = process.env.EXPO_OS !== 'web' || typeof window !== 'undefined';
  const [elevation, setElevation] = useState<ElevationKey>('mid');
  const catalogQuery = useQuery(resortCatalogQuery(canFetch));
  const conditionsQuery = useQuery(resortConditionsQuery(resortId, canFetch));
  const metadata = catalogQuery.data?.find((resort) => resort.id === resortId);

  const changeElevation = (next: ElevationKey) => {
    setElevation(next);
    void AccessibilityInfo.announceForAccessibility(
      `Showing ${elevationLabel(next)} elevation forecast`,
    );
  };

  const stale = conditionsQuery.data
    ? isWeatherDataStale(conditionsQuery.data.weather_metadata.fetched_at) || conditionsQuery.isRefetchError
    : false;

  return (
    <AppScreen testID="resort-detail-screen">
      <View style={styles.nav}>
        <Pressable
          accessibilityLabel="Back to Today"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={({ pressed }) => [styles.back, { borderColor: theme.line }, pressed && styles.pressed]}>
          <AppText variant="support">‹ Today</AppText>
        </Pressable>
        <AppText variant="label" tone="brand">SkiTheEast</AppText>
      </View>

      {conditionsQuery.isPending ? (
        <View style={styles.loading}>
          <ForecastSkeleton label="Loading resort forecast" />
        </View>
      ) : null}

      {conditionsQuery.isError && !conditionsQuery.data ? (
        <StatePanel
          kind={isOfflineError(conditionsQuery.error) ? 'offline' : 'error'}
          onRetry={() => void conditionsQuery.refetch()}
        />
      ) : null}

      {conditionsQuery.data ? (
        <DetailContent
          conditions={conditionsQuery.data}
          elevation={elevation}
          isRefreshing={conditionsQuery.isFetching}
          metadata={metadata}
          onChangeElevation={changeElevation}
          onRetry={() => void conditionsQuery.refetch()}
          stale={stale}
        />
      ) : null}
    </AppScreen>
  );
}

type DetailContentProps = {
  conditions: ResortConditions;
  elevation: ElevationKey;
  isRefreshing: boolean;
  metadata?: {
    base_elevation_ft: number;
    mid_elevation_ft: number;
    peak_elevation_ft: number;
  };
  onChangeElevation: (value: ElevationKey) => void;
  onRetry: () => void;
  stale: boolean;
};

function DetailContent({
  conditions,
  elevation,
  isRefreshing,
  metadata,
  onChangeElevation,
  onRetry,
  stale,
}: DetailContentProps) {
  const theme = useSkiTheme();
  const day = dailyAtElevation(conditions.forecast[0], elevation);
  const hour = hourlyAtElevation(conditions, elevation);
  const partialWeather = weatherIsPartial(conditions, elevation);
  const enoughData = hasEnoughForecastData(conditions, elevation);
  const elevationFeet = day?.elevation_ft ?? hour?.elevation_ft;
  const freezingLevel = conditions.forecast[0]?.avg_freezing_level_ft;
  const freezingRelation = describeFreezingLevel(freezingLevel, elevationFeet);

  return (
    <View style={styles.detail}>
      <View style={styles.hero}>
        <AppText variant="label" tone="faint">{stateName(conditions.state)}</AppText>
        <AppText variant="display" accessibilityRole="header">{conditions.resort}</AppText>
        <AppText tone="soft">
          {metadata
            ? `${Math.round(metadata.base_elevation_ft).toLocaleString()}–${Math.round(metadata.peak_elevation_ft).toLocaleString()} ft`
            : elevationFeet
              ? `${Math.round(elevationFeet).toLocaleString()} ft ${elevationLabel(elevation).toLowerCase()}`
              : 'Elevation unavailable'}
        </AppText>
      </View>

      {stale ? (
        <Notice title="Showing an older forecast">
          The last refresh failed or the in-app copy is over 30 minutes old. Values remain visible with reduced confidence.
        </Notice>
      ) : null}
      {partialWeather ? (
        <Notice title="Partial weather data">
          Missing measurements remain unavailable; they are never converted to zero.
        </Notice>
      ) : null}

      <Card>
        <View style={styles.cardHeading}>
          <View style={styles.cardHeadingCopy}>
            <AppText variant="label" tone="faint">Forecast view</AppText>
            <AppText variant="heading">{elevationLabel(elevation)} mountain</AppText>
          </View>
          <View style={[styles.forecastPill, { backgroundColor: stale ? theme.warningSoft : theme.brandSoft }]}>
            <AppText variant="label" tone={stale ? 'warning' : 'brand'}>
              {stale ? 'Stale' : isRefreshing ? 'Refreshing' : 'Forecast'}
            </AppText>
          </View>
        </View>
        <ElevationControl value={elevation} onChange={onChangeElevation} />
      </Card>

      {!enoughData ? <StatePanel kind="insufficient" /> : (
        <>
          <View style={styles.section}>
            <SectionHeading eyebrow="Decision inputs" title="Mountain weather" />
            <View style={styles.metrics}>
              <MetricCard
                label="Temperature"
                value={formatMeasurement(hour?.temperature_f, '°F')}
                detail={`Feels like ${formatMeasurement(hour?.apparent_temperature_f, '°F')}`}
                unavailable={hour?.temperature_f == null}
              />
              <MetricCard
                label="New snow"
                value={formatMeasurement(day?.snowfall_in, ' in', 1)}
                detail="Forecast daily total"
                unavailable={day?.snowfall_in == null}
              />
              <MetricCard
                label="Wind"
                value={formatMeasurement(hour?.windspeed_mph, ' mph')}
                detail={`Gusts ${formatMeasurement(hour?.windgusts_mph, ' mph')}`}
                unavailable={hour?.windspeed_mph == null}
              />
              <MetricCard
                label="Visibility"
                value={formatMeasurement(day?.min_visibility_mi, ' mi', 1)}
                detail="Forecast daily minimum"
                unavailable={day?.min_visibility_mi == null}
              />
            </View>
          </View>

          <Card tone="raised">
            <AppText variant="label" tone="faint">Freezing level</AppText>
            <AppText variant="title">{formatMeasurement(freezingLevel, ' ft')}</AppText>
            <AppText tone="soft">{freezingRelation}</AppText>
          </Card>

          <HourlyForecast conditions={conditions} elevation={elevation} />
          <FiveDayForecast conditions={conditions} elevation={elevation} />
        </>
      )}

      <OperationsCard conditions={conditions} />

      <FreshnessBlock
        weather={conditions.weather_metadata}
        operationsFetchedAt={conditions.ski_conditions?.fetched_at}
      />
      <ActionButton label="Refresh forecast" onPress={onRetry} secondary />
    </View>
  );
}

function HourlyForecast({ conditions, elevation }: { conditions: ResortConditions; elevation: ElevationKey }) {
  const theme = useSkiTheme();
  return (
    <View style={styles.section}>
      <SectionHeading eyebrow="Forecast detail" title="Next 12 hours" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourlyRow}>
        {conditions.next_12_hours.map((snapshot) => {
          const point = snapshot[elevation];
          return (
            <View
              accessible
              accessibilityLabel={`${formatTime(snapshot.time)}, ${formatMeasurement(point.temperature_f, ' degrees')}, wind ${formatMeasurement(point.windspeed_mph, ' miles per hour')}`}
              key={snapshot.time}
              style={[styles.hour, { backgroundColor: theme.surface, borderColor: theme.line }]}>
              <AppText variant="support" tone="soft">{formatTime(snapshot.time)}</AppText>
              <AppText variant="title">{formatMeasurement(point.temperature_f, '°')}</AppText>
              <AppText variant="support" tone="soft">
                Wind {formatMeasurement(point.windspeed_mph, ' mph')}
              </AppText>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function FiveDayForecast({ conditions, elevation }: { conditions: ResortConditions; elevation: ElevationKey }) {
  const theme = useSkiTheme();
  return (
    <View style={styles.section}>
      <SectionHeading eyebrow="Three-day decision window" title="Five-day outlook" />
      <View style={styles.dailyList}>
        {conditions.forecast.slice(0, 5).map((forecast, index) => {
          const point = forecast[elevation];
          const outlook = index >= 3;
          return (
            <View
              accessible
              accessibilityLabel={`${formatDate(forecast.date)}, high ${formatMeasurement(point.high_f, ' degrees')}, low ${formatMeasurement(point.low_f, ' degrees')}, snow ${formatMeasurement(point.snowfall_in, ' inches', 1)}${outlook ? ', outlook' : ''}`}
              key={forecast.date}
              style={[
                styles.day,
                { backgroundColor: theme.surface, borderColor: theme.line },
                outlook && styles.outlook,
              ]}>
              <View style={styles.dayTitle}>
                <AppText variant="support">{formatDate(forecast.date)}</AppText>
                {outlook ? <AppText variant="label" tone="faint">Outlook</AppText> : null}
              </View>
              <View style={styles.dayMetrics}>
                <AppText variant="support">{formatMeasurement(point.high_f, '°')} / {formatMeasurement(point.low_f, '°')}</AppText>
                <AppText variant="support" tone="soft">Snow {formatMeasurement(point.snowfall_in, ' in', 1)}</AppText>
                <AppText variant="support" tone="soft">Wind {formatMeasurement(point.max_windspeed_mph, ' mph')}</AppText>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function OperationsCard({ conditions }: { conditions: ResortConditions }) {
  const lifts = conditions.ski_conditions?.lifts;
  const snow = conditions.ski_conditions?.snow;
  if (!conditions.ski_conditions || (!lifts && !snow)) {
    return (
      <Notice title="Resort operations unknown">
        Resort-reported lift, trail, and surface data are unavailable. Unknown does not mean closed.
      </Notice>
    );
  }

  return (
    <Card>
      <SectionHeading eyebrow="Optional resort provider" title="Resort operations" />
      <AppText tone="soft">{lifts?.resort_status ?? 'Status not reported'}</AppText>
      <View style={styles.operations}>
        <OperationValue label="Lifts" open={lifts?.lifts_open} total={lifts?.lifts_total} />
        <OperationValue label="Runs" open={lifts?.runs_open} total={lifts?.runs_total} />
        <OperationValue label="Surface" text={snow?.conditions} />
      </View>
    </Card>
  );
}

function OperationValue({
  label,
  open,
  total,
  text,
}: {
  label: string;
  open?: number | null;
  total?: number | null;
  text?: string | null;
}) {
  const value = text ?? (open == null || total == null ? 'Unavailable' : `${open} / ${total}`);
  return (
    <View style={styles.operationValue}>
      <AppText variant="label" tone="faint">{label}</AppText>
      <AppText variant="support">{value}</AppText>
    </View>
  );
}

function describeFreezingLevel(
  freezingLevel: number | null | undefined,
  elevation: number | null | undefined,
): string {
  if (freezingLevel == null || elevation == null) return 'Relation to this elevation is unavailable.';
  if (freezingLevel <= elevation) return `At or below ${elevationLabelFromFeet(elevation)}; wintry precipitation is more likely.`;
  return `${Math.round(freezingLevel - elevation).toLocaleString()} ft above this elevation.`;
}

function elevationLabelFromFeet(elevation: number): string {
  return `${Math.round(elevation).toLocaleString()} ft`;
}

const styles = StyleSheet.create({
  nav: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  back: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: minimumTargetSize,
    paddingHorizontal: spacing.md,
  },
  pressed: { opacity: 0.72 },
  loading: { paddingTop: spacing.xxxl },
  detail: { gap: spacing.xxl },
  hero: { gap: spacing.xs, paddingTop: spacing.xxl },
  cardHeading: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' },
  cardHeadingCopy: { flex: 1, gap: spacing.xs },
  forecastPill: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  section: { gap: spacing.md },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  hourlyRow: { gap: spacing.sm, paddingRight: spacing.lg },
  hour: { borderRadius: radius.md, borderWidth: 1, gap: spacing.sm, minWidth: 118, padding: spacing.md },
  dailyList: { gap: spacing.sm },
  day: { borderRadius: radius.md, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  outlook: { opacity: 0.62 },
  dayTitle: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  dayMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'space-between' },
  operations: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  operationValue: { gap: spacing.xs, minWidth: 80 },
});
