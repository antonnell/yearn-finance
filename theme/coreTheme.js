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
      letterSpacing: '2px',
      ['@media (max-width:576px)']: { // eslint-disable-line no-useless-computed-key
        fontSize: '1.6rem'
      }
    },
    h2: {   // Navigation tabs / section headers
      fontSize: '1.2rem',
      fontWeight: 500,
      lineHeight: 1.5,
      ['@media (max-width:576px)']: { // eslint-disable-line no-useless-computed-key
        fontSize: '1rem'
      }
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
      ['@media (max-width:576px)']: { // eslint-disable-line no-useless-computed-key
        fontSize: '1.2rem'
      }
    },
    h4: {   // yearn title text finance
      fontSize: '1.5rem',
      letterSpacing: '0.3rem',
      fontWeight: 300,
      lineHeight: 1.167,
      ['@media (max-width:576px)']: { // eslint-disable-line no-useless-computed-key
        fontSize: '1.2rem'
      }
    },
    h5: {   // card headers
      fontSize: '0.9rem',
      fontWeight: 700,
      lineHeight: 1.167,
      ['@media (max-width:576px)']: { // eslint-disable-line no-useless-computed-key
        fontSize: '0.7rem'
      }
    },
    h6: {   // card headers
      fontSize: '1.5rem',
      fontWeight: 700,
      lineHeight: 1.167,
      letterSpacing: '2px',
      ['@media (max-width:576px)']: { // eslint-disable-line no-useless-computed-key
        fontSize: '1.2rem'
      }
    },
    subtitle1: {
      fontSize: '0.9rem',
      fontWeight: 300,
      lineHeight: 1.167,
      ['@media (max-width:576px)']: { // eslint-disable-line no-useless-computed-key
        fontSize: '0.7rem'
      }
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 300,
      lineHeight: 1.167,
      ['@media (max-width:576px)']: { // eslint-disable-line no-useless-computed-key
        fontSize: '0.8rem'
      }
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
        fontSize: '3rem',
        ['@media (max-width:576px)']: { // eslint-disable-line no-useless-computed-key
          fontSize: '2.4rem'
        }
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
