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




// export function 