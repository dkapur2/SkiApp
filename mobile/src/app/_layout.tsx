import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';

import { useSkiTheme } from '@/design/tokens';

export default function RootLayout() {
  const theme = useSkiTheme();
  const isStaticRender = process.env.EXPO_OS === 'web' && typeof window === 'undefined';
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: isStaticRender ? Infinity : 60 * 60_000,
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          animation: 'fade_from_bottom',
          contentStyle: { backgroundColor: theme.app },
          headerShown: false,
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="resorts/[resortId]" />
      </Stack>
    </QueryClientProvider>
  );
}
