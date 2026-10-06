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
    background: '#121212',
    surface: '#1E1E1E',
    surfaceBorder: '#2C2C2C',
    textPrimary: '#F8F9FA',
    textSecondary: '#A0A0A0',
    primary: '#0D6EFD',
    primaryDanger: '#E63946',
    accent: '#0D6EFD',
    tabBarBackground: '#1E1E1E',
    tabBarBorder: '#2C2C2C',
    tabBarActive: '#0D6EFD',
    tabBarInactive: '#A0A0A0',
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
