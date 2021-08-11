import { createMuiTheme } from "@material-ui/core/styles";
import { red } from "@material-ui/core/colors";
import coreTheme from "./coreTheme";

// Create a theme instance.
const theme = createMuiTheme({
  ...coreTheme,
  palette: {
    ...coreTheme.palette,
    background: {
      default: "#F0F2F5",
      paper: "#ffffff"
    },
    type: "light"
  },
  overrides: {
    ...coreTheme.overrides,
    MuiSnackbarContent: {
      root: {
        color: "rgba(0, 0, 0, 0.87)",
        backgroundColor: "#F8F9FE",
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
    headerContainer: {
      root: {
        backgroundColor: "#FF00aa"
      }
    },
    MuiTooltip: {
      tooltip: {
        background: "#141928 !important",
        border: "1px solid #141928",
        borderRadius: "8px",
        color: "#FFF",
        fontSize: "13px",
        padding: '15px 20px',
        textAlign: 'center',
      },
      arrow: {
        color: '#141928',
      }
    },
  }
});

export default theme;
