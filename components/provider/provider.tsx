import Head from 'next/head';
import classes from './layout.module.css';
import Header from '../header';
import Navigation from '../navigation/navigation';
import SnackbarController from '../snackbar/snackbarController';
import stores from '../../stores/index.js';
import { useRouter } from 'next/router';

import { CONFIGURE, VAULTS_CONFIGURED, ACCOUNT_CONFIGURED, LENDING_CONFIGURED, CDP_CONFIGURED ,  ACCOUNT_CHANGED,
  CONFIGURE_VAULTS,
  CONFIGURE_LENDING,
  CONFIGURE_CDP,

} from '../../stores/constants';

import { useWeb3React, Web3ReactProvider } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useEffect, useState } from 'react';
// import { useEagerConnect} from '../../stores/accountManager.ts';

import Configure from '../../pages/configure';
import React from 'react';
import { injected } from '../../stores/connectors/connectors';
import Web3 from 'web3';

export const siteTitle = 'Yearn';

interface IProps {
  Component: any;
  pageProps: any;
  changeTheme: any;
}

type Props = IProps;



export function useInactiveListener(suppress: boolean) {
  const { active, error, activate } = useWeb3React()

  // console.log(suppress)
  useEffect((): any => {
    const { ethereum } = window as any;
    // console.log(ethereum, ethereum.on ,!active , !error, !suppress)

    if (ethereum && ethereum.on && !active && !error && !suppress) {
      const handleConnect = () => {
        console.log("Handling 'connect' event")
        activate(injected)
      }
      const handleChainChanged = (chainId: string | number) => {
        console.log("Handling 'chainChanged' event with payload", chainId)
        activate(injected)
            const supportedChainIds = [1];
      const parsedChainId = parseInt(chainId, 16);
      const isChainSupported = supportedChainIds.includes(parsedChainId);
      stores.accountStore.setStore({ chainInvalid: !isChainSupported });
     stores.emitter.emit(ACCOUNT_CHANGED);
     stores.emitter.emit(ACCOUNT_CONFIGURED);
      }
      const handleAccountsChanged = (accounts: string[]) => {
        console.log("Handling 'accountsChanged' event with payload", accounts)
        if (accounts.length > 0) {
          activate(injected)

          stores.emitter.emit(ACCOUNT_CHANGED);
          stores.emitter.emit(ACCOUNT_CONFIGURED);

   stores.dispatcher.dispatch({
        type: CONFIGURE_VAULTS,
        content: { connected: true },
      });
stores.dispatcher.dispatch({
        type: CONFIGURE_LENDING,
        content: { connected: true },
      });
stores.dispatcher.dispatch({
        type: CONFIGURE_CDP,
        content: { connected: true },
      });

        }
      }
      const handleNetworkChanged = (networkId: string | number) => {
        // console.log("Handling 'networkChanged' event with payload", networkId)
        activate(injected)
      }

      ethereum.on('connect', handleConnect)
      ethereum.on('chainChanged', handleChainChanged)
      ethereum.on('accountsChanged', handleAccountsChanged)
      ethereum.on('networkChanged', handleNetworkChanged)

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('connect', handleConnect)
          ethereum.removeListener('chainChanged', handleChainChanged)
          ethereum.removeListener('accountsChanged', handleAccountsChanged)
          ethereum.removeListener('networkChanged', handleNetworkChanged)
        }
      }
    }
  }, [active, error, suppress, activate])
}
export function useEagerConnect() {
  const { activate, active } = useWeb3React()

  const [tried, setTried] = useState(false)

  useEffect(() => {
    injected.isAuthorized().then((isAuthorized: boolean) => {
    var connected=  localStorage.getItem('isConnected');
console.log('con info',connected);
      if (isAuthorized && connected === 'true') {
        activate(injected, undefined, true).then((a)=>{
          // console.log(a, injected,)
          injected.getProvider().then(a=>{
            // console.log(a);
                const prov_ = new Web3(a)
            stores.accountStore.setStore({
              account: {address:  a.selectedAddress},
              web3provider:prov_,
              web3context:{library:{provider:a}}})

             console.log('printing',{account: {address:  a.selectedAddress},
             web3provider:prov_,
             web3context:{library:{provider:a} }});

              // stores.accountStore.getGasPrices();
              // stores.accountStore.getCurrentBlock();

          })
        }).catch(() => {
          setTried(true)
        })
      } else {

        setTried(true)
      }
    })
  }, []) // intentionally only running on mount (make sure it's only mounted once :))

  // if the connection worked, wait until we get confirmation of that to flip the flag
  useEffect(() => {
    if (!tried && active) {
      setTried(true)
    }
  }, [tried, active])

  return tried
}

function Provider(props: Props) {
  const router = useRouter();
  const context = useWeb3React();



  const { connector, library, chainId, account, activate, deactivate, active, error } = context;



  const [providerReady, setProviderReady] = useState(false);
  const [vaultConfigured, setVaultConfigured] = useState(false);
  const [accountConfigured, setAccountConfigured] = useState(false);
  const [lendingConfigured, setLendingConfigured] = useState(false);
  const [cdpConfigured, setCDPConfigured] = useState(false);
  const [activatingConnector, setActivatingConnector] = React.useState<any>();



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


  // handle logic to recognize the connector currently being activated
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


  console.log(validateConfigured());

  return (
    <>
      {validateConfigured() && <props.Component {...props.pageProps} changeTheme={props.changeTheme} />}
      {!validateConfigured() && <Configure {...props.pageProps} />}
    </>
  );
}

export default Provider;
