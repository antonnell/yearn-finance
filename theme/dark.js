import { createMuiTheme } from "@material-ui/core/styles";
import coreTheme from "./coreTheme";

// Create a theme instance.
const theme = createMuiTheme({
  ...coreTheme,
  palette: {
    ...coreTheme.palette,
    background: {
      default: "#131929",
      paper: "#161B2C"
    },
    primary: {
      main: "#6c6c7b"
    },
    type: "dark"
  },
  overrides: {
    ...coreTheme.overrides,
    MuiSnackbarContent: {
      root: {
        color: "#fff",
        backgroundColor: "#2A2E3C",
        padding: "0px",
        minWidth: "auto",
        "@media (min-width: 960px)": {
          minWidth: "500px"
        }
      },
      message: {
        padding: "0px"
      },
      action: {
        marginRight: "0px"
      }
    },
    MuiTooltip: {
      tooltip: {
        background: "#FFF !important",
        border: "1px solid #fff",
        borderRadius: "8px",
        color: "#30323c",
        fontSize: "13px",
        padding: '15px 20px',
        textAlign: 'center',
      },
      arrow: {
        color: '#FFF',
      }
    }
  }
});

export default theme;
