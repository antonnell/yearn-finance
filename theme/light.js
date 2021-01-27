import { createMuiTheme } from '@material-ui/core/styles';
import { red } from '@material-ui/core/colors';
import coreTheme from './coreTheme';

// Create a theme instance.
const theme = createMuiTheme({
  ...coreTheme,
  palette: {
    ...coreTheme.palette,
    background: {
      default: '#fff',
      paper: '#F2F3F8'
    },
    accountButton: {
      default: '#EFEFEF'
    },
    type: 'light',
  },
  overrides: {
    ...coreTheme.overrides,
    MuiSnackbarContent: {
      root: {
        color: 'rgba(0, 0, 0, 0.87)',
        backgroundColor: '#F2F3F8',
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
