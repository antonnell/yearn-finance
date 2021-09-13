import async from 'async';
import {
  MAX_UINT256,
  FUSD_ADDRESS,
  ERROR,
  TX_SUBMITTED,
  STORE_UPDATED,
  FUSD_UPDATED,
  CONFIGURE_FUSD,
  FUSD_CONFIGURED,
  GET_FUSD_BALANCES,
  FUSD_BALANCES_RETURNED,
  APPROVE_FUSD,
  FUSD_APPROVED,
  MINT_FUSD,
  FUSD_MINTED,
  BURN_FUSD,
  FUSD_BURNT,
} from './constants';

import * as moment from 'moment';

import stores from './';
import {
  ERC20ABI,
  FIXEDUSDABI,
} from './abis';
import { bnDec } from '../utils';

import BigNumber from 'bignumber.js';
const fetch = require('node-fetch');

class Store {
  constructor(dispatcher, emitter) {
    this.dispatcher = dispatcher;
    this.emitter = emitter;

    this.store = {
      collaterals: [],
      debts: [],
      assets: []
    };

    dispatcher.register(
      function (payload) {
        switch (payload.type) {
          case CONFIGURE_FUSD:
            this.configure(payload);
            break;
          case GET_FUSD_BALANCES:
            this.getFUSDBalances(payload);
            break;
          case APPROVE_FUSD:
            this.approveFUSD(payload);
            break;
          case MINT_FUSD:
            this.mintFUSD(payload);
            break;
          case BURN_FUSD:
            this.burnFUSD(payload);
            break;
          default: {
          }
        }
      }.bind(this),
    );
  }

  getStore = (index) => {
    return this.store[index];
  };

  setStore = (obj) => {
    this.store = { ...this.store, ...obj };
    // console.log(this.store);
    return this.emitter.emit(STORE_UPDATED);
  };

  configure = async (payload) => {
    const web3 =  stores.accountStore.getWeb3Provider();
    if (!web3) {
      return null;
    }

    const account = await stores.accountStore.getStore('account');
    if (!account) {
      return null;
    }

    try {


      this.emitter.emit(FUSD_UPDATED);
      this.emitter.emit(FUSD_CONFIGURED);
      this.dispatcher.dispatch({ type: GET_FUSD_BALANCES });

    } catch(ex) {
      console.log(ex)
      this.emitter.emit(ERROR, ex)
    }
  };

  getFUSDBalances = async (payload) => {
    const assets = this.getStore('assets');
    if (!assets) {
      return null;
    }

    const account = stores.accountStore.getStore('account');

    const web3 =  stores.accountStore.getWeb3Provider();
    if (!web3) {
      return null;
    }
  };

  approveFUSD = async (payload) => {
    const account = stores.accountStore.getStore('account');
    if (!account) {
      return false;
      //maybe throw an error
    }

    const web3 =  stores.accountStore.getWeb3Provider();
    if (!web3) {
      return false;
      //maybe throw an error
    }

    const { asset, amount, gasSpeed } = payload.content;

    this._callApproveFUSD(web3, asset, account, amount, gasSpeed, (err, approveResult) => {
      if (err) {
        return this.emitter.emit(ERROR, err);
      }

      return this.emitter.emit(FUSD_APPROVED, approveResult);
    });
  };

  _callApproveFUSD = async (web3, asset, account, amount, gasSpeed, callback) => {
    const tokenContract = new web3.eth.Contract(ERC20ABI, asset.tokenMetadata.address);

    let amountToSend = '0';
    if (amount === 'max') {
      amountToSend = MAX_UINT256;
    } else {
      amountToSend = BigNumber(amount)
        .times(10 ** asset.tokenMetadata.decimals)
        .toFixed(0);
    }

    const gasPrice = await stores.accountStore.getGasPrice(gasSpeed);

    this._callContractWait(web3, tokenContract, 'approve', ['CDP_VAULT_ADDRESS', amountToSend], account, gasPrice, GET_FUSD_BALANCES, callback);
  };

  mintFUSD = async (payload) => {
    const account = stores.accountStore.getStore('account');
    if (!account) {
      return false;
      //maybe throw an error
    }

    const web3 =  stores.accountStore.getWeb3Provider();
    if (!web3) {
      return false;
      //maybe throw an error
    }

    const { cdp, depositAmount, borrowAmount, gasSpeed } = payload.content;

    this._callMintFUSD(web3, cdp, account, depositAmount, borrowAmount, gasSpeed, (err, depositResult) => {
      if (err) {
        return this.emitter.emit(ERROR, err);
      }

      return this.emitter.emit(FUSD_MINTED, depositResult);
    });

  };

  _callMintFUSD = async (web3, asset, account, depositAmount, borrowAmount, gasSpeed, callback) => {
    try {
      let fusdContract = new web3.eth.Contract(FIXEDUSDABI, FUSD_ADDRESS);

      const depositAmountToSend = BigNumber(depositAmount === '' ? 0 : depositAmount)
        .times(10 ** 18)
        .toFixed(0);

      const borrowAmountToSend = BigNumber(borrowAmount === '' ? 0 : borrowAmount)
        .times(10 ** 18)
        .toFixed(0);

      const gasPrice = await stores.accountStore.getGasPrice(gasSpeed);

      this._callContractWait(web3, fusdContract, 'mint', [asset.tokenMetadata.address, depositAmountToSend, borrowAmountToSend], account, gasPrice, GET_FUSD_BALANCES, callback);
    } catch (ex) {
      console.log(ex);
      return this.emitter.emit(ERROR, ex);
    }
  };

  burnFUSD = async (payload) => {
    const account = stores.accountStore.getStore('account');
    if (!account) {
      return false;
      //maybe throw an error
    }

    const web3 =  stores.accountStore.getWeb3Provider();
    if (!web3) {
      return false;
      //maybe throw an error
    }

    const { cdp, repayAmount, withdrawAmount, gasSpeed } = payload.content;

    this._callBurnFUSD(web3, cdp, account, repayAmount, withdrawAmount, gasSpeed, (err, depositResult) => {
      if (err) {
        return this.emitter.emit(ERROR, err);
      }

      return this.emitter.emit(FUSD_BURNT, depositResult);
    });
  };

  _callBurnFUSD = async (web3, asset, account, repayAmount, withdrawAmount, gasSpeed, callback) => {
    try {
      let fusdContract = new web3.eth.Contract(FIXEDUSDABI, FUSD_ADDRESS);

      const repayAmountToSend = BigNumber(repayAmount === '' ? 0 : repayAmount)
        .times(10 ** 18)
        .toFixed(0);
      const withdrawAmountToSend = BigNumber(withdrawAmount === '' ? 0 : withdrawAmount)
        .times(bnDec(asset.tokenMetadata.decimals))
        .toFixed(0);

      const gasPrice = await stores.accountStore.getGasPrice(gasSpeed);

      this._callContractWait(web3, fusdContract, 'burn', [asset.tokenMetadata.address, withdrawAmountToSend, repayAmountToSend], account, gasPrice, GET_FUSD_BALANCES, callback);
    } catch (ex) {
      console.log(ex);
      return this.emitter.emit(ERROR, ex);
    }
  };

  _callContractWait = (web3, contract, method, params, account, gasPrice, dispatchEvent, callback) => {
    const context = this;
    contract.methods[method](...params)
      .send({
        from: account.address,
        gasPrice: web3.utils.toWei(gasPrice, 'gwei'),
      })
      .on('transactionHash', function (hash) {
        context.emitter.emit(TX_SUBMITTED, hash);
      })
      .on('receipt', function (receipt) {
        callback(null, receipt.transactionHash);
        if (dispatchEvent) {
          context.dispatcher.dispatch({ type: dispatchEvent, content: {} });
        }
      })
      .on('error', function (error) {
        if (!error.toString().includes('-32601')) {
          if (error.message) {
            return callback(error.message);
          }
          callback(error);
        }
      })
      .catch((error) => {
        if (!error.toString().includes('-32601')) {
          if (error.message) {
            return callback(error.message);
          }
          callback(error);
        }
      });
  };
}

export default Store;
