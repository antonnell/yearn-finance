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
  VAULT_PARAMETERS_ADDRESS,
  VAULT_MANAGER_KEYDONIX_ASSET,
  VAULT_MANAGER_KEEP3R_ASSET,
  VAULT_MANAGER_KEEP3R_SUSHI_ASSET,
  VAULT_MANAGER_STANDARD
} from './constants';

import * as moment from 'moment';

import stores from './'
import {
  ERC20ABI,
  CDPVAULTABI,
  KEEP3RV1ORACLEABI,
  ORACLEREGISTRYABI,
  VAULTMANAGERPARAMSABI,
  VAULTPARAMETERSABI,
  VAULTMANAGERKEEP3RABI,
  VAULTMANAGERKEEP3RSUSHIABI,
  VAULTMANAGERSTANDARDABI,
  UNISWAPV2PAIRABI
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
      rawCDPAssets: cdpJSON.collaterals,
      cdpAssets: [],
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
    const allowanceOf = await borrowAssetContract.methods.allowance(account.address, CDP_VAULT_ADDRESS).call()
    borrowAsset.allowance = BigNumber(allowanceOf).div(bnDec(borrowAsset.decimals)).toFixed(borrowAsset.decimals, BigNumber.ROUND_DOWN)

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
      try {
        const sendAmount0 = (1e18).toFixed(0)
        const keep3rContract = new web3.eth.Contract(KEEP3RV1ORACLEABI, KEEP3R_ORACLE_ADDRESS)
        ethPrice = await keep3rContract.methods.current('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', sendAmount0, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48').call({ })
        ethPrice = BigNumber(ethPrice).div(1e6).toNumber()

        console.log("ETH PRICE")
        console.log(ethPrice)
      } catch(ex) {
        console.log(ex)
        this.emitter.emit(CDP_UPDATED)
        this.emitter.emit(CDP_CONFIGURED)

        this.emitter.emit(ERROR, ex)
        return null
      }
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

        let theDebt = BigNumber(debt).div(bnDec(borrowAsset.decimals))
        let theCollateral = BigNumber(collateral).div(bnDec(asset.decimals))

        utilizationRatio = BigNumber(theDebt).times(10000).div(BigNumber(theCollateral).times(liquidationRatio).times(dolarPrice).toNumber()).toNumber()
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
        collateral: BigNumber(BigNumber(collateral).div(bnDec(asset.decimals)).toFixed(asset.decimals, BigNumber.ROUND_DOWN)).toNumber(),
        collateralDolar: BigNumber(BigNumber(collateral).times(dolarPrice).div(bnDec(asset.decimals)).toFixed(asset.decimals, BigNumber.ROUND_DOWN)).toNumber(),
        debt: BigNumber(BigNumber(debt).div(bnDec(borrowAsset.decimals)).toFixed(borrowAsset.decimals, BigNumber.ROUND_DOWN)).toNumber(),
        stabilityFee: BigNumber(BigNumber(stabilityFee).div(1000).toFixed(asset.decimals, BigNumber.ROUND_DOWN)).toNumber(),
        liquidationFee: BigNumber(BigNumber(liquidationFee).toFixed(asset.decimals, BigNumber.ROUND_DOWN)).toNumber(),
        symbol: asset.symbol,
        balance: BigNumber(BigNumber(balanceOf).div(bnDec(asset.decimals)).toFixed(asset.decimals, BigNumber.ROUND_DOWN)).toNumber(),
        dolarPrice: dolarPrice,
        utilizationRatio: utilizationRatio,
        liquidationPrice: liquidationPrice,
        initialCollateralRatio: initialCollateralRatio,
        liquidationRatio: liquidationRatio,
        maxColPercent: maxColPercent,
        minColPercent: minColPercent,
        maxUSDPAvailable: maxUSDPAvailable,
        tokenDebts: BigNumber(BigNumber(tokenDebts).div(10**18).toFixed(asset.decimals, BigNumber.ROUND_DOWN)).toNumber(),
        tokenDebtLimit: BigNumber(BigNumber(tokenDebtLimit).div(10**18).toFixed(asset.decimals, BigNumber.ROUND_DOWN)).toNumber(),
        tokenDebtAvailable: BigNumber(BigNumber(tokenDebtLimit-tokenDebts).div(10**18).toFixed(asset.decimals, BigNumber.ROUND_DOWN)).toNumber(),
        status: status,
        tokenMetadata: {
          address: web3.utils.toChecksumAddress(asset.address),
          symbol: asset.symbol,
          decimals: asset.decimals,
          balance: BigNumber(BigNumber(balanceOf).div(bnDec(asset.decimals)).toFixed(asset.decimals, BigNumber.ROUND_DOWN)).toNumber(),
          balanceDolar: BigNumber(BigNumber(balanceOf).times(dolarPrice).div(bnDec(asset.decimals)).toFixed(asset.decimals, BigNumber.ROUND_DOWN)).toNumber(),
          allowance: BigNumber(BigNumber(allowance).div(bnDec(asset.decimals)).toFixed(asset.decimals)).toNumber(),
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
        let ethPerAsset = 0
        if (token.poolTokens) {
          const uniswapPairContract = new web3.eth.Contract(UNISWAPV2PAIRABI, asset.address)
          const token0Address = await uniswapPairContract.methods.token0().call()
          const token1Address = await uniswapPairContract.methods.token1().call()
          const [_reserve0, _reserve1] = await uniswapPairContract.methods.getReserves().call()

        } else {
          ethPerAsset = await keep3rContract.methods.current(asset.address, sendAmount0, '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2').call({ })
        }
        dolar = BigNumber(ethPerAsset).times(ethPrice).div(10**18).toNumber()
      } else if (this.isKeep3rSushiSwapOracle(asset.defaultOracleType)) {
        const keep3rContract = new web3.eth.Contract(KEEP3RV1ORACLEABI, KEEP3R_SUSHI_ORACLE_ADDRESS)
        let ethPerAsset = 0
        if(token.poolTokens) {

        } else {
          ethPerAsset = await keep3rContract.methods.current(asset.address, sendAmount0, '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2').call({ })
        }
        dolar = BigNumber(ethPerAsset).times(ethPrice).div(10**18).toNumber()
      } else {
        //don't know?
        return 0
      }

      return dolar
    } catch (ex) {
      console.log(ex)
      return 0
    }
  }

  _getAssets = async () => {
    return this.getStore('rawCDPAssets')
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

      return this.emitter.emit(APPROVE_CDP_RETURNED, approveResult)
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

    this._callContract(web3, tokenContract, 'approve', [CDP_VAULT_ADDRESS, amountToSend], account, gasPrice, CONFIGURE_CDP, callback)
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

    const { cdp, depositAmount, borrowAmount, gasSpeed } = payload.content

    // all others for now
    if (BigNumber(depositAmount).gt(0) && (!borrowAmount || borrowAmount === '' || BigNumber(borrowAmount).eq(0))) {
      this._callDepositCDP(web3, cdp, account, depositAmount, borrowAmount, gasSpeed, (err, depositResult) => {
        if(err) {
          return this.emitter.emit(ERROR, err);
        }

        return this.emitter.emit(DEPOSIT_BORROW_CDP_RETURNED, depositResult)
      })
    } else {
      this._callDepositAndBorrowCDP(web3, cdp, account, depositAmount, borrowAmount, gasSpeed, (err, depositResult) => {
        if(err) {
          return this.emitter.emit(ERROR, err);
        }

        return this.emitter.emit(DEPOSIT_BORROW_CDP_RETURNED, depositResult)
      })
    }
  }

  _callDepositCDP = async (web3, asset, account, depositAmount, borrowAmount, gasSpeed, callback) => {
    try {
      let cdpContract = new web3.eth.Contract(VAULTMANAGERSTANDARDABI, VAULT_MANAGER_STANDARD)

      const depositAmountToSend = BigNumber(depositAmount === '' ? 0 : depositAmount).times(10**18).toFixed(0)
      const gasPrice = await stores.accountStore.getGasPrice(gasSpeed)

      console.log(asset.tokenMetadata.address, depositAmountToSend)

      this._callContract(web3, cdpContract, 'deposit', [asset.tokenMetadata.address, depositAmountToSend], account, gasPrice, CONFIGURE_CDP, callback)
    } catch(ex) {
      console.log(ex)
      return this.emitter.emit(ERROR, ex);
    }
  }

  _callDepositAndBorrowCDP = async (web3, asset, account, depositAmount, borrowAmount, gasSpeed, callback) => {
    try {

      const depositAmountToSend = BigNumber(depositAmount === '' ? 0 : depositAmount).times(bnDec(asset.tokenMetadata.decimals)).toFixed(0)
      const borrowAmountToSend = BigNumber(borrowAmount === '' ? 0 : borrowAmount).times(10**18).toFixed(0)
      const gasPrice = await stores.accountStore.getGasPrice(gasSpeed)

      console.log(asset.tokenMetadata.address, depositAmountToSend, borrowAmountToSend)

      let cdpContract = null
      let params = null

      if(this.isKeydonixOracle(asset.defaultOracleType)) {
        return
      } else if (this.isKeep3rOracle(asset.defaultOracleType)) {
        cdpContract = new web3.eth.Contract(VAULTMANAGERKEEP3RABI, VAULT_MANAGER_KEEP3R_ASSET)
        params = [asset.tokenMetadata.address, depositAmountToSend, '0', borrowAmountToSend]
      } else if (this.isKeep3rSushiSwapOracle(asset.defaultOracleType)) {
        cdpContract = new web3.eth.Contract(VAULTMANAGERKEEP3RSUSHIABI, VAULT_MANAGER_KEEP3R_SUSHI_ASSET)
        params = [asset.tokenMetadata.address, depositAmountToSend, borrowAmountToSend]
      }

      if(BigNumber(asset.debt).gt(0)) {
        this._callContract(web3, cdpContract, 'depositAndBorrow', params, account, gasPrice, CONFIGURE_CDP, callback)
      } else {
        this._callContract(web3, cdpContract, 'spawn', params, account, gasPrice, CONFIGURE_CDP, callback)
      }

    } catch(ex) {
      console.log(ex)
      return this.emitter.emit(ERROR, ex);
    }
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

    const { cdp, repayAmount, withdrawAmount, gasSpeed } = payload.content

    if(BigNumber(repayAmount).eq(cdp.debt) || ((!repayAmount || repayAmount === '' || BigNumber(repayAmount).eq(0)) && BigNumber(cdp.debt).eq(0))) {
      this._callRepayAllAndWithdrawCDP(web3, cdp, account, repayAmount, withdrawAmount, gasSpeed, (err, depositResult) => {
        if(err) {
          return this.emitter.emit(ERROR, err);
        }

        return this.emitter.emit(WITHDRAW_REPAY_CDP_RETURNED, depositResult)
      })
    } else if (BigNumber(repayAmount).gt(0) && (!withdrawAmount || withdrawAmount === '' || BigNumber(withdrawAmount).eq(0))) {
      this._callRepayCDP(web3, cdp, account, repayAmount, withdrawAmount, gasSpeed, (err, depositResult) => {
        if(err) {
          return this.emitter.emit(ERROR, err);
        }

        return this.emitter.emit(WITHDRAW_REPAY_CDP_RETURNED, depositResult)
      })
    } else {
      this._callWithdrawCDP(web3, cdp, account, repayAmount, withdrawAmount, gasSpeed, (err, depositResult) => {
        if(err) {
          return this.emitter.emit(ERROR, err);
        }

        return this.emitter.emit(WITHDRAW_REPAY_CDP_RETURNED, depositResult)
      })
    }
  }

  _callRepayAllAndWithdrawCDP = async (web3, asset, account, repayAmount, withdrawAmount, gasSpeed, callback) => {
    try {
      let cdpContract = new web3.eth.Contract(VAULTMANAGERSTANDARDABI, VAULT_MANAGER_STANDARD)

      const withdrawAmountToSend = BigNumber(withdrawAmount === '' ? 0 : withdrawAmount).times(bnDec(asset.tokenMetadata.decimals)).toFixed(0)
      const gasPrice = await stores.accountStore.getGasPrice(gasSpeed)

      console.log(asset.tokenMetadata.address, withdrawAmountToSend)

      this._callContract(web3, cdpContract, 'repayAllAndWithdraw', [asset.tokenMetadata.address, withdrawAmountToSend], account, gasPrice, CONFIGURE_CDP, callback)
    } catch(ex) {
      console.log(ex)
      return this.emitter.emit(ERROR, ex);
    }
  }

  _callRepayCDP = async (web3, asset, account, repayAmount, withdrawAmount, gasSpeed, callback) => {
    try {
      let cdpContract = new web3.eth.Contract(VAULTMANAGERSTANDARDABI, VAULT_MANAGER_STANDARD)

      const repayAmountToSend = BigNumber(repayAmount === '' ? 0 : repayAmount).times(10**18).toFixed(0)
      const gasPrice = await stores.accountStore.getGasPrice(gasSpeed)

      console.log(asset.tokenMetadata.address, repayAmountToSend)

      this._callContract(web3, cdpContract, 'repay', [asset.tokenMetadata.address, repayAmountToSend], account, gasPrice, CONFIGURE_CDP, callback)
    } catch(ex) {
      console.log(ex)
      return this.emitter.emit(ERROR, ex);
    }
  }

  _callWithdrawCDP = async (web3, asset, account, repayAmount, withdrawAmount, gasSpeed, callback) => {
    try {
      const repayAmountToSend = BigNumber(repayAmount === '' ? 0 : repayAmount).times(10**18).toFixed(0)
      const withdrawAmountToSend = BigNumber(withdrawAmount === '' ? 0 : withdrawAmount).times(bnDec(asset.tokenMetadata.decimals)).toFixed(0)
      const gasPrice = await stores.accountStore.getGasPrice(gasSpeed)

      let cdpContract = null
      let params = null

      if(this.isKeydonixOracle(asset.defaultOracleType)) {
        return
      } else if (this.isKeep3rOracle(asset.defaultOracleType)) {
        cdpContract = new web3.eth.Contract(VAULTMANAGERKEEP3RABI, VAULT_MANAGER_KEEP3R_ASSET)
        params = [asset.tokenMetadata.address, withdrawAmountToSend, '0', repayAmountToSend]
      } else if (this.isKeep3rSushiSwapOracle(asset.defaultOracleType)) {
        cdpContract = new web3.eth.Contract(VAULTMANAGERKEEP3RSUSHIABI, VAULT_MANAGER_KEEP3R_SUSHI_ASSET)
        params = [asset.tokenMetadata.address, withdrawAmountToSend, repayAmountToSend]
      }

      console.log(asset.tokenMetadata.address, repayAmountToSend, withdrawAmountToSend)

      this._callContract(web3, cdpContract, 'withdrawAndRepay', params, account, gasPrice, CONFIGURE_CDP, callback)
    } catch(ex) {
      console.log(ex)
      return this.emitter.emit(ERROR, ex);
    }
  }

  _callContract = (web3, contract, method, params, account, gasPrice, dispatchEvent, callback) => {

    console.log(method)
    console.log(params)

    const context = this
    contract.methods[method](...params).send({ from: account.address, gasPrice: web3.utils.toWei(gasPrice, 'gwei') })
      .on('transactionHash', function(hash){
        context.emitter.emit(TX_SUBMITTED, hash)
        callback(null, hash)
      })
      .on('confirmation', function(confirmationNumber, receipt){
        if(dispatchEvent && confirmationNumber === 0) {
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
