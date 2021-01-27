import { createMuiTheme } from '@material-ui/core/styles';

export const colors = {
  blue: "#2F80ED",
  red: '#ed4337',
  orange: '#ffb347',
  lightBlack: 'rgba(0, 0, 0, 0.87)'
};

const coreTheme = {
  shape: {
    borderRadius: '10px'
  },
  typography: {
    fontFamily: [
      'Inter',
      'Arial',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h1: {   // Portfolio balance numbers
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.167,
      letterSpacing: '2px'
    },
    h2: {   // Navigation tabs / section headers
      fontSize: '1.2rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    h3: {    // yearn title text YEARN
      fontFamily: [
        'Druk Wide Bold',
        'Inter',
        'Arial',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'sans-serif',
      ],
      fontSize: '1.5rem',
      fontWeight: 700,
      lineHeight: 1.167,
    },
    h4: {   // yearn title text finance
      fontSize: '1.5rem',
      letterSpacing: '0.3rem',
      fontWeight: 300,
      lineHeight: 1.167,
    },
    h5: {   // card headers
      fontSize: '0.9rem',
      fontWeight: 700,
      lineHeight: 1.167,
    },
    h6: {   // card headers
      fontSize: '1.5rem',
      fontWeight: 700,
      lineHeight: 1.167,
      letterSpacing: '2px'
    },
    subtitle1: {
      fontSize: '0.9rem',
      fontWeight: 300,
      lineHeight: 1.167,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 300,
      lineHeight: 1.167,
    }
  },
  palette: {
    primary: {
      main: 'rgba(0, 0, 0, 0.87)',
    },
    secondary: {
      main: '#EFEFEF',
    },
  },
  overrides: {
    MuiButton: {
      sizeLarge: {
        padding: '19px 24px',
        minWidth: '150px'
      },
      textSizeLarge: {
        fontSize: '3rem'
      }
    },
    MuiDialog: {
      paperWidthSm: {
        maxWidth: '800px'
      }
    },
    MuiToggleButton: {
      root: {
        flex: 1,
        padding: '12px 6px'
      }
    },
    MuiSnackbar : {
      root: {
        maxWidth: 'calc(100vw - 24px)'
      },
      anchorOriginBottomLeft: {
        bottom: '12px',
        left: '12px',
        '@media (min-width: 960px)': {
          bottom: '50px',
          left: '80px'
        }
      }
    },
  }
}


export default coreTheme;
