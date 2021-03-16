import async from 'async';
import {
  GAS_PRICE_API,
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
  GAS_PRICES_RETURNED
} from './constants';

import { ERC20ABI } from './abis'

import { bnDec } from '../utils'

import stores from './'

import {
  injected,
  walletconnect,
  walletlink,
  fortmatic,
  portis,
  network
} from './connectors';

import BigNumber from 'bignumber.js'
import Web3 from 'web3';

class Store {
  constructor(dispatcher, emitter) {

    this.dispatcher = dispatcher
    this.emitter = emitter

    this.store = {
      account: null,
      web3context: null,
      tokens: [],
      connectorsByName: {
        MetaMask: injected,
        TrustWallet: injected,
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
        "slow":90,
        "standard":90,
        "fast":100,
        "instant":130
      },
      gasSpeed: 'fast',
      currentBlock: 11743358
    }

    dispatcher.register(
      function (payload) {
        console.log(payload)
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
      }.bind(this)
    );
  }

  getStore(index) {
    return(this.store[index]);
  };

  setStore(obj) {
    this.store = {...this.store, ...obj}
    console.log(this.store)
    return this.emitter.emit(STORE_UPDATED);
  };

  configure = async () => {

    this.getGasPrices()
    this.getCurrentBlock()

    injected.isAuthorized().then(isAuthorized => {
      if (isAuthorized) {
        injected.activate()
        .then((a) => {
          this.setStore({ account: { address: a.account }, web3context: { library: { provider: a.provider } } })
          this.emitter.emit(ACCOUNT_CONFIGURED)

          this.dispatcher.dispatch({ type: CONFIGURE_VAULTS, content: { connected: true } })
          this.dispatcher.dispatch({ type: CONFIGURE_LENDING, content: { connected: true } })
          this.dispatcher.dispatch({ type: CONFIGURE_CDP, content: { connected: true } })
        })
        .catch((e) => {
          this.emitter.emit(ERROR, e)
          this.emitter.emit(ACCOUNT_CONFIGURED)

          this.dispatcher.dispatch({ type: CONFIGURE_VAULTS, content: { connected: false } })
          this.dispatcher.dispatch({ type: CONFIGURE_LENDING, content: { connected: false } })
          this.dispatcher.dispatch({ type: CONFIGURE_CDP, content: { connected: false } })
        })
      } else {
        //we can ignore if not authorized.
        this.emitter.emit(ACCOUNT_CONFIGURED)
        this.emitter.emit(LENDING_CONFIGURED)
        this.emitter.emit(CDP_CONFIGURED)

        this.dispatcher.dispatch({ type: CONFIGURE_VAULTS, content: { connected: false } })
      }
    });

    if(window.ethereum) {
      this.updateAccount()
    } else {
      window.removeEventListener('ethereum#initialized', this.updateAccount)
      window.addEventListener('ethereum#initialized', this.updateAccount, {
        once: true,
      });
    }

  };

  updateAccount = () => {
    const that = this
    const res = window.ethereum.on('accountsChanged', function (accounts) {
      that.setStore({ account: { address: accounts[0] }, web3context: { library: { provider: window.ethereum } } })
      that.emitter.emit(ACCOUNT_CHANGED)
      that.emitter.emit(ACCOUNT_CONFIGURED)

      that.dispatcher.dispatch({ type: CONFIGURE_VAULTS, content: { connected: true } })
      that.dispatcher.dispatch({ type: CONFIGURE_LENDING, content: { connected: true } })
      that.dispatcher.dispatch({ type: CONFIGURE_CDP, content: { connected: true } })
    })
  }

  getBalances = async (payload) => {
    const account = this.getStore('account')
    if(!account) {
      return false
      //maybe throw an error
    }

    const web3 = await this.getWeb3Provider()
    if(!web3) {
      return false
      //maybe throw an error
    }

    const vaults = stores.investStore.getStore('vaults')

    const vaultTokens = vaults.map((v) => {
      return {
        address: v.tokenAddress,
        decimals: v.tokenMetadata.decimals,
        symbol: v.tokenMetadata.symbol,
        displayName: v.tokenMetadata.displayName,
        name: v.tokenMetadata.name,
        icon: v.tokenMetadata.icon
      }
    })
    //get lelnding assets, append them to this

    async.map(vaultTokens, async (token, callback) => {
      try {
        const erc20Contract = new web3.eth.Contract(ERC20ABI, token.address)
        const balanceOf = await erc20Contract.methods.balanceOf(account.address).call()

        token.balance = BigNumber(balanceOf).div(bnDec(token.decimals)).toFixed(token.decimals, BigNumber.ROUND_DOWN)

        if(callback) {
          callback(null, token)
        } else {
          return token
        }
      } catch(ex) {
        console.log(ex)
      }
    }, (err, tokensBalanced) => {
      if(err) {
        return this.emitter.emit(ERROR, err)
      }

      const tokens = this.setStore({ tokens: tokensBalanced })
    })
  }

  getCurrentBlock = async (payload) => {
    try {
      var web3 = new Web3(process.env.NEXT_PUBLIC_PROVIDER);
      const block = await web3.eth.getBlockNumber()
      this.setStore({ currentBlock: block })
    } catch(ex) {
      console.log(ex)
    }

  }

  getGasPrices = async (payload) => {
    const gasPrices = await this._getGasPrices()
    let gasSpeed = localStorage.getItem('yearn.finance-gas-speed')

    if(!gasSpeed) {
      gasSpeed = 'fast'
      localStorage.getItem('yearn.finance-gas-speed', 'fast')
    }

    this.setStore({ gasPrices: gasPrices, gasSpeed: gasSpeed })
    this.emitter.emit(GAS_PRICES_RETURNED)
  }

  _getGasPrices = async () => {
    try {
      const url = GAS_PRICE_API
      const priceResponse = await fetch(url);
      const priceJSON = await priceResponse.json()

      if(priceJSON) {
        return priceJSON
      }
    } catch(e) {
      console.log(e)
      return {}
    }
  }

  getGasPrice = async (speed) => {

    let gasSpeed = speed
    if(!speed) {
      gasSpeed = this.getStore('gasSpeed')
    }

    try {
      const url = GAS_PRICE_API
      const priceResponse = await fetch(url);
      const priceJSON = await priceResponse.json()

      if(priceJSON) {
        return priceJSON[gasSpeed].toFixed(0)
      }
    } catch(e) {
      console.log(e)
      return {}
    }
  }

  getWeb3Provider = async () => {
    let web3context = this.getStore('web3context')
    let provider = null

    if(!web3context) {
      provider = network.providers['1']
    } else {
      provider = web3context.library.provider
    }

    if(!provider) {
      return null
    }
    return new Web3(provider);

  }
}

export default Store;
