import { createMuiTheme } from '@material-ui/core/styles';
import coreTheme from './coreTheme';

// Create a theme instance.
const theme = createMuiTheme({
  ...coreTheme,
  palette: {
    ...coreTheme.palette,
    background: {
      default: '#0b0b0f',
      paper: '#20202e'
    },
    primary: {
      main: '#2F80ED',
    },
    type: 'dark',
  },
  overrides: {
    ...coreTheme.overrides,
    MuiSnackbarContent: {
      root: {
        color: '#fff',
        backgroundColor: '#20202e',
        padding: '0px',
        minWidth: 'auto',
        '@media (min-width: 960px)': {
          minWidth: '500px',
        }
      },
      message: {
        padding: '0px'
      },
      action: {
        marginRight: '0px'
      }
    },
  }
});

export default theme;
