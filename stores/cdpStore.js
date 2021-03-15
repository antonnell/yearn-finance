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
  APPROVE_CDP_RETURNED,
  KEEP3R_ORACLE_ADDRESS,
  KEEP3R_SUSHI_ORACLE_ADDRESS,
  UNIT_ORACLE_REGISTRY_ADDRESS,
  VAULT_MANAGER_PARAMETERS_ADDRESS,
  VAULT_PARAMETERS_ADDRESS
} from './constants';

import * as moment from 'moment';

import stores from './'
import {
  ERC20ABI,
  CDPVAULTABI,
  KEEP3RV1ORACLEABI,
  ORACLEREGISTRYABI,
  VAULTMANAGERPARAMSABI,
  VAULTPARAMETERSABI
} from './abis'
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

    let ethPrice = null
    try {
      const sendAmount0 = (1e18).toFixed(0)
      const keep3rContract = new web3.eth.Contract(KEEP3RV1ORACLEABI, KEEP3R_SUSHI_ORACLE_ADDRESS)
      ethPrice = await keep3rContract.methods.current('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', sendAmount0, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48').call({ })
      ethPrice = BigNumber(ethPrice).div(1e6).toNumber()

      console.log("ETH PRICE")
      console.log(ethPrice)
    } catch(ex) {
      console.log(ex)
      return null
    }

    const vaultManagerParamsContract = new web3.eth.Contract(VAULTMANAGERPARAMSABI, VAULT_MANAGER_PARAMETERS_ADDRESS)
    const vaultParametersContract = new web3.eth.Contract(VAULTPARAMETERSABI, VAULT_PARAMETERS_ADDRESS)

    async.map(allAssets, async (asset, callback) => {
      if(!asset || !asset.address) {
        callback(null, null)
        return null
      }


      const collateral = await vaultContract.methods.collaterals(asset.address, account.address).call()
      const debt = await vaultContract.methods.debts(asset.address, account.address).call()


      const stabilityFee = await vaultParametersContract.methods.stabilityFee(asset.address).call()
      const tokenDebts = await vaultContract.methods.tokenDebts(asset.address).call()
      const liquidationFee = await vaultParametersContract.methods.liquidationFee(asset.address).call()
      const tokenDebtLimit = await vaultParametersContract.methods.tokenDebtLimit(asset.address).call()


      const initialCollateralRatio = await vaultManagerParamsContract.methods.initialCollateralRatio(asset.address).call()
      const liquidationRatio = await vaultManagerParamsContract.methods.liquidationRatio(asset.address).call()
      const maxColPercent = await vaultManagerParamsContract.methods.maxColPercent(asset.address).call()
      const minColPercent = await vaultManagerParamsContract.methods.minColPercent(asset.address).call()

      const erc20Contract = new web3.eth.Contract(ERC20ABI, asset.address)
      const balanceOf = await erc20Contract.methods.balanceOf(account.address).call()
      const allowance = await erc20Contract.methods.allowance(account.address, CDP_VAULT_ADDRESS).call()

      let addy = asset.address
      if(asset.symbol.includes('UNISWAP')) {
        addy = '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984'
      } else if (asset.symbol.includes('SUSHISWAP')) {
        addy = '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2'
      }

      // get dolar price
      const dolarPrice = await this._getDolarPrice(asset, ethPrice)

      let utilizationRatio = 0
      let maxUSDPAvailable = 0
      let liquidationPrice = 0
      let status = 'Unknown'

      if(BigNumber(collateral).gt(0)) {
        utilizationRatio = BigNumber(debt).times(10000).div(BigNumber(collateral).times(liquidationRatio).times(dolarPrice).toNumber()).toNumber()
        maxUSDPAvailable = BigNumber(collateral).div(bnDec(asset.decimals)).times(liquidationRatio).div(100).times(dolarPrice).toNumber()
        liquidationPrice = BigNumber(dolarPrice).times(utilizationRatio).div(100).toNumber()
        if(BigNumber(utilizationRatio).gt(90)) {
          status = 'Liquidatable'
        } else if(BigNumber(utilizationRatio).gt(90)) {
          status = 'Dangerous'
        } else if(BigNumber(utilizationRatio).gt(75)) {
          status = 'Moderate'
        } else {
          status = 'Safe'
        }
      }

      const returnAsset = {
        defaultOracleType: asset.defaultOracleType,
        collateral: BigNumber(collateral).div(bnDec(asset.decimals)).toFixed(asset.decimals, BigNumber.ROUND_DOWN),
        collateralDolar: BigNumber(collateral).times(dolarPrice).div(bnDec(asset.decimals)).toFixed(asset.decimals, BigNumber.ROUND_DOWN),
        debt: BigNumber(debt).div(bnDec(borrowAsset.decimals)).toFixed(borrowAsset.decimals, BigNumber.ROUND_DOWN),
        stabilityFee: BigNumber(stabilityFee).div(1000).toFixed(asset.decimals, BigNumber.ROUND_DOWN),
        liquidationFee: BigNumber(liquidationFee).toFixed(asset.decimals, BigNumber.ROUND_DOWN),
        symbol: asset.symbol,
        balance: BigNumber(balanceOf).div(bnDec(asset.decimals)).toFixed(asset.decimals, BigNumber.ROUND_DOWN),
        dolarPrice: dolarPrice,
        utilizationRatio: utilizationRatio,
        liquidationPrice: liquidationPrice,
        initialCollateralRatio: initialCollateralRatio,
        liquidationRatio: liquidationRatio,
        maxColPercent: maxColPercent,
        minColPercent: minColPercent,
        maxUSDPAvailable: maxUSDPAvailable,
        tokenDebts: BigNumber(tokenDebts).div(bnDec(asset.decimals)).toFixed(asset.decimals, BigNumber.ROUND_DOWN),
        tokenDebtLimit: BigNumber(tokenDebtLimit).div(bnDec(asset.decimals)).toFixed(asset.decimals, BigNumber.ROUND_DOWN),
        tokenDebtAvailable: BigNumber(tokenDebtLimit-tokenDebts).div(bnDec(asset.decimals)).toFixed(asset.decimals, BigNumber.ROUND_DOWN),
        status: status,
        tokenMetadata: {
          address: web3.utils.toChecksumAddress(asset.address),
          symbol: asset.symbol,
          decimals: asset.decimals,
          balance: BigNumber(balanceOf).div(bnDec(asset.decimals)).toFixed(asset.decimals, BigNumber.ROUND_DOWN),
          balanceDolar: BigNumber(balanceOf).times(dolarPrice).div(bnDec(asset.decimals)).toFixed(asset.decimals, BigNumber.ROUND_DOWN),
          allowance: BigNumber(allowance).div(bnDec(asset.decimals)).toFixed(asset.decimals),
          icon: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${web3.utils.toChecksumAddress(addy)}/logo.png`,
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

      const cdpSupplied = allAssetsPopulated.reduce((val, asset) => {
        if(!asset) {
          return val
        }
        return BigNumber(val).plus(asset.collateralDolar).toNumber()
      }, 0)

      const cdpMinted = allAssetsPopulated.reduce((val, asset) => {
        if(!asset) {
          return val
        }
        return BigNumber(val).plus(asset.debt).toNumber()
      }, 0)

      this.setStore({
        cdpActive: allAssetsPopulated.filter((asset) => { if(!asset) { return false }; return (BigNumber(asset.collateral).gt(0) || BigNumber(asset.debt).gt(0)) }),
        cdpAssets: allAssetsPopulated,
        cdpSupplied: cdpSupplied,
        cdpMinted: cdpMinted
      })

      this.emitter.emit(CDP_UPDATED)
      this.emitter.emit(CDP_CONFIGURED)
      this.dispatcher.dispatch({ type: GET_CDP_BALANCES })
    })
  }

 isKeydonixOracle = (oracleType) => {
    return [1, 2].includes(oracleType)
  }

  isKeep3rOracle = (oracleType) => {
    return [3, 4].includes(oracleType)
  }

  isKeep3rSushiSwapOracle = (oracleType) => {
    return [7, 8].includes(oracleType)
  }

  _getDolarPrice = async (asset, ethPrice) => {
    try {
      const web3 = await stores.accountStore.getWeb3Provider()

      let dolar = 0

      let sendAmount0 = (10**asset.decimals).toFixed(0)

      //if it is weth, we don't do comparison to weth...
      if(asset.address.toLowerCase() === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'.toLowerCase()) {
        return ethPrice
      }

      if(this.isKeydonixOracle(asset.defaultOracleType)) {

      } else if (this.isKeep3rOracle(asset.defaultOracleType)) {

        const keep3rContract = new web3.eth.Contract(KEEP3RV1ORACLEABI, KEEP3R_ORACLE_ADDRESS)
        const ethPerAsset = await keep3rContract.methods.current(asset.address, sendAmount0, '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2').call({ })

        //Somewhere get ETH price
        dolar = BigNumber(ethPerAsset).times(ethPrice).div(10**asset.decimals).toNumber()

      } else if (this.isKeep3rSushiSwapOracle(asset.defaultOracleType)) {

        const keep3rContract = new web3.eth.Contract(KEEP3RV1ORACLEABI, KEEP3R_SUSHI_ORACLE_ADDRESS)
        const ethPerAsset = await keep3rContract.methods.current(asset.address, sendAmount0, '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2').call({ })

        //Somewhere get ETH price
        dolar = BigNumber(ethPerAsset).times(ethPrice).div(10**asset.decimals).toNumber()

      } else {
        //don't know?
        return 0
      }

      return dolar
    } catch (ex) {
      // console.log(ex)
      return 0
    }
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
