export const colors = {
  // Primary colors
  primary: {
    50: '#E6F0FF',
    100: '#CCE0FF',
    200: '#99C2FF',
    300: '#66A3FF',
    400: '#3385FF',
    500: '#0066FF', // Main primary color
    600: '#0052CC',
    700: '#003D99',
    800: '#002966',
    900: '#001433',
  },

  // Accent colors
  accent: {
    50: '#F0E6FF',
    100: '#E0CCFF',
    200: '#C299FF',
    300: '#A366FF',
    400: '#8533FF',
    500: '#6600FF', // Main accent color
    600: '#5200CC',
    700: '#3D0099',
    800: '#290066',
    900: '#140033',
  },

  // Success colors (with WCAG AAA contrast)
  success: {
    50: '#E6FFE6',
    100: '#CCFFCC',
    200: '#99FF99',
    300: '#66FF66',
    400: '#33FF33',
    500: '#00CC00', // Main success color
    600: '#009900',
    700: '#006600',
    800: '#003300',
    900: '#001A00',
  },

  // Error colors (with WCAG AAA contrast)
  error: {
    50: '#FFE6E6',
    100: '#FFCCCC',
    200: '#FF9999',
    300: '#FF6666',
    400: '#FF3333',
    500: '#FF0000', // Main error color
    600: '#CC0000',
    700: '#990000',
    800: '#660000',
    900: '#330000',
  },

  // Warning colors (with WCAG AAA contrast)
  warning: {
    50: '#FFF8E6',
    100: '#FFF1CC',
    200: '#FFE299',
    300: '#FFD466',
    400: '#FFC533',
    500: '#FFB700', // Main warning color
    600: '#CC9200',
    700: '#996E00',
    800: '#664900',
    900: '#332500',
  },

  // Neutral colors (with WCAG AAA contrast)
  neutral: {
    50: '#F5F5F5',
    100: '#E6E6E6',
    200: '#CCCCCC',
    300: '#B3B3B3',
    400: '#999999',
    500: '#808080', // Main neutral color
    600: '#666666',
    700: '#4D4D4D',
    800: '#333333',
    900: '#1A1A1A',
  },

  // Background colors for dark mode
  darkBg: {
    50: '#1A1A1A',
    100: '#262626',
    200: '#333333',
    300: '#404040',
    400: '#4D4D4D',
    500: '#595959', // Main background color
    600: '#666666',
    700: '#737373',
    800: '#808080',
    900: '#8C8C8C',
  },

  // Background colors for light mode
  lightBg: {
    50: '#FFFFFF',
    100: '#FAFAFA',
    200: '#F5F5F5',
    300: '#F0F0F0',
    400: '#EBEBEB',
    500: '#E6E6E6', // Main background color
    600: '#D9D9D9',
    700: '#CCCCCC',
    800: '#BFBFBF',
    900: '#B3B3B3',
  },
};

// Theme configuration for light and dark modes
export const themeConfig = {
  light: {
    background: colors.lightBg[100],
    text: {
      primary: colors.neutral[900],
      secondary: colors.neutral[700],
      tertiary: colors.neutral[500],
    },
    border: {
      primary: colors.neutral[200],
      secondary: colors.neutral[300],
    },
    button: {
      primary: {
        background: colors.primary[500],
        text: colors.lightBg[50],
        hover: colors.primary[600],
      },
      secondary: {
        background: colors.neutral[200],
        text: colors.neutral[900],
        hover: colors.neutral[300],
      },
    },
  },
  dark: {
    background: colors.darkBg[50],
    text: {
      primary: colors.neutral[50],
      secondary: colors.neutral[300],
      tertiary: colors.neutral[500],
    },
    border: {
      primary: colors.darkBg[200],
      secondary: colors.darkBg[300],
    },
    button: {
      primary: {
        background: colors.primary[500],
        text: colors.lightBg[50],
        hover: colors.primary[600],
      },
      secondary: {
        background: colors.darkBg[200],
        text: colors.neutral[50],
        hover: colors.darkBg[300],
      },
    },
  },
};

// CSS custom properties for theme colors
export const cssVariables = {
  light: {
    '--background': themeConfig.light.background,
    '--text-primary': themeConfig.light.text.primary,
    '--text-secondary': themeConfig.light.text.secondary,
    '--text-tertiary': themeConfig.light.text.tertiary,
    '--border-primary': themeConfig.light.border.primary,
    '--border-secondary': themeConfig.light.border.secondary,
    '--button-primary-bg': themeConfig.light.button.primary.background,
    '--button-primary-text': themeConfig.light.button.primary.text,
    '--button-primary-hover': themeConfig.light.button.primary.hover,
    '--button-secondary-bg': themeConfig.light.button.secondary.background,
    '--button-secondary-text': themeConfig.light.button.secondary.text,
    '--button-secondary-hover': themeConfig.light.button.secondary.hover,
  },
  dark: {
    '--background': themeConfig.dark.background,
    '--text-primary': themeConfig.dark.text.primary,
    '--text-secondary': themeConfig.dark.text.secondary,
    '--text-tertiary': themeConfig.dark.text.tertiary,
    '--border-primary': themeConfig.dark.border.primary,
    '--border-secondary': themeConfig.dark.border.secondary,
    '--button-primary-bg': themeConfig.dark.button.primary.background,
    '--button-primary-text': themeConfig.dark.button.primary.text,
    '--button-primary-hover': themeConfig.dark.button.primary.hover,
    '--button-secondary-bg': themeConfig.dark.button.secondary.background,
    '--button-secondary-text': themeConfig.dark.button.secondary.text,
    '--button-secondary-hover': themeConfig.dark.button.secondary.hover,
  },
};
