// Font declarations for use in the application
export const fonts = {
  sans: '"Assistant", "Heebo", sans-serif',
  serif: '"Playfair Display", serif',
  accent: '"Cormorant Garamond", serif'
};

// Font weights
export const fontWeights = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700
};

// Custom font styles for specific elements
export const fontStyles = {
  heading: {
    fontFamily: fonts.serif,
    fontWeight: fontWeights.bold,
    color: 'hsl(var(--foreground))'
  },
  headingPrimary: {
    fontFamily: fonts.serif,
    fontWeight: fontWeights.bold,
    color: 'hsl(var(--primary))'
  },
  body: {
    fontFamily: fonts.sans,
    fontWeight: fontWeights.regular,
    color: 'hsl(var(--foreground))'
  },
  accent: {
    fontFamily: fonts.accent,
    fontWeight: fontWeights.medium,
    color: 'hsl(var(--foreground))'
  }
};
