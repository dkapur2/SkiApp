import type { PropsWithChildren } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import type { ElevationKey } from '@/api/contracts';
import { AppText } from '@/components/typography';
import { minimumTargetSize, radius, spacing, useSkiTheme } from '@/design/tokens';
import { elevationLabel, formatAge } from '@/utils/forecast';

export function Card({ children, tone = 'surface' }: PropsWithChildren<{ tone?: 'surface' | 'raised' }>) {
  const theme = useSkiTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme[tone], borderColor: theme.line },
      ]}>
      {children}
    </View>
  );
}

export function SectionHeading({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <View style={styles.sectionHeading}>
      {eyebrow ? <AppText variant="label" tone="faint">{eyebrow}</AppText> : null}
      <AppText variant="heading" accessibilityRole="header">{title}</AppText>
    </View>
  );
}

export function ElevationControl({
  value,
  onChange,
}: {
  value: ElevationKey;
  onChange: (value: ElevationKey) => void;
}) {
  const theme = useSkiTheme();
  const options: ElevationKey[] = ['base', 'mid', 'peak'];
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Forecast elevation"
      style={[styles.segmented, { backgroundColor: theme.segmented }]}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={`${elevationLabel(option)} elevation`}
            key={option}
            onPress={() => onChange(option)}
            style={({ pressed }) => [
              styles.segment,
              selected && { backgroundColor: theme.surface, borderColor: theme.line },
              pressed && styles.pressed,
            ]}>
            <AppText variant="support" tone={selected ? 'text' : 'soft'}>
              {elevationLabel(option)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  unavailable = false,
}: {
  label: string;
  value: string;
  detail: string;
  unavailable?: boolean;
}) {
  const theme = useSkiTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}. ${detail}`}
      style={[styles.metric, { backgroundColor: theme.raised, borderColor: theme.line }]}>
      <AppText variant="label" tone="faint">{label}</AppText>
      <AppText variant="heading" tone={unavailable ? 'faint' : 'text'}>{value}</AppText>
      <AppText variant="support" tone="soft">{detail}</AppText>
    </View>
  );
}

export function Notice({
  title,
  children,
  tone = 'warning',
}: PropsWithChildren<{ title: string; tone?: 'warning' | 'brand' }>) {
  const theme = useSkiTheme();
  const backgroundColor = tone === 'warning' ? theme.warningSoft : theme.brandSoft;
  const foreground = tone === 'warning' ? 'warning' : 'brand';
  return (
    <View
      accessibilityRole="alert"
      style={[styles.notice, { backgroundColor, borderColor: theme.line }]}>
      <AppText variant="support" tone={foreground}>{title}</AppText>
      <AppText variant="support" tone="soft">{children}</AppText>
    </View>
  );
}

export function FreshnessBlock({
  weatherReceivedAt,
  operationsFetchedAt,
}: {
  weatherReceivedAt: number;
  operationsFetchedAt?: string | null;
}) {
  const theme = useSkiTheme();
  return (
    <View style={[styles.sources, { borderTopColor: theme.line }]}>
      <AppText variant="label" tone="faint">Sources & freshness</AppText>
      <View style={styles.sourceRow}>
        <AppText variant="support">Weather forecast</AppText>
        <AppText variant="support" tone="soft">Retrieved {formatAge(weatherReceivedAt)}</AppText>
      </View>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Open Open-Meteo weather data source"
        onPress={() => void Linking.openURL('https://open-meteo.com/')}
        style={({ pressed }) => [styles.linkTarget, pressed && styles.pressed]}>
        <AppText variant="support" tone="brand">Weather data by Open-Meteo.com · CC BY 4.0</AppText>
      </Pressable>
      <View style={styles.sourceRow}>
        <AppText variant="support">Resort operations</AppText>
        <AppText variant="support" tone="soft">
          {operationsFetchedAt ? `Retrieved ${formatAge(operationsFetchedAt)}` : 'Unavailable'}
        </AppText>
      </View>
      <AppText variant="support" tone="faint">
        Weather values are forecasts, not observations. No condition rating or recommendation is inferred.
      </AppText>
    </View>
  );
}

export function ForecastSkeleton({ label = 'Loading forecast' }: { label?: string }) {
  const theme = useSkiTheme();
  return (
    <View accessibilityLabel={label} accessibilityRole="progressbar" style={styles.skeletonStack}>
      {[0, 1, 2].map((item) => (
        <View
          key={item}
          style={[
            styles.skeleton,
            { backgroundColor: theme.segmented },
            item === 1 && styles.skeletonShort,
          ]}
        />
      ))}
      <AppText variant="support" tone="soft">{label}…</AppText>
    </View>
  );
}

export function ActionButton({
  label,
  onPress,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  const theme = useSkiTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        {
          backgroundColor: secondary ? theme.surface : theme.brand,
          borderColor: secondary ? theme.line : theme.brand,
        },
        pressed && styles.pressed,
      ]}>
      <AppText variant="support" style={{ color: secondary ? theme.text : theme.onBrand }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionHeading: {
    gap: spacing.xs,
  },
  segmented: {
    borderRadius: radius.md,
    flexDirection: 'row',
    padding: spacing.xs,
  },
  segment: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: radius.sm,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: minimumTargetSize,
  },
  pressed: {
    opacity: 0.72,
  },
  metric: {
    borderRadius: radius.md,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    gap: spacing.xs,
    minHeight: 126,
    padding: spacing.md,
  },
  notice: {
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  sources: {
    borderTopWidth: 1,
    gap: spacing.md,
    paddingTop: spacing.xl,
  },
  sourceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  linkTarget: {
    justifyContent: 'center',
    minHeight: minimumTargetSize,
  },
  skeletonStack: {
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  skeleton: {
    borderRadius: radius.sm,
    height: 72,
    width: '100%',
  },
  skeletonShort: {
    height: 24,
    width: '68%',
  },
  action: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: minimumTargetSize,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
});
