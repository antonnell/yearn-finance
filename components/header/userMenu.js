import React from 'react';
import { withStyles, withTheme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
// Customisation
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Avatar from '@material-ui/core/Avatar';
import Tooltip from '@material-ui/core/Tooltip';

import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
// Icons
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import AccountBalanceWalletOutlinedIcon from '@material-ui/icons/AccountBalanceWalletOutlined';
import SwapHorizOutlinedIcon from '@material-ui/icons/SwapHorizOutlined';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import AssignmentOutlinedIcon from '@material-ui/icons/AssignmentOutlined';
import LinkOutlinedIcon from '@material-ui/icons/LinkOutlined';

import UserMenuAvatar from './userMenuAvatar';
import { formatAddress } from '../../utils';
import { Web3ReactProvider, useWeb3React } from "@web3-react/core";

import stores from '../../stores';

import classes from './userMenu.module.css';

const StyledMenu = withStyles({
  root: {
    flexGrow: 1,
  },
  paper: {
    border: '1px solid rgba(128,128,128,0.2)',
    borderRadius: '5px',
    fontSize: '12px',
    padding: '0',
    minWidth: '420px',
  },
})((props) => (
  <Menu
    elevation={0}
    getContentAnchorEl={null}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
    {...props}
  />
));

const StyledMenuItem = withStyles((theme) => ({
  root: {
    '&:focus': {
      backgroundColor: theme.palette.primary.main,
      '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
        color: theme.palette.common.white,
      },
    },
  },
}))(MenuItem);

function CustomizedMenus(props) {

  const { loginClicked, account, switchProvider } = props;


  const context = useWeb3React();

  const {
    connector,
    deactivate,
  } = context;

  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event) => {
    console.log(account);
    if (account && account.address) {
      setAnchorEl(event.currentTarget);
    } else {
      loginClicked()
    }
  };

  const switchP = () => {
    switchProvider()
  }

  const disconnectWallet = () => {
  // console.log('account store in user menu');
    // console.log(stores.accountStore, '---ad: ', stores.accountStore.store.account.address);
    // stores.accountStore.disconnectAccount();
    props.logout()

  };

  const handleClose = () => {
    setAnchorEl(null);
  };
console.log(account)
  return (
    <div className={classes.root}>
      <Button disableElevation      className={classes.accountButton}
          variant="contained"
          color={props.theme.palette.type === 'dark' ? 'primary' : 'secondary'} aria-controls="user-menu" aria-haspopup="true"  onClick={handleClick}>
            {account  && <div className={`${classes.accountIcon} ${classes.metamask}`}></div>}
            <Typography className={classes.headBtnTxt}>{account ? formatAddress(account.address) : 'Connect Wallet'}</Typography>
      </Button>
      <StyledMenu className={classes.usermenu} id="user-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
        <div className={classes.menuheader}>
          <Grid className={classes.userGrid} container spacing={0}>
            <Grid className={classes.one} item sm={2}>
              <UserMenuAvatar />
            </Grid>
            <Grid className={classes.two} item sm={6}>
              <div className={classes.walletTitle}>{account  ? formatAddress(account.address) : 'Connect Wallet'}</div>
              <div className={classes.walletProvider}>Metamask</div>
            </Grid>
            <Grid container spacing={4} sm={4}>
              <Grid className={classes.three} item sm={4}>
                <Tooltip title="Add Label">
                  <EditOutlinedIcon className={classes.walletActionIcon} />
                </Tooltip>
              </Grid>
              <Grid className={classes.four} item sm={4}>
                <Tooltip title="Copy Address">
                  <AssignmentOutlinedIcon className={classes.walletActionIcon} />
                </Tooltip>
              </Grid>
              <Grid className={classes.five} item sm={4}>
                <Tooltip title="Copy Link">
                  <LinkOutlinedIcon className={classes.walletActionIcon} />
                </Tooltip>
              </Grid>
            </Grid>
          </Grid>
        </div>
        <StyledMenuItem className={classes.userMenuItem}  onClick={switchProvider}>
          <ListItemIcon>
            <SwapHorizOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Switch Wallet Provider" />
        </StyledMenuItem>
        {/* <StyledMenuItem className={classes.userMenuItem}>
          <ListItemIcon>
            <AccountBalanceWalletOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Manage Addresses" />
        </StyledMenuItem> */}
        <StyledMenuItem className={classes.userMenuItem} onClick={disconnectWallet}>
          <ListItemIcon>
            <ExitToAppIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Disconnect" />
        </StyledMenuItem>
      </StyledMenu>
    </div>
  );
}
export default  withTheme(CustomizedMenus)