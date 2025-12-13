/**
 * RidePro Theme
 *
 * A bold, modern theme with acid lime accent colors and Lufga typography.
 * Color palette: #EDEC88 (acid lime), #FAE27A (gold), #050505 (dark), #FAFAFA (light)
 */
import { extendTheme, type ThemeConfig } from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools';
import type { StyleFunctionProps } from '@chakra-ui/styled-system';

// Use system color mode by default, user can override
const config: ThemeConfig = {
  initialColorMode: 'system',
  useSystemColorMode: true,
};

// RidePro color palette
const colors = {
  // Primary brand color - Acid Lime (#EDEC88)
  brand: {
    50: '#fdfde8',
    100: '#fafac5',
    200: '#f6f6a3',
    300: '#f2f295',
    400: '#edec88', // Primary acid lime
    500: '#d5d47a', // Slightly darker for contrast
    600: '#bcbb6c',
    700: '#a3a25e',
    800: '#8a8950',
    900: '#717042',
  },
  // Secondary color - Gold (#FAE27A)
  gold: {
    50: '#fffef0',
    100: '#fef9d9',
    200: '#fdf3b3',
    300: '#fced8d',
    400: '#fae27a', // Gold accent
    500: '#e1ca6e',
    600: '#c4af60',
    700: '#a79352',
    800: '#8a7744',
    900: '#6d5b36',
  },
  // Dark backgrounds (#050505 based)
  dark: {
    50: '#e6e6e6',
    100: '#b3b3b3',
    200: '#808080',
    300: '#4d4d4d',
    400: '#262626',
    500: '#1a1a1a',
    600: '#121212',
    700: '#0a0a0a',
    800: '#050505', // Primary dark
    900: '#000000',
  },
  // Light backgrounds (#FAFAFA based)
  light: {
    50: '#ffffff',
    100: '#fefefe',
    200: '#fdfdfd',
    300: '#fcfcfc',
    400: '#fafafa', // Primary light
    500: '#f5f5f5',
    600: '#eeeeee',
    700: '#e0e0e0',
    800: '#bdbdbd',
    900: '#9e9e9e',
  },
  // Navy for dark mode panels
  navy: {
    700: '#0f0f0f',
    800: '#0a0a0a',
    900: '#050505',
  },
  success: {
    500: '#22c55e',
  },
  warning: {
    500: '#f59e0b',
  },
  danger: {
    500: '#ef4444',
  },
  // Zone colors for workout visualization
  zones: {
    warmUp: '#3b82f6',    // Blue
    active: '#ef4444',     // Red
    rest: '#22c55e',       // Green
    coolDown: '#8b5cf6',   // Purple
    threshold: '#f59e0b',  // Amber
    vo2max: '#ec4899',     // Pink
  },
};

// Purity UI inspired shadow tokens
const shadows = {
  purity: '0px 3.5px 5.5px rgba(0, 0, 0, 0.02)',
  purityMd: '0px 7px 23px rgba(0, 0, 0, 0.05)',
  purityLg: '0px 20px 27px rgba(0, 0, 0, 0.05)',
  // Dark mode shadows (subtle glow effect)
  purityDark: '0px 7px 23px rgba(0, 0, 0, 0.2)',
};

// Purity UI border radius (15px is the signature)
const radii = {
  none: '0',
  sm: '4px',
  base: '8px',
  md: '12px',
  lg: '15px',    // Purity UI signature
  xl: '15px',    // Purity UI signature
  '2xl': '20px',
  '3xl': '24px',
  full: '9999px',
};

// Custom component styles with Purity UI aesthetics
const components = {
  Button: {
    baseStyle: {
      fontWeight: '600',
      borderRadius: '15px',
      _focus: {
        boxShadow: 'none',
      },
    },
    variants: {
      solid: (props: StyleFunctionProps) => ({
        bg: props.colorScheme === 'brand' ? 'brand.400' : `${props.colorScheme}.500`,
        color: props.colorScheme === 'brand' ? 'dark.800' : 'white', // Dark text on lime
        _hover: {
          bg: props.colorScheme === 'brand' ? 'brand.500' : `${props.colorScheme}.600`,
          transform: 'translateY(-1px)',
          _disabled: {
            bg: props.colorScheme === 'brand' ? 'brand.400' : `${props.colorScheme}.500`,
            transform: 'none',
          },
        },
        _active: {
          transform: 'translateY(0)',
          bg: props.colorScheme === 'brand' ? 'brand.600' : `${props.colorScheme}.700`,
        },
      }),
      outline: (props: StyleFunctionProps) => ({
        borderColor: props.colorScheme === 'brand' ? 'brand.400' : `${props.colorScheme}.500`,
        color: props.colorScheme === 'brand' ? 'brand.500' : `${props.colorScheme}.500`,
        borderWidth: '2px',
        _hover: {
          bg: props.colorScheme === 'brand' ? 'brand.50' : mode('gray.50', 'whiteAlpha.100')(props),
        },
      }),
      ghost: (props: StyleFunctionProps) => ({
        color: mode('dark.300', 'light.700')(props),
        _hover: {
          bg: mode('light.600', 'dark.600')(props),
          color: mode('dark.800', 'white')(props),
        },
      }),
      // Gradient button with lime and gold
      gradient: {
        bgGradient: 'linear(to-r, brand.400, gold.400)',
        color: 'dark.800',
        _hover: {
          bgGradient: 'linear(to-r, brand.500, gold.500)',
          transform: 'translateY(-1px)',
        },
        _active: {
          transform: 'translateY(0)',
        },
      },
      // Gold accent variant
      gold: {
        bg: 'gold.400',
        color: 'dark.800',
        _hover: {
          bg: 'gold.500',
        },
      },
    },
    defaultProps: {
      variant: 'solid',
      colorScheme: 'brand',
    },
  },
  Card: {
    baseStyle: (props: StyleFunctionProps) => ({
      container: {
        bg: mode('white', 'navy.700')(props),
        borderRadius: '15px',
        boxShadow: mode('purity', 'purityDark')(props),
        borderWidth: '0',
        overflow: 'hidden',
        p: '22px',
      },
      header: {
        pb: 3,
      },
      body: {
        py: 0,
      },
      footer: {
        pt: 3,
      },
    }),
    variants: {
      elevated: (props: StyleFunctionProps) => ({
        container: {
          bg: mode('white', 'navy.700')(props),
          boxShadow: mode('purityMd', 'purityDark')(props),
        },
      }),
      glass: (props: StyleFunctionProps) => ({
        container: {
          bg: mode('whiteAlpha.800', 'whiteAlpha.50')(props),
          backdropFilter: 'blur(10px)',
          borderWidth: '1px',
          borderColor: mode('gray.200', 'whiteAlpha.100')(props),
        },
      }),
      // Panel variant from Purity UI
      panel: (props: StyleFunctionProps) => ({
        container: {
          bg: mode('white', 'navy.700')(props),
          borderRadius: '15px',
          boxShadow: mode('purity', 'purityDark')(props),
        },
      }),
    },
  },
  Input: {
    variants: {
      filled: (props: StyleFunctionProps) => ({
        field: {
          bg: mode('gray.100', 'navy.800')(props),
          borderRadius: '15px',
          borderWidth: '1px',
          borderColor: 'transparent',
          _hover: {
            bg: mode('gray.200', 'navy.700')(props),
          },
          _focus: {
            bg: mode('white', 'navy.800')(props),
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
          },
        },
      }),
      outline: (props: StyleFunctionProps) => ({
        field: {
          borderRadius: '15px',
          borderColor: mode('gray.200', 'gray.600')(props),
          _hover: {
            borderColor: mode('gray.300', 'gray.500')(props),
          },
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
          },
        },
      }),
    },
    defaultProps: {
      variant: 'filled',
    },
  },
  Select: {
    variants: {
      filled: (props: StyleFunctionProps) => ({
        field: {
          bg: mode('gray.100', 'navy.800')(props),
          borderRadius: '15px',
          borderWidth: '1px',
          borderColor: 'transparent',
          _hover: {
            bg: mode('gray.200', 'navy.700')(props),
          },
          _focus: {
            bg: mode('white', 'navy.800')(props),
            borderColor: 'brand.500',
          },
        },
      }),
    },
    defaultProps: {
      variant: 'filled',
    },
  },
  Modal: {
    baseStyle: (props: StyleFunctionProps) => ({
      dialog: {
        bg: mode('white', 'navy.700')(props),
        borderRadius: '15px',
        boxShadow: mode('purityLg', 'purityDark')(props),
      },
      header: {
        borderBottomWidth: '1px',
        borderColor: mode('gray.100', 'gray.700')(props),
        fontWeight: '600',
      },
      footer: {
        borderTopWidth: '1px',
        borderColor: mode('gray.100', 'gray.700')(props),
      },
    }),
  },
  Menu: {
    baseStyle: (props: StyleFunctionProps) => ({
      list: {
        bg: mode('white', 'navy.700')(props),
        borderRadius: '15px',
        boxShadow: mode('purityMd', 'purityDark')(props),
        borderWidth: '0',
        py: 2,
      },
      item: {
        bg: 'transparent',
        borderRadius: 'md',
        mx: 2,
        _hover: {
          bg: mode('gray.100', 'whiteAlpha.100')(props),
        },
        _focus: {
          bg: mode('gray.100', 'whiteAlpha.100')(props),
        },
      },
    }),
  },
  Tabs: {
    variants: {
      enclosed: (props: StyleFunctionProps) => ({
        tab: {
          borderRadius: '15px 15px 0 0',
          borderColor: mode('gray.200', 'gray.700')(props),
          fontWeight: '500',
          _selected: {
            bg: mode('white', 'navy.700')(props),
            borderColor: mode('gray.200', 'gray.600')(props),
            borderBottomColor: mode('white', 'navy.700')(props),
            color: 'brand.500',
          },
        },
        tablist: {
          borderColor: mode('gray.200', 'gray.700')(props),
        },
        tabpanel: {
          p: 4,
        },
      }),
      'soft-rounded': {
        tab: {
          borderRadius: '15px',
          fontWeight: '500',
          _selected: {
            bg: 'brand.500',
            color: 'white',
          },
        },
      },
      line: (props: StyleFunctionProps) => ({
        tab: {
          fontWeight: '500',
          _selected: {
            color: 'brand.500',
            borderColor: 'brand.500',
          },
        },
        tablist: {
          borderColor: mode('gray.200', 'gray.700')(props),
        },
      }),
    },
  },
  Badge: {
    baseStyle: {
      borderRadius: '8px',
      px: 2,
      py: 0.5,
      fontSize: 'xs',
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    variants: {
      subtle: (props: StyleFunctionProps) => ({
        bg: mode(`${props.colorScheme}.100`, `${props.colorScheme}.900`)(props),
        color: mode(`${props.colorScheme}.700`, `${props.colorScheme}.200`)(props),
      }),
      zone: (props: { colorScheme: string }) => ({
        bg: `zones.${props.colorScheme}`,
        color: 'white',
        borderRadius: 'full',
      }),
    },
  },
  Stat: {
    baseStyle: (props: StyleFunctionProps) => ({
      container: {
        bg: mode('white', 'navy.700')(props),
        p: '22px',
        borderRadius: '15px',
        boxShadow: mode('purity', 'purityDark')(props),
      },
      label: {
        color: mode('gray.500', 'gray.400')(props),
        fontSize: 'xs',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 'wider',
      },
      number: {
        color: mode('gray.800', 'white')(props),
        fontSize: '2xl',
        fontWeight: '700',
      },
      helpText: {
        color: mode('gray.500', 'gray.400')(props),
        fontSize: 'sm',
      },
    }),
  },
  Textarea: {
    variants: {
      filled: (props: StyleFunctionProps) => ({
        bg: mode('gray.100', 'navy.800')(props),
        borderRadius: '15px',
        borderWidth: '1px',
        borderColor: 'transparent',
        _hover: {
          bg: mode('gray.200', 'navy.700')(props),
        },
        _focus: {
          bg: mode('white', 'navy.800')(props),
          borderColor: 'brand.500',
          boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
        },
      }),
    },
    defaultProps: {
      variant: 'filled',
    },
  },
  Tooltip: {
    baseStyle: (props: StyleFunctionProps) => ({
      bg: mode('gray.700', 'gray.200')(props),
      color: mode('white', 'gray.800')(props),
      borderRadius: '8px',
      px: 3,
      py: 2,
      fontSize: 'sm',
      fontWeight: '500',
    }),
  },
  Drawer: {
    baseStyle: (props: StyleFunctionProps) => ({
      dialog: {
        bg: mode('white', 'navy.700')(props),
      },
      header: {
        borderBottomWidth: '1px',
        borderColor: mode('gray.100', 'gray.700')(props),
      },
    }),
  },
  Table: {
    variants: {
      simple: (props: StyleFunctionProps) => ({
        th: {
          color: mode('gray.500', 'gray.400')(props),
          fontSize: 'xs',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 'wider',
          borderColor: mode('gray.100', 'gray.700')(props),
        },
        td: {
          borderColor: mode('gray.100', 'gray.700')(props),
        },
        tbody: {
          tr: {
            _hover: {
              bg: mode('gray.50', 'whiteAlpha.50')(props),
            },
          },
        },
      }),
    },
  },
  Avatar: {
    baseStyle: {
      container: {
        borderRadius: '15px',
      },
    },
  },
  Switch: {
    baseStyle: {
      track: {
        _checked: {
          bg: 'brand.500',
        },
      },
    },
  },
  Checkbox: {
    baseStyle: {
      control: {
        borderRadius: '4px',
        _checked: {
          bg: 'brand.500',
          borderColor: 'brand.500',
        },
      },
    },
  },
};

// Lufga typography with system fallbacks
const fonts = {
  heading: '"Lufga", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  body: '"Lufga", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: '"JetBrains Mono", "Fira Code", monospace',
};

// Global styles
const styles = {
  global: (props: StyleFunctionProps) => ({
    'html, body': {
      fontFamily: '"Lufga", -apple-system, BlinkMacSystemFont, sans-serif',
    },
    body: {
      bg: mode('light.400', 'dark.800')(props), // #FAFAFA / #050505
      color: mode('dark.500', 'light.500')(props),
      lineHeight: '1.6',
    },
    '::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '::-webkit-scrollbar-track': {
      bg: mode('light.600', 'dark.700')(props),
    },
    '::-webkit-scrollbar-thumb': {
      bg: mode('light.800', 'dark.300')(props),
      borderRadius: 'full',
    },
    '::-webkit-scrollbar-thumb:hover': {
      bg: mode('light.900', 'dark.200')(props),
    },
    // Selection highlight with lime
    '::selection': {
      bg: 'brand.400',
      color: 'dark.800',
    },
  }),
};

// Semantic tokens for automatic dark/light mode
const semanticTokens = {
  colors: {
    'chakra-body-bg': {
      _light: 'light.400',  // #FAFAFA
      _dark: 'dark.800',    // #050505
    },
    'chakra-body-text': {
      _light: 'dark.500',
      _dark: 'light.500',
    },
    'bg-surface': {
      _light: 'white',
      _dark: 'dark.600',
    },
    'bg-subtle': {
      _light: 'light.600',
      _dark: 'dark.700',
    },
    'border-subtle': {
      _light: 'light.700',
      _dark: 'dark.400',
    },
    'text-muted': {
      _light: 'dark.200',
      _dark: 'light.800',
    },
    'text-subtle': {
      _light: 'dark.100',
      _dark: 'light.900',
    },
  },
};

export const theme = extendTheme({
  config,
  colors,
  shadows,
  radii,
  components,
  fonts,
  styles,
  semanticTokens,
});
