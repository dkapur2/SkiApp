import { Platform, useColorScheme } from 'react-native';

export const palettes = {
  light: {
    canvas: '#dfe7e8',
    app: '#f4f7f6',
    surface: '#ffffff',
    raised: '#f8faf9',
    text: '#102329',
    soft: '#52666b',
    faint: '#5f7378',
    line: '#dce5e4',
    brand: '#116b68',
    brandStrong: '#0a5352',
    brandSoft: '#d7efeb',
    onBrand: '#ffffff',
    warning: '#8f4a23',
    warningSoft: '#fae8dc',
    snow: '#dff5f8',
    sky: '#3f8fa5',
    signalFair: '#6e8286',
    segmented: '#e6eceb',
    switchOff: '#aebcbb',
    focus: '#1f7f96',
  },
  dark: {
    canvas: '#071216',
    app: '#0b171b',
    surface: '#102126',
    raised: '#14272c',
    text: '#edf6f4',
    soft: '#a8bab9',
    faint: '#8ba1a3',
    line: '#23373b',
    brand: '#67c7bd',
    brandStrong: '#8fddd4',
    brandSoft: '#173d3b',
    onBrand: '#07211f',
    warning: '#f2a675',
    warningSoft: '#3b281f',
    snow: '#16383f',
    sky: '#76c2d2',
    signalFair: '#8ba1a3',
    segmented: '#14272c',
    switchOff: '#3a5257',
    focus: '#76c2d2',
  },
} as const;

export type SkiTheme = (typeof palettes)[keyof typeof palettes];

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  family: Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui' }),
  display: { fontSize: 36, lineHeight: 40, fontWeight: '800' as const },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '800' as const },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '700' as const },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '500' as const },
  support: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '700' as const },
} as const;

export const maxAppWidth = 430;
export const minimumTargetSize = 44;

export function useSkiTheme(): SkiTheme {
  const systemTheme = useColorScheme();
  const visualTheme = __DEV__ ? process.env.EXPO_PUBLIC_VISUAL_THEME : undefined;
  if (visualTheme === 'light') return palettes.light;
  if (visualTheme === 'dark') return palettes.dark;
  return systemTheme === 'dark' ? palettes.dark : palettes.light;
}
