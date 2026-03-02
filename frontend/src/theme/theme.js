import { createTheme, alpha } from '@mui/material/styles';

const COLORS = {
  navy: '#050B18',
  navyMid: '#0A1628',
  navyLight: '#112240',
  cyan: '#00E5FF',
  cyanDim: '#00B8D9',
  red: '#FF3366',
  green: '#00E676',
  amber: '#FFB300',
  purple: '#7C4DFF',
  white: '#E8F4FD',
  textMuted: '#8899AA',
};

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: COLORS.cyan,
      light: '#4DFDFF',
      dark: COLORS.cyanDim,
      contrastText: COLORS.navy,
    },
    secondary: {
      main: COLORS.red,
      light: '#FF6699',
      dark: '#CC0044',
    },
    success: { main: COLORS.green },
    warning: { main: COLORS.amber },
    error: { main: COLORS.red },
    background: {
      default: COLORS.navy,
      paper: COLORS.navyMid,
    },
    text: {
      primary: COLORS.white,
      secondary: COLORS.textMuted,
    },
  },
  typography: {
    fontFamily: "'Sora', sans-serif",
    h1: { fontWeight: 800, letterSpacing: '-0.03em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.015em' },
    h4: { fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    body1: { fontWeight: 400, lineHeight: 1.7 },
    body2: { fontWeight: 400, lineHeight: 1.6 },
    caption: { fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem' },
    overline: { fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.15em', fontWeight: 500 },
    button: { fontWeight: 600, letterSpacing: '0.02em' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: `radial-gradient(ellipse at 20% 50%, ${alpha(COLORS.cyan, 0.05)} 0%, transparent 60%), 
                            radial-gradient(ellipse at 80% 20%, ${alpha(COLORS.purple, 0.05)} 0%, transparent 60%)`,
          backgroundAttachment: 'fixed',
          scrollbarWidth: 'thin',
          scrollbarColor: `${COLORS.navyLight} ${COLORS.navy}`,
        },
        '::-webkit-scrollbar': { width: '6px' },
        '::-webkit-scrollbar-track': { background: COLORS.navy },
        '::-webkit-scrollbar-thumb': { background: COLORS.navyLight, borderRadius: '3px' },
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: COLORS.navyMid,
          border: `1px solid ${alpha(COLORS.cyan, 0.1)}`,
          backdropFilter: 'blur(20px)',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: alpha(COLORS.cyan, 0.3),
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 40px ${alpha(COLORS.cyan, 0.08)}`,
          },
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.cyanDim})`,
          color: COLORS.navy,
          boxShadow: `0 4px 20px ${alpha(COLORS.cyan, 0.3)}`,
          '&:hover': {
            boxShadow: `0 6px 30px ${alpha(COLORS.cyan, 0.5)}`,
            transform: 'translateY(-1px)',
          }
        },
        outlinedPrimary: {
          borderColor: alpha(COLORS.cyan, 0.5),
          '&:hover': { borderColor: COLORS.cyan, backgroundColor: alpha(COLORS.cyan, 0.08) }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: { fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem' }
      }
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: alpha(COLORS.cyan, 0.2) },
            '&:hover fieldset': { borderColor: alpha(COLORS.cyan, 0.4) },
            '&.Mui-focused fieldset': { borderColor: COLORS.cyan },
          }
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: COLORS.navyMid,
          borderRight: `1px solid ${alpha(COLORS.cyan, 0.1)}`,
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(COLORS.navyMid, 0.9),
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(COLORS.cyan, 0.1)}`,
          boxShadow: 'none',
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: alpha(COLORS.cyan, 0.08),
        },
        head: {
          backgroundColor: COLORS.navyLight,
          fontWeight: 600,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: COLORS.textMuted,
        }
      }
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, backgroundColor: alpha(COLORS.cyan, 0.1) },
        bar: { borderRadius: 4, background: `linear-gradient(90deg, ${COLORS.cyanDim}, ${COLORS.cyan})` }
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10 }
      }
    }
  }
});

export const RISK_COLORS = {
  low: COLORS.green,
  medium: COLORS.amber,
  high: '#FF6600',
  critical: COLORS.red,
};

export const CHART_COLORS = [
  COLORS.cyan, COLORS.purple, COLORS.red, COLORS.green, 
  COLORS.amber, '#FF6B9D', '#00B8A9', '#F8B500'
];

export { COLORS };