import React, { useState, useEffect } from 'react';
import { Typography, Paper, Switch, Button, SvgIcon } from '@material-ui/core'
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
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';

import Unlock from '../unlock'

import stores from '../../stores'
import { formatAddress } from '../../utils'

import classes from './navigation.module.css'

function InvestIcon(props) {
  const { color, altColor, className } = props
  return (
    <SvgIcon viewBox= "0, 0, 24, 24" className={ className }>
      <path
        fill={ color }
        d="M4.99222 12.9844C4.77499 12.9842 4.5636 13.0547 4.39002 13.1853C4.21643 13.3159 4.09009 13.4994 4.0301 13.7082C3.97011 13.917 3.97973 14.1396 4.05752 14.3424C4.1353 14.5453 4.27701 14.7172 4.46122 14.8324L7.14922 17.5204C7.24213 17.6132 7.35241 17.6869 7.47378 17.7371C7.59515 17.7873 7.72522 17.8131 7.85657 17.8131C7.98792 17.813 8.11797 17.7871 8.2393 17.7368C8.36064 17.6865 8.47087 17.6128 8.56371 17.5199C8.65656 17.427 8.7302 17.3167 8.78042 17.1953C8.83064 17.0739 8.85646 16.9439 8.85642 16.8125C8.85637 16.6812 8.83045 16.5511 8.78015 16.4298C8.72984 16.3085 8.65613 16.1982 8.56322 16.1054L7.44222 14.9854H14.9922C15.2574 14.9854 15.5118 14.88 15.6993 14.6925C15.8869 14.5049 15.9922 14.2506 15.9922 13.9854C15.9922 13.7202 15.8869 13.4658 15.6993 13.2783C15.5118 13.0907 15.2574 12.9854 14.9922 12.9854H4.99222V12.9844Z"/>
      <path
        fill={ color }
        d="M19.0054 11.0162C19.2226 11.0164 19.434 10.9459 19.6076 10.8153C19.7812 10.6847 19.9075 10.5011 19.9675 10.2924C20.0275 10.0836 20.0178 9.86096 19.9401 9.65813C19.8623 9.45531 19.7206 9.28333 19.5364 9.1682L16.8484 6.4802C16.6607 6.29269 16.4063 6.18741 16.141 6.1875C15.8757 6.18759 15.6214 6.29306 15.4339 6.4807C15.2464 6.66834 15.1411 6.92279 15.1412 7.18806C15.1413 7.45333 15.2467 7.70769 15.4344 7.8952L16.5554 9.0152H9.00537C8.74015 9.0152 8.4858 9.12056 8.29826 9.3081C8.11073 9.49563 8.00537 9.74999 8.00537 10.0152C8.00537 10.2804 8.11073 10.5348 8.29826 10.7223C8.4858 10.9098 8.74015 11.0152 9.00537 11.0152H19.0054V11.0162Z"/>
    </SvgIcon>
  )
}

function InvestIconSelected(props) {
  const { color, altColor, className } = props
  return (
    <SvgIcon viewBox= "0, 0, 48, 48" className={ className }>
      <rect
        width="48"
        height="48"
        rx="24"
        fill={ color }
      />
      <path
        fill={ altColor }
        d="M16.9922 24.9844C16.775 24.9842 16.5636 25.0547 16.39 25.1853C16.2164 25.3159 16.0901 25.4994 16.0301 25.7082C15.9701 25.917 15.9797 26.1396 16.0575 26.3424C16.1353 26.5453 16.277 26.7172 16.4612 26.8324L19.1492 29.5204C19.2421 29.6132 19.3524 29.6869 19.4738 29.7371C19.5951 29.7873 19.7252 29.8131 19.8566 29.8131C19.9879 29.813 20.118 29.7871 20.2393 29.7368C20.3606 29.6865 20.4709 29.6128 20.5637 29.5199C20.6566 29.427 20.7302 29.3167 20.7804 29.1953C20.8306 29.0739 20.8565 28.9439 20.8564 28.8125C20.8564 28.6812 20.8305 28.5511 20.7801 28.4298C20.7298 28.3085 20.6561 28.1982 20.5632 28.1054L19.4422 26.9854H26.9922C27.2574 26.9854 27.5118 26.88 27.6993 26.6925C27.8869 26.5049 27.9922 26.2506 27.9922 25.9854C27.9922 25.7202 27.8869 25.4658 27.6993 25.2783C27.5118 25.0907 27.2574 24.9854 26.9922 24.9854H16.9922V24.9844Z"/>
      <path
        fill={ altColor }
        d="M31.0054 23.0162C31.2226 23.0164 31.434 22.9459 31.6076 22.8153C31.7812 22.6847 31.9075 22.5011 31.9675 22.2924C32.0275 22.0836 32.0178 21.861 31.9401 21.6581C31.8623 21.4553 31.7206 21.2833 31.5364 21.1682L28.8484 18.4802C28.6607 18.2927 28.4063 18.1874 28.141 18.1875C27.8757 18.1876 27.6214 18.2931 27.4339 18.4807C27.2464 18.6683 27.1411 18.9228 27.1412 19.1881C27.1413 19.4533 27.2467 19.7077 27.4344 19.8952L28.5554 21.0152H21.0054C20.7402 21.0152 20.4858 21.1206 20.2983 21.3081C20.1107 21.4956 20.0054 21.75 20.0054 22.0152C20.0054 22.2804 20.1107 22.5348 20.2983 22.7223C20.4858 22.9098 20.7402 23.0152 21.0054 23.0152H31.0054V23.0162Z" />
    </SvgIcon>
  )

}

function CoverIcon(props) {
  const { color, altColor, className } = props
  return (
    <SvgIcon viewBox= "0, 0, 24, 24" className={ className }>
      <path
        fill={ color }
        d="M20.9949 6.90072C20.9783 6.73266 20.9193 6.57157 20.8235 6.43253C20.7276 6.29349 20.5981 6.18104 20.4469 6.10572L12.4469 2.10572C12.308 2.0362 12.1548 2 11.9994 2C11.8441 2 11.6909 2.0362 11.5519 2.10572L3.55194 6.10572C3.40122 6.18147 3.27206 6.29405 3.17643 6.43303C3.08081 6.572 3.02183 6.73287 3.00494 6.90072C2.99394 7.00772 2.04394 17.6677 11.5939 21.9147C11.7215 21.9723 11.8599 22.0021 11.9999 22.0021C12.1399 22.0021 12.2783 21.9723 12.4059 21.9147C21.9559 17.6677 21.0059 7.00872 20.9949 6.90072ZM11.9999 19.8977C5.23094 16.6257 4.91094 9.64272 4.96594 7.63572L11.9999 4.11872L19.0289 7.63372C19.0659 9.62272 18.7009 16.6517 11.9999 19.8977Z"/>
      <path
        fill={ color }
        d="M11 12.586L8.70697 10.293L7.29297 11.707L11 15.414L16.707 9.70697L15.293 8.29297L11 12.586Z"/>
    </SvgIcon>
  )
}

function CoverIconSelected(props) {
  const { color, altColor, className } = props
  return (
    <SvgIcon viewBox= "0, 0, 48, 48" className={ className }>
      <rect
        width="48"
        height="48"
        rx="24"
        fill={ color }/>
      <path
        fill={ altColor }
        d="M32.9949 18.9007C32.9783 18.7327 32.9193 18.5716 32.8235 18.4325C32.7276 18.2935 32.5981 18.181 32.4469 18.1057L24.4469 14.1057C24.308 14.0362 24.1548 14 23.9994 14C23.8441 14 23.6909 14.0362 23.5519 14.1057L15.5519 18.1057C15.4012 18.1815 15.2721 18.2941 15.1764 18.433C15.0808 18.572 15.0218 18.7329 15.0049 18.9007C14.9939 19.0077 14.0439 29.6677 23.5939 33.9147C23.7215 33.9723 23.8599 34.0021 23.9999 34.0021C24.1399 34.0021 24.2783 33.9723 24.4059 33.9147C33.9559 29.6677 33.0059 19.0087 32.9949 18.9007ZM23.9999 31.8977C17.2309 28.6257 16.9109 21.6427 16.9659 19.6357L23.9999 16.1187L31.0289 19.6337C31.0659 21.6227 30.7009 28.6517 23.9999 31.8977Z" />
      <path
        fill={ altColor }
         d="M23 24.586L20.707 22.293L19.293 23.707L23 27.414L28.707 21.707L27.293 20.293L23 24.586Z"/>
    </SvgIcon>
  )
}

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

  const [ darkMode, setDarkMode ] = useState(false);
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

  useEffect(function() {
    setDarkMode(props.theme.palette.type === 'dark' ? true : false)
  },[props.theme]);


  /*
    { account && account.address &&
      renderNav('Cover', 'cover')
    }
    { account && account.address &&
      renderNav('Lend', 'lend')
    }
    { renderNav('Stats', 'stats') }
  */
  const activePath = router.pathname

  const renderNavs = () => {
    return (<React.Fragment>
      { renderNav('Invest', 'invest', <InvestIcon className={ classes.icon } color={ darkMode ? 'white' : 'black' } altColor={ darkMode ? 'black' : 'white' } />, <InvestIconSelected className={ classes.iconSelected } color={ darkMode ? 'white' : 'black' } altColor={ darkMode ? 'black' : 'white' } />) }
      { renderNav('Cover', 'cover', <CoverIcon className={ classes.icon } color={ darkMode ? 'white' : 'black' } altColor={ darkMode ? 'black' : 'white' } />, <CoverIconSelected className={ classes.iconSelected } color={ darkMode ? 'white' : 'black' } altColor={ darkMode ? 'black' : 'white' } />) }
    </React.Fragment>)
  }

  const renderNav = (title, link, icon, iconSelected) => {
    return (
      <div className={ classes.navigationOptionContainer } onClick={ () => { handleNavigate('/'+link) }}>
        { activePath.includes('/'+link) ? <div className={ darkMode ? classes.navigationOptionSelectedWhite : classes.navigationOptionSelected }></div> : <div className={ classes.navigationOptionNotSelected}></div> }
        { activePath.includes('/'+link) ? iconSelected : icon }
        <Typography variant='h2'>{title}</Typography>
      </div>
    )
  }

  return (
    <div className={ classes.navigationContainer }>
      <div className={ classes.navigationHeading }>
        <img src='/logo-stacked.svg' width='123px' height='42.3px' />
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
          <img src='/logo-stacked.svg' width='123px' height='42.3px' />
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
