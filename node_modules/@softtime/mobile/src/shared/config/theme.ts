import { Platform } from 'react-native';

// ─── Colors ────────────────────────────────────────────────────────────────

export const colors = {
  // Primary
  primary: '#1877F2',
  primaryLight: '#EBF2FF',
  primaryDark: '#1057B8',

  // Backgrounds
  bg: '#F4F7FA',
  surface: '#FFFFFF',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',

  // Borders
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',

  // Semantic — Success
  success: '#22C55E',
  successLight: '#DCFCE7',
  successText: '#15803D',

  // Semantic — Warning
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningText: '#92400E',

  // Semantic — Danger
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  dangerText: '#991B1B',

  // Semantic — Info
  info: '#1877F2',
  infoLight: '#EBF2FF',
  infoText: '#1D4ED8',

  // Semantic — Neutral
  neutral: '#6B7280',
  neutralLight: '#F3F4F6',
  neutralText: '#374151',
} as const;

// ─── Spacing (base unit: 4px) ───────────────────────────────────────────────

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  12: 48,
} as const;

// ─── Border Radius ──────────────────────────────────────────────────────────

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 26,
  full: 9999,
} as const;

// ─── Typography (Manrope) ───────────────────────────────────────────────────

export const fontFamily = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semiBold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
} as const;

export const typography = {
  xs: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fontFamily.regular,
  },
  sm: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fontFamily.regular,
  },
  base: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fontFamily.regular,
  },
  baseMedium: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: fontFamily.medium,
  },
  lg: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fontFamily.semiBold,
  },
  xl: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: fontFamily.bold,
  },
  '2xl': {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: fontFamily.bold,
  },
  '3xl': {
    fontSize: 30,
    lineHeight: 38,
    fontFamily: fontFamily.bold,
  },
} as const;

// ─── Shadows ────────────────────────────────────────────────────────────────

export const shadows = {
  xs: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 1,
    },
    android: { elevation: 1 },
    default: {},
  }),
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
    android: { elevation: 2 },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    android: { elevation: 8 },
    default: {},
  }),
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1.5,
    },
    android: { elevation: 2 },
    default: {},
  }),
} as const;

// ─── Layout ─────────────────────────────────────────────────────────────────

export const layout = {
  screenPadding: space[4],
  cardPadding: space[4],
  sectionGap: space[6],
  listItemGap: space[3],
  tabBarHeight: 64,
  topBarHeight: 56,
} as const;

// ─── Icons ──────────────────────────────────────────────────────────────────

export const iconSize = {
  sm: 16,
  md: 20,
  lg: 24,
} as const;

export const iconStrokeWidth = 1.5;

// ─── Composite export ────────────────────────────────────────────────────────

const theme = {
  colors,
  space,
  radius,
  fontFamily,
  typography,
  shadows,
  layout,
  iconSize,
  iconStrokeWidth,
} as const;

export type Theme = typeof theme;
export default theme;
