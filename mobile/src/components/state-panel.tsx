import { StyleSheet, View } from 'react-native';

import { ActionButton, Card } from '@/components/forecast-ui';
import { AppText } from '@/components/typography';
import { spacing } from '@/design/tokens';

type StateKind = 'error' | 'offline' | 'insufficient';

const COPY: Record<StateKind, { eyebrow: string; title: string; body: string }> = {
  error: {
    eyebrow: 'Forecast unavailable',
    title: 'We could not load this mountain',
    body: 'The service returned an unexpected response. Your selection is still here, so you can try again.',
  },
  offline: {
    eyebrow: 'No connection',
    title: 'You appear to be offline',
    body: 'Reconnect and retry. SkiTheEast will never turn a missing forecast into zero conditions.',
  },
  insufficient: {
    eyebrow: 'Not enough data',
    title: 'A safe forecast cannot be shown',
    body: 'Required weather fields are missing for this elevation. Choose another elevation or try again later.',
  },
};

export function StatePanel({ kind, onRetry }: { kind: StateKind; onRetry?: () => void }) {
  const copy = COPY[kind];
  return (
    <View style={styles.wrap}>
      <Card>
        <AppText variant="label" tone={kind === 'error' ? 'warning' : 'faint'}>{copy.eyebrow}</AppText>
        <AppText variant="title" accessibilityRole="header">{copy.title}</AppText>
        <AppText tone="soft">{copy.body}</AppText>
        {onRetry ? <ActionButton label="Try again" onPress={onRetry} /> : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: spacing.xxxl,
  },
});
