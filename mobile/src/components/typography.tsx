import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { typography, useSkiTheme } from '@/design/tokens';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'support' | 'label';

type AppTextProps = PropsWithChildren<TextProps & {
  tone?: 'text' | 'soft' | 'faint' | 'brand' | 'warning';
  variant?: Variant;
}>;

export function AppText({ children, style, tone = 'text', variant = 'body', ...props }: AppTextProps) {
  const theme = useSkiTheme();
  return (
    <Text
      {...props}
      style={[
        styles.base,
        typography[variant],
        { color: theme[tone] },
        variant === 'label' && styles.label,
        style,
      ]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: typography.family,
  },
  label: {
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
});
