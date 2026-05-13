// src/theme.js
// src/theme.js
export const colors = {
  // Gradient backgrounds — mauve/lavande comme la photo
  gradientStart: '#E8E0FF',
  gradientMid:   '#D4C8F5',
  gradientEnd:   '#C9BFEF',

  // Accents
  primary:       '#9B7FD4',   // violet moyen
  primaryLight:  '#C4B0E8',
  secondary:     '#B89EE8',   // lavande
  secondaryLight:'#D4C5F5',

  // Status
  success:  '#6DC9A0',
  warning:  '#F5C27A',
  danger:   '#F07070',
  dangerLight: '#FFE5E5',

  // Neutrals
  white:      '#FFFFFF',
  background: '#EDE6FF',
  cardBg:     'rgba(255,255,255,0.75)',
  border:     'rgba(155,127,212,0.2)',

  // Text
  textPrimary:   '#2D1F5E',
  textSecondary: '#7A6BA0',
  textMuted:     '#B8ACCC',

  // Tab bar
  tabActive:   '#9B7FD4',
  tabInactive: '#C4B5D9',
};

export const fonts = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 26,
    xxxl: 32,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  full: 999,
};

export const shadow = {
  soft: {
    shadowColor: '#B89EE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  medium: {
    shadowColor: '#E8709A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
};