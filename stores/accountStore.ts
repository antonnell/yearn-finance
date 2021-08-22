import async from 'async';
import {
  GAS_PRICE_API,
  ZAPPER_GAS_PRICE_API,
  ERROR,
  STORE_UPDATED,
  CONFIGURE,
  ACCOUNT_CONFIGURED,
  GET_ACCOUNT_BALANCES,
  ACCOUNT_BALANCES_RETURNED,
  CONFIGURE_VAULTS,
  CONFIGURE_LENDING,
  CONFIGURE_CDP,
  LENDING_CONFIGURED,
  CDP_CONFIGURED,
  ACCOUNT_CHANGED,
  GET_GAS_PRICES,
  GAS_PRICES_RETURNED,
} from './constants/constants';

import { ERC20ABI } from './abis/abis';

import { bnDec } from '../utils/utils';

import stores from '.';

import { injected, walletconnect, walletlink, fortmatic, portis, network } from './connectors/connectors';
import { Web3ReactProvider, useWeb3React } from "@web3-react/core";
import { useEagerConnect, useInactiveListener } from './accountManager.ts';

import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import React from 'react';

interface IStore{
  account: any,
  chainInvalid: boolean;
  web3context: any;
  web3provider: any;
  tokens: any[];
  tried: boolean;
  connectorsByName:any;
  gasPrices: any;
  gasSpeed: any;
  currentBlock: any;
}

interface IProps{
  dispatcher: any;
  emitter: any;
}

type Props = IProps;

class AccountStore extends React.Component<Props,IStore> {
    store:IStore;
    // dispacher: any;
    // emitter:any;

  constructor(props) {

    super(props);
    // console.log(props)
    // this.dispatcher = props.dispatcher;
    // this.props.emitter = props.emitter;

    this.store = {
      account: null,
      chainInvalid: false,
      web3context: null,
      web3provider: null,
      tokens: [],
      tried: false,
      connectorsByName: {
        MetaMask: injected,
        // TrustWallet: injected,
        WalletConnect: walletconnect,
        WalletLink: walletlink,
        // Ledger: ledger,
        // Trezor: trezor,
        // Frame: frame,
        Fortmatic: fortmatic,
        Portis: portis,
        // Squarelink: squarelink,
        // Torus: torus,
        // Authereum: authereum
      },
      gasPrices: {
        standard: 90,
        fast: 100,
        instant: 130,
      },
      gasSpeed: 'fast',
      currentBlock: 11743358,
    };
    // useEagerConnect();
// console.log(props.dispatcher, ' .... ',props);
    props.dispatcher.register(
      function (payload) {
        switch (payload.type) {
          case CONFIGURE:
            this.configure(payload);
            break;
          case GET_ACCOUNT_BALANCES:
            this.getBalances(payload);
            break;
          default: {
          }
        }
      }.bind(this),
    );
  }

  getStore(index) {
    return this.store[index];
  }

  setStore(obj) {
    this.store = { ...this.store, ...obj };
    // console.log(this.store);
    return this.props.emitter.emit(STORE_UPDATED);
  }

  configure = async () => {
    this.getCurrentBlock();
    this.getGasPrices();

        injected.isAuthorized().then((isAuthorized) => {

         this.props.emitter.emit(ACCOUNT_CONFIGURED);
        this.props.emitter.emit(LENDING_CONFIGURED);
        this.props.emitter.emit(CDP_CONFIGURED);


  this.props.dispatcher.dispatch({
    type: CONFIGURE_VAULTS,
    content: { connected: true },
  });
});
  // this.props.dispatcher.dispatch({
  //   type: CONFIGURE_LENDING,
  //   content: { connected: true },
  // });
  // this.props.dispatcher.dispatch({
  //   type: CONFIGURE_CDP,
  //   content: { connected: true },
  // });


      

   

  //   if(!this.store.tried){
   
  //     const { supportedChainIds } = injected;
  //     // fall back to ethereum mainnet if chainId undefined
  //     const { chainId = 1 } = window.ethereum || {};
  //     const parsedChainId = parseInt(chainId, 16);
  //     const isChainSupported = supportedChainIds.includes(parsedChainId);
  //     if (!isChainSupported) {
  //       this.setStore({ chainInvalid: true });
  //       this.props.emitter.emit(ACCOUNT_CHANGED);
  //     }

  //     if (isAuthorized && isChainSupported) {

  //       injected
  //       .activate()
  //         .then((a) => {
  //           this.setStore({
  //             account: { address: a.account },
  //             web3context: { library: { provider: a.provider } },
  //             tried: true
  //           });
  //           this.props.emitter.emit(ACCOUNT_CONFIGURED);

  //           this.dispatcher.dispatch({
  //             type: CONFIGURE_VAULTS,
  //             content: { connected: true },
  //           });
  //           this.dispatcher.dispatch({
  //             type: CONFIGURE_LENDING,
  //             content: { connected: true },
  //           });
  //           this.dispatcher.dispatch({
  //             type: CONFIGURE_CDP,
  //             content: { connected: true },
  //           });
  //         })
  //         .catch((e) => {
  //           this.props.emitter.emit(ERROR, e);
  //           this.props.emitter.emit(ACCOUNT_CONFIGURED);

  //           this.dispatcher.dispatch({
  //             type: CONFIGURE_VAULTS,
  //             content: { connected: false },
  //           });
  //           this.dispatcher.dispatch({
  //             type: CONFIGURE_LENDING,
  //             content: { connected: false },
  //           });
  //           this.dispatcher.dispatch({
  //             type: CONFIGURE_CDP,
  //             content: { connected: false },
  //           });
  //         });
  //     } else {
  //       //we can ignore if not authorized.
  //       this.props.emitter.emit(ACCOUNT_CONFIGURED);
  //       this.props.emitter.emit(LENDING_CONFIGURED);
  //       this.props.emitter.emit(CDP_CONFIGURED);

  //       this.dispatcher.dispatch({
  //         type: CONFIGURE_VAULTS,
  //         content: { connected: false },
  //       });
  //     }
  //   });
  // }

    // if (window.ethereum) {
    //   this.updateAccount();
    // } else {
    //   window.removeEventListener('ethereum#initialized', this.updateAccount);
    //   // window.addEventListener('ethereum#initialized', this.updateAccount, {
    //   //   once: true,
    //   // });
    // }
  }

  updateAccount = () => {
    const that = this;
    // const res = window.ethereum.on('accountsChanged', function (accounts) {
    //   that.setStore({
    //     account: { address: accounts[0] },
    //     web3context: { library: { provider: window.ethereum } },
    //   });
    //   that.emitter.emit(ACCOUNT_CHANGED);
    //   that.emitter.emit(ACCOUNT_CONFIGURED);

    //   that.dispatcher.dispatch({
    //     type: CONFIGURE_VAULTS,
    //     content: { connected: true },
    //   });
    //   that.dispatcher.dispatch({
    //     type: CONFIGURE_LENDING,
    //     content: { connected: true },
    //   });
    //   that.dispatcher.dispatch({
    //     type: CONFIGURE_CDP,
    //     content: { connected: true },
    //   });
    // });

    // window.ethereum.on('chainChanged', function (chainId) {
    //   const supportedChainIds = [1];
    //   const parsedChainId = parseInt(chainId, 16);
    //   const isChainSupported = supportedChainIds.includes(parsedChainId);
    //   that.setStore({ chainInvalid: !isChainSupported });
    //   that.emitter.emit(ACCOUNT_CHANGED);
    //   that.emitter.emit(ACCOUNT_CONFIGURED);

    //   that.configure()
    // });
  };


  getBalances = async (payload) => {
    console.log('getting balance')
    const account = this.getStore('account');
    if (!account) {
      return false;
      //maybe throw an error
    }
      console.log(Web3, payload);
    const web3 = this.store.web3provider
    if (!web3) {
      return false;
      //maybe throw an error
    }

    const vaults = stores.investStore.getStore('vaults');



    const vaultTokens = vaults.map((v) => {
      return {
        address: v.tokenAddress,
        decimals: v.tokenMetadata.decimals,
        symbol: v.tokenMetadata.symbol,
        displayName: v.tokenMetadata.displayName,
        name: v.tokenMetadata.name,
        icon: v.tokenMetadata.icon,
      };
    });
    console.log(vaultTokens);
    // //get lelnding assets, append them to this
    async.map(
      vaultTokens,
      async (token, callback) => {
        try {
          const erc20Contract = new web3.library.Contract(ERC20ABI, token.address);
          const balanceOf = await erc20Contract.methods.balanceOf(account.address).call();

          token.balance =  BigNumber(balanceOf).div(bnDec(token.decimals)).toFixed(token.decimals, BigNumber.ROUND_DOWN);

          if (callback) {
            callback(null, token);
          } else {
            return token;
          }
        } catch (ex) {
          console.log(ex);
        }
      },
      (err, tokensBalanced) => {
        if (err) {
          return this.emitter.emit(ERROR, err);
        }

        const tokens = this.setStore({ tokens: tokensBalanced });
      },
    );
  };

  getCurrentBlock = async (payload?) => {
    try {
      // var web3 = new Web3(process.env.NEXT_PUBLIC_PROVIDER);
      if(this.store.web3context){
      const block = await this.store.web3provider.eth.getBlockNumber();
      this.setStore({ currentBlock: block });
      }
    } catch (ex) {
      console.log(ex);
    }
  };

 getGasPrices = async (payload?:any) => {
    const gasPrices = await this._getGasPrices();
    let gasSpeed = localStorage.getItem('yearn.finance-gas-speed');

    if (!gasSpeed) {
      gasSpeed = 'fast';
      localStorage.getItem('yearn.finance-gas-speed', 'fast');
    }

    this.setStore({ gasPrices: gasPrices, gasSpeed: gasSpeed });
    this.props.emitter.emit(GAS_PRICES_RETURNED);
  };

  _getGasPrices = async () => {
    try {
      const url = ZAPPER_GAS_PRICE_API;
      const priceResponse = await fetch(url);
      const priceJSON = await priceResponse.json();

      if (priceJSON) {
        return priceJSON;
      }
    } catch (e) {
      console.log(e);
      // const web3 = await this._getWeb3Provider();
      const gasPrice = await this.store.web3provider.eth.getGasPrice();
      const gasPriceInGwei = this.store.web3provider.utils.fromWei(gasPrice, "gwei");
      return {
        standard: gasPriceInGwei,
        fast: gasPriceInGwei,
        instant: gasPriceInGwei,
      };
    }
  };

  getGasPrice = async (speed) => {
    let gasSpeed = speed;
    if (!speed) {
      gasSpeed = this.getStore('gasSpeed');
    }

    try {
      const url = ZAPPER_GAS_PRICE_API;
      const priceResponse = await fetch(url);
      const priceJSON = await priceResponse.json();

      if (priceJSON) {
        return priceJSON[gasSpeed].toFixed(0);
      }
    } catch (e) {
      console.log(e);
      return {};
    }
  };

  getWeb3Provider = () => {

   
    return this.store.web3provider;
  };

}

export default AccountStore;
