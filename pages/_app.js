import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';
import { ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import { useRouter } from 'next/router';

import lightTheme from '../theme/light';
import darkTheme from '../theme/dark';

import Configure from './configure';
import LocationWarning from '../components/locationWarning'

import stores from '../stores/index.js';

import { CONFIGURE, VAULTS_CONFIGURED, ACCOUNT_CONFIGURED, LENDING_CONFIGURED } from '../stores/constants';

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();

  const [themeConfig, setThemeConfig] = useState(lightTheme);
  const [vaultConfigured, setVaultConfigured] = useState(false);
  const [accountConfigured, setAccountConfigured] = useState(false);
  const [lendingConfigured, setLendingConfigured] = useState(false);
  const [locationWarningOpen, setLocationWarningOpen] = useState(false);
  const [locationData] = useState(null);

  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);

  useEffect(() => {
    // not using the location data, so it doesn't matter.
    // const geoURL = 'https://geolocation-db.com/json/'
    //
    // axios.get(geoURL)
    //   .then(function (response) {
    //     // handle success
    //     console.log(response.data);
    //     if(response && response.data) {
    //       setLocationData(locationData)
    //     }
    //   })
    //   .catch(function (error) {
    //     // handle error
    //     console.log(error);
    //   })
  }, [])

  const changeTheme = (dark) => {
    setThemeConfig(dark ? darkTheme : lightTheme);
    localStorage.setItem('yearn.finance-dark-mode', dark ? 'dark' : 'light');
  };

  const accountConfigureReturned = () => {
    setAccountConfigured(true);
  };

  const vaultsConfigureReturned = () => {
    setVaultConfigured(true);
  };

  const lendingConfigureReturned = () => {
    setLendingConfigured(true);
  };

  useEffect(function () {
    const localStorageDarkMode = window.localStorage.getItem('yearn.finance-dark-mode');
    changeTheme(localStorageDarkMode ? localStorageDarkMode === 'dark' : false);

    const localStorageWarningAccepted = window.localStorage.getItem('yearn.finance-warning-accepted');
    setLocationWarningOpen(localStorageWarningAccepted ? localStorageWarningAccepted !== 'accepted' : true);
  }, []);

  useEffect(function () {
    stores.emitter.on(VAULTS_CONFIGURED, vaultsConfigureReturned);
    stores.emitter.on(ACCOUNT_CONFIGURED, accountConfigureReturned);
    stores.emitter.on(LENDING_CONFIGURED, lendingConfigureReturned);

    stores.dispatcher.dispatch({ type: CONFIGURE });

    return () => {
      stores.emitter.removeListener(VAULTS_CONFIGURED, vaultsConfigureReturned);
      stores.emitter.removeListener(ACCOUNT_CONFIGURED, accountConfigureReturned);
      stores.emitter.removeListener(LENDING_CONFIGURED, lendingConfigureReturned);
    };
  }, []);

  const validateConfigured = () => {
    switch (router.pathname) {
      case '/':
        return vaultConfigured && accountConfigured;
      case '/invest':
        return vaultConfigured && accountConfigured;
      case '/lend':
        return lendingConfigured && accountConfigured;
      case '/ltv':
        return accountConfigured;
      case '/stats':
        return vaultConfigured && accountConfigured;
      default:
        return vaultConfigured && accountConfigured;
    }
  };

  const closeWarning = () => {
    window.localStorage.setItem('yearn.finance-warning-accepted', 'accepted');
    setLocationWarningOpen(false)
  }

  return (
    <React.Fragment>
      <Head>
        <title>Yearn</title>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
      </Head>
      <ThemeProvider theme={themeConfig}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
        {validateConfigured() && <Component {...pageProps} changeTheme={changeTheme} />}
        {!validateConfigured() && <Configure {...pageProps} />}
        { locationWarningOpen &&
          <LocationWarning close={ closeWarning } locationData={ locationData } />
        }
      </ThemeProvider>
    </React.Fragment>
  );
}

MyApp.propTypes = {
  Component: PropTypes.elementType.isRequired,
  pageProps: PropTypes.object.isRequired,
};
