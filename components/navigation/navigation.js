import React, { useState, useEffect } from 'react';
import { Typography, Paper, Switch, Button } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles';
import { withStyles } from '@material-ui/core/styles';

import AttachMoneyIcon from '@material-ui/icons/AttachMoney';
import BarChartIcon from '@material-ui/icons/BarChart';

import { useRouter } from 'next/router'
import MenuIcon from '@material-ui/icons/Menu';
import CloseIcon from '@material-ui/icons/Close';
import WbSunnyOutlinedIcon from '@material-ui/icons/WbSunnyOutlined';
import Brightness2Icon from '@material-ui/icons/Brightness2';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';

import Unlock from '../unlock'

import stores from '../../stores'
import { formatAddress } from '../../utils'

import classes from './navigation.module.css'

const StyledSwitch = withStyles((theme) => ({
  root: {
    width: 58,
    height: 32,
    padding: 0,
    margin: theme.spacing(1),
  },
  switchBase: {
    padding: 1,
    '&$checked': {
      transform: 'translateX(28px)',
      color: '#212529',
      '& + $track': {
        backgroundColor: '#ffffff',
        opacity: 1,
      },
    },
    '&$focusVisible $thumb': {
      color: '#ffffff',
      border: '6px solid #fff',
    }
  },
  thumb: {
    width: 24,
    height: 24,
  },
  track: {
    borderRadius: 32 / 2,
    border: `1px solid #212529`,
    backgroundColor: '#212529',
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

function Navigation(props) {
  const router = useRouter()


  const account = stores.accountStore.getStore('account')

  const [ darkMode, setDarkMode ] = useState(props.theme.palette.type === 'dark' ? true : false);
  const [ unlockOpen, setUnlockOpen ] = useState(false);
  const [ menuOpen, setMenuOpen ] = useState(false)

  function handleNavigate(route) {
    router.push(route)
  }

  const onMenuClicked = () => {
    setMenuOpen(!menuOpen)
  }

  const handleToggleChange = (event, val) => {
    setDarkMode(val)
    props.changeTheme(val)
  }

  const onAddressClicked = () => {
    setUnlockOpen(true)
  }

  const closoeUnlock = () => {
    setUnlockOpen(false)
  }

  useEffect(function() {
    const localStorageDarkMode = window.localStorage.getItem('yearn.finance-dark-mode')
    setDarkMode(localStorageDarkMode ? localStorageDarkMode === 'dark' : false)
  },[]);


  const activePath = router.pathname

  const renderNavs = () => {
    return (<React.Fragment>
      <div className={ (activePath.includes('/invest') || activePath === '/') ? classes.navigationOptionActive : classes.navigationOption } onClick={ () => { handleNavigate('/invest') }}>
        <div className={ classes.navigationOptionIcon_invest } ></div>
        <Typography variant='h2'>Invest</Typography>
      </div>
      { account && account.address &&
        <div className={ activePath.includes('/cover') ? classes.navigationOptionActive : classes.navigationOption } onClick={ () => { handleNavigate('/cover') }}>
          <div className={ classes.navigationOptionIcon_insure } ></div>
          <Typography variant='h2'>Cover</Typography>
        </div>
      }
      { account && account.address &&
        <div className={ activePath.includes('/lend') ? classes.navigationOptionActive : classes.navigationOption } onClick={ () => { handleNavigate('/lend') }}>
          <div className={ classes.navigationOptionIcon_lending } ></div>
          <Typography variant='h2'>Lend</Typography>
        </div>
      }
      <div className={ activePath.includes('/stats') ? classes.navigationOptionActive : classes.navigationOption } onClick={ () => { handleNavigate('/stats') }}>
        <BarChartIcon className={ classes.navigationOptionIcon } />
        <Typography variant='h2'>Stats</Typography>
      </div>
    </React.Fragment>)
  }

  return (
    <div className={ classes.navigationContainer }>
      <div className={ classes.navigationHeading }>
        <Typography variant='h3'>YEARN</Typography>
        <Typography variant='h4'>finance</Typography>
      </div>

      <div className={ classes.navigationContent }>
        { renderNavs() }
      </div>

      { menuOpen && <Paper elevation={ 0  } className={ classes.navigationContentMobile }>
        <div className={ classes.menuIcon }>
          <Button
            color={ props.theme.palette.type === 'light' ? 'primary' : 'secondary' }
            onClick={ onMenuClicked }
            disableElevation
            >
            <CloseIcon fontSize={ 'large' } />
          </Button>
        </div>
        <div className={ classes.navigationHeading }>
          <Typography variant='h3'>YEARN</Typography>
          <Typography variant='h4'>finance</Typography>
        </div>
        <div className={ classes.navigationContentNavs }>
          { renderNavs() }
        </div>
        <div className={ classes.headerThings }>

          <div className={ classes.themeSelectContainer }>
            <StyledSwitch
              icon={ <Brightness2Icon className={ classes.switchIcon }/> }
              checkedIcon={ <WbSunnyOutlinedIcon className={ classes.switchIcon }/> }
              checked={ darkMode }
              onChange={ handleToggleChange }
            />
          </div>
          <Button
            disableElevation
            className={ classes.accountButton }
            variant='contained'
            color='secondary'
            onClick={ onAddressClicked }
            >
            <div className={ `${classes.accountIcon} ${classes.metamask}` }></div>
            <Typography variant='h5'>{ account ? formatAddress(account.address) : 'Connect Wallet' }</Typography>
          </Button>

          { unlockOpen && (
            <Unlock modalOpen={ unlockOpen } closeModal={ closoeUnlock } />
          )}

        </div>
      </Paper> }

      <div className={ classes.menuIcon }>
        <Button
          color={ props.theme.palette.type === 'light' ? 'primary' : 'secondary' }
          onClick={ onMenuClicked }
          disableElevation
          >
          <MenuIcon fontSize={ 'large' } />
        </Button>
      </div>

      { props.backClicked && (
        <div className={ classes.backButtonContainer}>
          <div className={ classes.backButton }>
            <Button
              color={ props.theme.palette.type === 'light' ? 'primary' : 'secondary' }
              onClick={ props.backClicked }
              disableElevation
              >
              <ArrowBackIcon fontSize={ 'large' } />
            </Button>
          </div>
        </div>
      )}

      <div className={ classes.socials }>
        <a className={ `${classes.socialButton}` } href='https://twitter.com/iearnfinance' target='_blank' rel="noopener noreferrer" >
          <svg version="1.1" width="24" height="24" viewBox="0 0 24 24">
            <path fill={ props.theme.palette.type === 'light' ? '#212529' : '#FFF' } d="M22.46,6C21.69,6.35 20.86,6.58 20,6.69C20.88,6.16 21.56,5.32 21.88,4.31C21.05,4.81 20.13,5.16 19.16,5.36C18.37,4.5 17.26,4 16,4C13.65,4 11.73,5.92 11.73,8.29C11.73,8.63 11.77,8.96 11.84,9.27C8.28,9.09 5.11,7.38 3,4.79C2.63,5.42 2.42,6.16 2.42,6.94C2.42,8.43 3.17,9.75 4.33,10.5C3.62,10.5 2.96,10.3 2.38,10C2.38,10 2.38,10 2.38,10.03C2.38,12.11 3.86,13.85 5.82,14.24C5.46,14.34 5.08,14.39 4.69,14.39C4.42,14.39 4.15,14.36 3.89,14.31C4.43,16 6,17.26 7.89,17.29C6.43,18.45 4.58,19.13 2.56,19.13C2.22,19.13 1.88,19.11 1.54,19.07C3.44,20.29 5.7,21 8.12,21C16,21 20.33,14.46 20.33,8.79C20.33,8.6 20.33,8.42 20.32,8.23C21.16,7.63 21.88,6.87 22.46,6Z" />
          </svg>
        </a>
        <a className={ `${classes.socialButton}` } href='https://medium.com/iearn' target='_blank' rel="noopener noreferrer" >
          <svg width="100%" viewBox="0 0 256 256" version="1.1">
            <g>
              <rect fill={ props.theme.palette.type === 'light' ? '#212529' : '#FFF' } x="0" y="0" width="256" height="256"></rect>
              <path d="M61.0908952,85.6165814 C61.3045665,83.5054371 60.4994954,81.4188058 58.9230865,79.9979257 L42.8652446,60.6536969 L42.8652446,57.7641026 L92.7248438,57.7641026 L131.263664,142.284737 L165.145712,57.7641026 L212.676923,57.7641026 L212.676923,60.6536969 L198.947468,73.8174045 C197.763839,74.719636 197.176698,76.2025173 197.421974,77.670197 L197.421974,174.391342 C197.176698,175.859021 197.763839,177.341902 198.947468,178.244134 L212.355766,191.407842 L212.355766,194.297436 L144.91283,194.297436 L144.91283,191.407842 L158.802864,177.923068 C160.16778,176.558537 160.16778,176.157205 160.16778,174.070276 L160.16778,95.8906948 L121.54867,193.97637 L116.329871,193.97637 L71.3679139,95.8906948 L71.3679139,161.628966 C70.9930375,164.392788 71.9109513,167.175352 73.8568795,169.174019 L91.9219516,191.086776 L91.9219516,193.97637 L40.6974359,193.97637 L40.6974359,191.086776 L58.7625081,169.174019 C60.6942682,167.172038 61.5586577,164.371016 61.0908952,161.628966 L61.0908952,85.6165814 Z" fill={ props.theme.palette.type === 'light' ? '#FFF' : '#212529' }></path>
            </g>
          </svg>
        </a>
        <a className={ `${classes.socialButton}` } href='https://discord.com/invite/6PNv2nF/' target='_blank' rel="noopener noreferrer" >
          <svg version="1.1" width="24" height="24" viewBox="0 0 24 24">
            <path fill={ props.theme.palette.type === 'light' ? '#212529' : '#FFF' } d="M22,24L16.75,19L17.38,21H4.5A2.5,2.5 0 0,1 2,18.5V3.5A2.5,2.5 0 0,1 4.5,1H19.5A2.5,2.5 0 0,1 22,3.5V24M12,6.8C9.32,6.8 7.44,7.95 7.44,7.95C8.47,7.03 10.27,6.5 10.27,6.5L10.1,6.33C8.41,6.36 6.88,7.53 6.88,7.53C5.16,11.12 5.27,14.22 5.27,14.22C6.67,16.03 8.75,15.9 8.75,15.9L9.46,15C8.21,14.73 7.42,13.62 7.42,13.62C7.42,13.62 9.3,14.9 12,14.9C14.7,14.9 16.58,13.62 16.58,13.62C16.58,13.62 15.79,14.73 14.54,15L15.25,15.9C15.25,15.9 17.33,16.03 18.73,14.22C18.73,14.22 18.84,11.12 17.12,7.53C17.12,7.53 15.59,6.36 13.9,6.33L13.73,6.5C13.73,6.5 15.53,7.03 16.56,7.95C16.56,7.95 14.68,6.8 12,6.8M9.93,10.59C10.58,10.59 11.11,11.16 11.1,11.86C11.1,12.55 10.58,13.13 9.93,13.13C9.29,13.13 8.77,12.55 8.77,11.86C8.77,11.16 9.28,10.59 9.93,10.59M14.1,10.59C14.75,10.59 15.27,11.16 15.27,11.86C15.27,12.55 14.75,13.13 14.1,13.13C13.46,13.13 12.94,12.55 12.94,11.86C12.94,11.16 13.45,10.59 14.1,10.59Z" />
          </svg>
        </a>
      </div>
    </div>
  )
}


export default withTheme(Navigation)
