import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { maxAppWidth, spacing, useSkiTheme } from '@/design/tokens';

type AppScreenProps = PropsWithChildren<{
  footer?: ReactNode;
  testID?: string;
}>;

export function AppScreen({ children, footer, testID }: AppScreenProps) {
  const theme = useSkiTheme();

  return (
    <View style={[styles.canvas, { backgroundColor: theme.canvas }]} testID={testID}>
      <SafeAreaView style={[styles.app, { backgroundColor: theme.app }]} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
        {footer}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    alignItems: 'center',
  },
  app: {
    flex: 1,
    width: '100%',
    maxWidth: maxAppWidth,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
});
