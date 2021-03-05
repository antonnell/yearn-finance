import async from 'async';
import {
  MAX_UINT256,
  CDP_VAULT_ADDRESS,
  ERROR,
  TX_SUBMITTED,
  STORE_UPDATED,
  CDP_UPDATED,
  CONFIGURE_CDP,
  CDP_CONFIGURED,
  GET_CDP_BALANCES,
  CDP_BALANCES_RETURNED,
  DEPOSIT_BORROW_CDP,
  DEPOSIT_BORROW_CDP_RETURNED,
  WITHDRAW_REPAY_CDP,
  WITHDRAW_REPAY_CDP_RETURNED,
  APPROVE_CDP,
  APPROVE_CDP_RETURNED
} from './constants';

import * as moment from 'moment';

import stores from './'
import { ERC20ABI, CDPVAULTABI } from './abis'
import { bnDec } from '../utils'
import cdpJSON from './configurations/cdp'

import BigNumber from 'bignumber.js'
const fetch = require('node-fetch');

class Store {
  constructor(dispatcher, emitter) {

    this.dispatcher = dispatcher
    this.emitter = emitter

    this.store = {
      cdpAssets: cdpJSON.collaterals,
      cdpActive: [],
      borrowAsset: cdpJSON.borrowAsset
    }

    dispatcher.register(
      function (payload) {
        switch (payload.type) {
          case CONFIGURE_CDP:
            this.configure(payload)
            break;
          case GET_CDP_BALANCES:
            this.getCDPBalances(payload)
            break;
          case APPROVE_CDP:
            this.approveCDP(payload)
            break;
          case DEPOSIT_BORROW_CDP:
            this.depositCDP(payload)
            break;
          case WITHDRAW_REPAY_CDP:
            this.withdrawCDP(payload)
            break;
          default: {
          }
        }
      }.bind(this)
    );
  }

  getStore = (index) => {
    return(this.store[index]);
  };

  setStore = (obj) => {
    this.store = {...this.store, ...obj}
    console.log(this.store)
    return this.emitter.emit(STORE_UPDATED);
  };

  configure = async(payload) => {
    const web3 = await stores.accountStore.getWeb3Provider()
    if(!web3) {
      return null
    }

    const account = await stores.accountStore.getStore('account')
    if(!account) {
      return null
    }

    // set borrow details
    let borrowAsset = this.getStore('borrowAsset')

    const borrowAssetContract = new web3.eth.Contract(ERC20ABI, borrowAsset.address)
    const borrowBalanceOf = await borrowAssetContract.methods.balanceOf(account.address).call()
    borrowAsset.balance = BigNumber(borrowBalanceOf).div(bnDec(borrowAsset.decimals)).toFixed(borrowAsset.decimals, BigNumber.ROUND_DOWN)

    this.setStore({ borrowAsset: borrowAsset })


    //get all supported assets
    const allAssets = await this._getAssets()


    // get open CDPS
    const vaultContract = new web3.eth.Contract(CDPVAULTABI, CDP_VAULT_ADDRESS)
    async.map(allAssets, async (asset, callback) => {
      const tokenDebts = await vaultContract.methods.tokenDebts(asset.address).call()

      // these are balances apparently
      const collateral = await vaultContract.methods.collaterals(asset.address, account.address).call()
      const debt = await vaultContract.methods.debts(asset.address, account.address).call()
      const stabilityFee = await vaultContract.methods.stabilityFee(asset.address, account.address).call()
      const liquidationFee = await vaultContract.methods.liquidationFee(asset.address, account.address).call()

      const erc20Contract = new web3.eth.Contract(ERC20ABI, asset.address)
      const balanceOf = await erc20Contract.methods.balanceOf(account.address).call()
      const allowance = await erc20Contract.methods.allowance(account.address, CDP_VAULT_ADDRESS).call()

      const returnAsset = {
        defaultOracleType: asset.defaultOracleType,
        collateral: BigNumber(collateral).div(bnDec(asset.decimals)).toFixed(asset.decimals, BigNumber.ROUND_DOWN),
        debt: BigNumber(debt).div(bnDec(borrowAsset.decimals)).toFixed(borrowAsset.decimals, BigNumber.ROUND_DOWN),
        stabilityFee: BigNumber(stabilityFee).div(1000).toFixed(asset.decimals, BigNumber.ROUND_DOWN),
        liquidationFee: BigNumber(liquidationFee).toFixed(asset.decimals, BigNumber.ROUND_DOWN),
        tokenDebts: BigNumber(tokenDebts).div(bnDec(asset.decimals)).toFixed(asset.decimals, BigNumber.ROUND_DOWN),
        tokenMetadata: {
          address: asset.address,
          symbol: asset.symbol,
          decimals: asset.decimals,
          balance: BigNumber(balanceOf).div(bnDec(asset.decimals)).toFixed(asset.decimals, BigNumber.ROUND_DOWN),
          allowance: BigNumber(allowance).div(bnDec(asset.decimals)).toFixed(asset.decimals),
          icon: 'https://raw.githubusercontent.com/iearn-finance/yearn-assets/master/icons/tokens/'+asset.address,
        }
      }

      if(callback) {
        callback(null, returnAsset)
      } else {
        return returnAsset
      }
    }, (err, allAssetsPopulated) => {
      if(err) {
        return this.emitter.emit(ERROR)
      }

      this.setStore({ cdpActive: allAssetsPopulated.filter((asset) => { return (BigNumber(asset.collateral).gt(0) || BigNumber(asset.debt).gt(0)) }) })
      this.setStore({ cdpAssets: allAssetsPopulated })

      this.emitter.emit(CDP_UPDATED)
      this.emitter.emit(CDP_CONFIGURED)
      this.dispatcher.dispatch({ type: GET_CDP_BALANCES })
    })
  }

  _getAssets = async () => {
    return this.getStore('cdpAssets')
  }


  getCDPBalances = async (payload) => {
    const cdpAssets = this.getStore('cdpAssets')
    if(!cdpAssets) {
      return null
    }

    const account = stores.accountStore.getStore('account')

    const web3 = await stores.accountStore.getWeb3Provider()
    if(!web3) {
      return null
    }

  }

  approveCDP = async (payload) => {
    const account = stores.accountStore.getStore('account')
    if(!account) {
      return false
      //maybe throw an error
    }

    const web3 = await stores.accountStore.getWeb3Provider()
    if(!web3) {
      return false
      //maybe throw an error
    }

    const { asset, amount, gasSpeed } = payload.content

    this._callApproveCDP(web3, asset, account, amount, gasSpeed, (err, approveResult) => {
      if(err) {
        return this.emitter.emit(ERROR, err);
      }

      return this.emitter.emit(APPROVE_VAULT_RETURNED, approveResult)
    })
  }

  _callApproveCDP = async (web3, asset, account, amount, gasSpeed, callback) => {
    const tokenContract = new web3.eth.Contract(ERC20ABI, asset.tokenMetadata.address)

    let amountToSend = '0'
    if(amount === 'max') {
      amountToSend = MAX_UINT256
    } else {
      amountToSend = BigNumber(amount).times(10**asset.tokenMetadata.decimals).toFixed(0)
    }

    const gasPrice = await stores.accountStore.getGasPrice(gasSpeed)

    this._callContract(web3, tokenContract, 'approve', [asset.address, amountToSend], account, gasPrice, GET_CDP_BALANCES, callback)
  }

  depositCDP = async (payload) => {
    const account = stores.accountStore.getStore('account')
    if(!account) {
      return false
      //maybe throw an error
    }

    const web3 = await stores.accountStore.getWeb3Provider()
    if(!web3) {
      return false
      //maybe throw an error
    }

    const { asset, amount, gasSpeed } = payload.content

    this._callDepositCDP(web3, asset, account, amount, gasSpeed, (err, depositResult) => {
      if(err) {
        return this.emitter.emit(ERROR, err);
      }

      return this.emitter.emit(DEPOSIT_CDP_RETURNED, depositResult)
    })
  }

  _callDepositCDP = async (web3, asset, account, amount, gasSpeed, callback) => {
    const cdpContract = new web3.eth.Contract(CERC20DELEGATORABI, asset.address)

    const amountToSend = BigNumber(amount).times(bnDec(asset.tokenMetadata.decimals)).toFixed(0)
    const gasPrice = await stores.accountStore.getGasPrice(gasSpeed)

    this._callContract(web3, cdpContract, 'mint', [amountToSend], account, gasPrice, GET_CDP_BALANCES, callback)
  }

  withdrawCDP = async (payload) => {
    const account = stores.accountStore.getStore('account')
    if(!account) {
      return false
      //maybe throw an error
    }

    const web3 = await stores.accountStore.getWeb3Provider()
    if(!web3) {
      return false
      //maybe throw an error
    }

    const { asset, amount, gasSpeed } = payload.content

    this._callWithdrawCDP(web3, asset, account, amount, gasSpeed, (err, depositResult) => {
      if(err) {
        return this.emitter.emit(ERROR, err);
      }

      return this.emitter.emit(WITHDRAW_CDP_RETURNED, depositResult)
    })
  }

  _callWithdrawCDP = async (web3, asset, account, amount, gasSpeed, callback) => {
    const cdpContract = new web3.eth.Contract(CERC20DELEGATORABI, asset.address)

    const amountToSend = BigNumber(amount).times(bnDec(asset.tokenMetadata.decimals)).toFixed(0)
    const gasPrice = await stores.accountStore.getGasPrice(gasSpeed)

    this._callContract(web3, cdpContract, 'redeemUnderlying', [amountToSend], account, gasPrice, GET_CDP_BALANCES, callback)
  }

  _callContract = (web3, contract, method, params, account, gasPrice, dispatchEvent, callback) => {
    const context = this
    contract.methods[method](...params).send({ from: account.address, gasPrice: web3.utils.toWei(gasPrice, 'gwei') })
      .on('transactionHash', function(hash){
        context.emitter.emit(TX_SUBMITTED, hash)
        callback(null, hash)
      })
      .on('confirmation', function(confirmationNumber, receipt){
        if(dispatchEvent && confirmationNumber === 1) {
          context.dispatcher.dispatch({ type: dispatchEvent })
        }
      })
      .on('error', function(error) {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
      .catch((error) => {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
  }

}

export default Store;
