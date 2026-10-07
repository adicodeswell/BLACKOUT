export const lightTheme = {
  mode: 'light' as 'light' | 'dark',
  colors: {
    background: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceBorder: '#E9ECEF',
    textPrimary: '#1A1D20',
    textSecondary: '#6C757D',
    primary: '#0D6EFD',
    primaryDanger: '#DC3545',
    accent: '#0D6EFD',
    tabBarBackground: '#FFFFFF',
    tabBarBorder: '#E9ECEF',
    tabBarActive: '#0D6EFD',
    tabBarInactive: '#6C757D',

    // Semantic Emergency & Severity Colors
    severityCritical: '#DC3545',
    severityHigh: '#FD7E14',
    severityMedium: '#D97706',
    severityLow: '#0D6EFD',
    severityUnknown: '#6C757D',

    // Confidence Badges
    confidenceConfirmed: '#198754',
    confidenceHigh: '#0D6EFD',
    confidenceLikely: '#6F42C1',
    confidenceUnverified: '#6C757D',

    // Status Badges
    statusOpen: '#DC3545',
    statusMonitoring: '#D97706',
    statusResolved: '#198754',
    statusExpired: '#6C757D',

    // Alert Surfaces
    warningBg: '#FFF3CD',
    warningBorder: '#FFECB5',
    warningText: '#664D03',

    dangerBg: '#F8D7DA',
    dangerBorder: '#F5C2C7',
    dangerText: '#842029',

    infoBg: '#CFF4FC',
    infoBorder: '#B6EFFB',
    infoText: '#055160',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    headerSize: 22,
    subheaderSize: 16,
    bodySize: 14,
    captionSize: 12,
  },
};

export const darkTheme: typeof lightTheme = {
  mode: 'dark',
  colors: {
    background: '#0D0F12',
    surface: '#16191E',
    surfaceBorder: '#262A33',
    textPrimary: '#F8F9FA',
    textSecondary: '#9CA3AF',
    primary: '#3B82F6',
    primaryDanger: '#EF4444',
    accent: '#3B82F6',
    tabBarBackground: '#16191E',
    tabBarBorder: '#262A33',
    tabBarActive: '#3B82F6',
    tabBarInactive: '#6B7280',

    // Semantic Emergency & Severity Colors
    severityCritical: '#EF4444',
    severityHigh: '#F97316',
    severityMedium: '#F59E0B',
    severityLow: '#3B82F6',
    severityUnknown: '#6B7280',

    // Confidence Badges
    confidenceConfirmed: '#10B981',
    confidenceHigh: '#3B82F6',
    confidenceLikely: '#8B5CF6',
    confidenceUnverified: '#6B7280',

    // Status Badges
    statusOpen: '#EF4444',
    statusMonitoring: '#F59E0B',
    statusResolved: '#10B981',
    statusExpired: '#6B7280',

    // Alert Surfaces
    warningBg: '#2D2305',
    warningBorder: '#4A3B0B',
    warningText: '#FCD34D',

    dangerBg: '#2C0B0E',
    dangerBorder: '#4C1D24',
    dangerText: '#FCA5A5',

    infoBg: '#0A2540',
    infoBorder: '#103B66',
    infoText: '#7DD3FC',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    headerSize: 22,
    subheaderSize: 16,
    bodySize: 14,
    captionSize: 12,
  },
};

export type Theme = typeof lightTheme;

