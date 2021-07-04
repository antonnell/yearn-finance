import React, { useState, useEffect } from 'react';

import { Typography, Switch, Button } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { withTheme } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import InputBase from '@material-ui/core/InputBase';

import WbSunnyOutlinedIcon from '@material-ui/icons/WbSunnyOutlined';
import Brightness2Icon from '@material-ui/icons/Brightness2';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';

import { CONNECT_WALLET, ACCOUNT_CONFIGURED, ACCOUNT_CHANGED } from '../../stores/constants';

import Unlock from '../unlock';

import stores from '../../stores';
import { formatAddress } from '../../utils';

import classes from './header.module.css';
import HelpIcon from '@material-ui/icons/Help';
import AboutModal from './aboutModal';
import SearchModal from './searchModal';
import { useHotkeys } from 'react-hotkeys-hook';

const StyledSwitch = withStyles((theme) => ({
  root: {
    width: 58,
    height: 32,
    padding: 0,
    margin: theme.spacing(1),
  },
  switchBase: {
    paddingTop: 1.5,
    width: '75%',
    margin: 'auto',
    '&$checked': {
      transform: 'translateX(28px)',
      color: 'rgba(128,128,128, 1)',
      width: '30%',
      '& + $track': {
        backgroundColor: 'rgba(0,0,0, 0.3)',
        opacity: 1,
      },
    },
    '&$focusVisible $thumb': {
      color: '#ffffff',
      border: '6px solid #fff',
    },
  },
  track: {
    borderRadius: 32 / 2,
    border: '1px solid rgba(128,128,128, 0.2)',
    backgroundColor: 'rgba(0,0,0, 0)',
    opacity: 1,
    transition: theme.transitions.create(['background-color', 'border']),
  },
  checked: {},
  focusVisible: {},
}))(({ classes, ...props }) => {
  return (
    <Switch
      focusVisibleClassName={classes.focusVisible}
      disableRipple
      classes={{
        root: classes.root,
        switchBase: classes.switchBase,
        thumb: classes.thumb,
        track: classes.track,
        checked: classes.checked,
      }}
      {...props}
    />
  );
});

function Header(props) {

  const accountStore = stores.accountStore.getStore('account');

  const [account, setAccount] = useState(accountStore);
  const [toggleAboutModal, setToggleAboutModal] = useState(false);
  const [toggleSearchModal, setToggleSearchModal] = useState(false);
  const [darkMode, setDarkMode] = useState(props.theme.palette.type === 'dark' ? true : false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [chainInvalid, setChainInvalid] = useState(false)

  useHotkeys('ctrl+k', () => setToggleSearchModal(true), { filterPreventDefault: true });
  useHotkeys('cmd+k', () => setToggleSearchModal(true));
  useHotkeys('/', () => setToggleSearchModal(true));

  useEffect(() => {
    const accountConfigure = () => {
      const accountStore = stores.accountStore.getStore('account');
      setAccount(accountStore);
      closeUnlock();
    };
    const connectWallet = () => {
      onAddressClicked();
    };
    const accountChanged = () => {
      const invalid = stores.accountStore.getStore('chainInvalid');
      setChainInvalid(invalid)
    }

    const invalid = stores.accountStore.getStore('chainInvalid');
    setChainInvalid(invalid)

    stores.emitter.on(ACCOUNT_CONFIGURED, accountConfigure);
    stores.emitter.on(CONNECT_WALLET, connectWallet);
    stores.emitter.on(ACCOUNT_CHANGED, accountChanged);
    return () => {
      stores.emitter.removeListener(ACCOUNT_CONFIGURED, accountConfigure);
      stores.emitter.removeListener(CONNECT_WALLET, connectWallet);
      stores.emitter.removeListener(ACCOUNT_CHANGED, accountChanged);
    };
  }, []);

  const handleToggleChange = (event, val) => {
    setDarkMode(val);
    props.changeTheme(val);
  };

  const onAddressClicked = () => {
    setUnlockOpen(true);
  };

  const closeUnlock = () => {
    setUnlockOpen(false);
  };

  useEffect(function () {
    const localStorageDarkMode = window.localStorage.getItem('yearn.finance-dark-mode');
    setDarkMode(localStorageDarkMode ? localStorageDarkMode === 'dark' : false);
  }, []);
  useEffect(function () {
    var mac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);

    if (mac) {
      setIsMac(true);
    }
  }, []);

  return (
    <Paper elevation={0} className={classes.headerContainer}>
        {props.backClicked && (
          <div className={classes.backButton}>
            <Button color={props.theme.palette.type === 'light' ? 'primary' : 'secondary'} onClick={props.backClicked} disableElevation>
              <ArrowBackIcon fontSize={'medium'} />
            </Button>
          </div>
        )}{' '}
        <div className={classes.instantSearch}
            component="form"
            style={{ display: 'flex', marginRight: '15px' }}
            onClick={(e) => {
              setToggleSearchModal(!toggleSearchModal);
              e.preventDefault();
            }}
          >
            <InputBase
              style={{ paddingi: '20px', marginLeft: '15px', flex: 1 }}
              placeholder="Instant Search ⚡"
              inputProps={{ 'aria-label': 'search google maps' }}
            />
            <span type="submit" aria-label="search">
              <p className={classes.shortcutInfo}>{isMac ? `Cmd+K` : `⊞ Win+K`} or /</p>
            </span>
        </div>
        <div className={classes.themeSelectContainer}>
          <StyledSwitch
            icon={<Brightness2Icon className={classes.switchIcon} />}
            checkedIcon={<WbSunnyOutlinedIcon className={classes.switchIcon} />}
            checked={darkMode}
            onChange={handleToggleChange}
          />
        </div>
        <Button
          disableElevation
          className={classes.accountButton}
          variant="contained"
          color={props.theme.palette.type === 'dark' ? 'primary' : 'secondary'}
          startIcon={<HelpIcon />}
          onClick={() => setToggleAboutModal(!toggleAboutModal)}
        >
          <Typography>Need help?</Typography>
        </Button>
        <Button
          disableElevation
          className={classes.accountButton}
          variant="contained"
          color={props.theme.palette.type === 'dark' ? 'primary' : 'secondary'}
          onClick={onAddressClicked}>
          {account && account.address && <div className={`${classes.accountIcon} ${classes.metamask}`}></div>}
          <Typography>{account && account.address ? formatAddress(account.address) : 'Connect Wallet'}</Typography>
        </Button>
        {unlockOpen && <Unlock modalOpen={unlockOpen} closeModal={closeUnlock} />}
        {toggleAboutModal && <AboutModal setToggleAboutModal={setToggleAboutModal} />}
        {toggleSearchModal && <SearchModal setToggleSearchModal={setToggleSearchModal} />}

        {chainInvalid ? (
          <div className={classes.chainInvalidError}>
            The chain you're connected to isn't supported. Please check that your wallet is connected to Ethereum Mainnet.
          </div>
        ) : null}
    </Paper>
  );
}

export default withTheme(Header);
