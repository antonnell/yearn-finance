import { useState, useEffect } from 'react'
import { useWeb3React } from '@web3-react/core'

// import { injected } from './connectors'
import { injected, walletconnect, walletlink, fortmatic, portis, network } from './connectors/connectors';

import stores from "../stores";
import {
  ERROR,
  CONNECTION_DISCONNECTED,
  CONNECTION_CONNECTED,
  CONFIGURE,
  CONFIGURE_VAULTS,
  CONFIGURE_LENDING,
  GAS_PRICE_API,
  ZAPPER_GAS_PRICE_API,
  STORE_UPDATED,
  ACCOUNT_CONFIGURED,
  GET_ACCOUNT_BALANCES,
  ACCOUNT_BALANCES_RETURNED,
  CONFIGURE_CDP,
  LENDING_CONFIGURED,
  CDP_CONFIGURED,
  ACCOUNT_CHANGED,
  GET_GAS_PRICES,
  GAS_PRICES_RETURNED,
} from "../stores/constants/constants";

interface IProps  {
    dispatcher: any;
    emmiter: any;
}
import Web3 from 'web3';

type Props = IProps;


export function useEagerConnect() {
  const { activate, active } = useWeb3React()

  const [tried, setTried] = useState(false)

  useEffect(() => {
    injected.isAuthorized().then((isAuthorized: boolean) => {
      if (isAuthorized) {
        activate(injected, undefined, true).then((a)=>{
          // console.log(a, injected,)
          injected.getProvider().then(a=>{
            console.log(a);
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

export function useInactiveListener(suppress: boolean = false) {
  const { active, error, activate } = useWeb3React()

  console.log(suppress)
  useEffect((): any => {
    const { ethereum } = window as any;
    console.log(ethereum, ethereum.on ,!active , !error, !suppress)

    if (ethereum && ethereum.on && !active && !error && !suppress) {
      const handleConnect = () => {
        console.log("Handling 'connect' event")
        activate(injected).then((d)=>{

          console.log(d);
        })
      }
      const handleChainChanged = (chainId: string | number) => {
        console.log("Handling 'chainChanged' event with payload", chainId)
        activate(injected)
            const supportedChainIds = [1];
      const parsedChainId = parseInt(chainId, 16);
      const isChainSupported = supportedChainIds.includes(parsedChainId);
      stores.setStore({ chainInvalid: !isChainSupported });
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
        console.log("Handling 'networkChanged' event with payload", networkId)
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
