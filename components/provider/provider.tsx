import Head from 'next/head';
import classes from './layout.module.css';
import Header from '../header';
import Navigation from '../navigation/navigation';
import SnackbarController from '../snackbar/snackbarController';
import stores from '../../stores/index.js';
import { useRouter } from 'next/router';

import { CONFIGURE, VAULTS_CONFIGURED, ACCOUNT_CONFIGURED, LENDING_CONFIGURED, CDP_CONFIGURED } from '../../stores/constants';

import { useWeb3React, Web3ReactProvider } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useEffect, useState } from 'react';
import { useEagerConnect, useInactiveListener } from '../../stores/accountManager.ts';

import Configure from '../../pages/configure';
import React from 'react';

export const siteTitle = 'Yearn';

interface IProps {
  Component: any;
  pageProps: any;
  changeTheme: any;
}

type Props = IProps;

function Provider(props: Props) {
  const router = useRouter();
  const context = useWeb3React();



  const { connector, library, chainId, account, activate, deactivate, active, error } = context;

  // handle logic to recognize the connector currently being activated
  const [activatingConnector, setActivatingConnector] = React.useState<any>();
  React.useEffect(() => {
    console.log('running',activatingConnector , activatingConnector,connector)
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined);
    }
  }, [activatingConnector, connector]);

  
    // handle logic to eagerly connect to the injected ethereum provider, if it exists and has granted access already
    const triedEager = useEagerConnect();
  
    // handle logic to connect in reaction to certain events on the injected ethereum provider, if it exists
    useInactiveListener(!triedEager || !!activatingConnector);



  const [providerReady, setProviderReady] = useState(false);
  const [vaultConfigured, setVaultConfigured] = useState(false);
  const [accountConfigured, setAccountConfigured] = useState(false);
  const [lendingConfigured, setLendingConfigured] = useState(false);
  const [cdpConfigured, setCDPConfigured] = useState(false);



  const accountConfigureReturned = () => {
    setAccountConfigured(true);
  };

  const vaultsConfigureReturned = () => {
    setVaultConfigured(true);
  };

  const lendingConfigureReturned = () => {
    setLendingConfigured(true);
  };

  const cdpConfigureReturned = () => {
    setCDPConfigured(true);
  };

  useEffect(function () {
    stores.emitter.on(VAULTS_CONFIGURED, vaultsConfigureReturned);
    stores.emitter.on(ACCOUNT_CONFIGURED, accountConfigureReturned);
    stores.emitter.on(LENDING_CONFIGURED, lendingConfigureReturned);
    stores.emitter.on(CDP_CONFIGURED, cdpConfigureReturned);

    stores.dispatcher.dispatch({ type: CONFIGURE });

    return () => {
      stores.emitter.removeListener(VAULTS_CONFIGURED, vaultsConfigureReturned);
      stores.emitter.removeListener(ACCOUNT_CONFIGURED, accountConfigureReturned);
      stores.emitter.removeListener(LENDING_CONFIGURED, lendingConfigureReturned);
      stores.emitter.removeListener(CDP_CONFIGURED, cdpConfigureReturned);
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
      case '/cdp':
        return cdpConfigured && accountConfigured;
      case '/ltv':
        return accountConfigured;
      case '/stats':
        return vaultConfigured && accountConfigured;
      default:
        return vaultConfigured && accountConfigured;
    }
  };


  return (
    <>


      {validateConfigured() && <props.Component {...props.pageProps} changeTheme={props.changeTheme} />}
      {!validateConfigured() && <Configure {...props.pageProps} />}
    </>
  );
}

export default Provider;
