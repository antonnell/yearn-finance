import async from 'async';
import {
  MAX_UINT256,
  COMPTROLLER_ADDRESS,
  CREAM_PRICE_ORACLE_ADDRESS,
  ERROR,
  TX_SUBMITTED,
  STORE_UPDATED,
  LEND_UPDATED,
  CONFIGURE_LENDING,
  LENDING_CONFIGURED,
  GET_LENDING_BALANCES,
  LENDING_BALANCES_RETURNED,
  APPROVE_LEND,
  APPROVE_LEND_RETURNED,
  DEPOSIT_LEND,
  DEPOSIT_LEND_RETURNED,
  WITHDRAW_LEND,
  WITHDRAW_LEND_RETURNED,
  BORROW_LEND,
  BORROW_LEND_RETURNED,
  REPAY_LEND,
  REPAY_LEND_RETURNED,
} from './constants';

import * as moment from 'moment';

import stores from './'
import lendJSON from './configurations/lend'
import { ERC20ABI, COMPTROLLERABI, CERC20DELEGATORABI, CREAMPRICEORACLEABI } from './abis'
import { bnDec } from '../utils'

import BatchCall from "web3-batch-call";
import BigNumber from 'bignumber.js'
const fetch = require('node-fetch');

const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();

class Store {
  constructor(dispatcher, emitter) {

    this.dispatcher = dispatcher
    this.emitter = emitter

    this.store = {
      lendingAssets: []
    }

    dispatcher.register(
      function (payload) {
        switch (payload.type) {
          case CONFIGURE_LENDING:
            this.configure(payload)
            break;
          case GET_LENDING_BALANCES:
            this.getLendingBalances(payload)
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
    const account = stores.accountStore.getStore('account')
    const web3 = await stores.accountStore.getWeb3Provider()
    if(!web3) {
      return null
    }

    const allMarkets = await this._getAllMarkets(web3)

    const blocksPeryear = 2425846
    const defaultValues = lendJSON

    const creamPriceOracleContract = new web3.eth.Contract(CREAMPRICEORACLEABI, CREAM_PRICE_ORACLE_ADDRESS)

    async.map(allMarkets, async (market, callback) => {
      try {
        const marketContract = new web3.eth.Contract(CERC20DELEGATORABI, market)

        //set static values to avoid doing tons more calls.
        let defaultMarket = defaultValues.filter((val) => {
          return val.address === market
        })

        if(defaultMarket.length > 0) {
          defaultMarket = defaultMarket[0]
        } else {
          defaultMarket = null
        }

        let erc20Contract = null
        let vaultSymbol = ''
        let vaultDecimals = 0
        let vaultName = ''
        let vaultIcon = ''
        let erc20address = ''
        let symbol = ''
        let decimals = 0
        let name = ''
        let icon = ''

        if(defaultMarket !== null) {
          vaultSymbol = defaultMarket.symbol
          vaultDecimals = defaultMarket.decimals
          vaultName = defaultMarket.displayName
          vaultIcon = defaultMarket.icon

          erc20address = defaultMarket.tokenMetadata.address
          symbol = defaultMarket.tokenMetadata.symbol
          decimals = defaultMarket.tokenMetadata.decimals
          name = defaultMarket.tokenMetadata.displayName
          icon = defaultMarket.tokenMetadata.icon

        } else {
          vaultDecimals = await marketContract.methods.decimals().call()
          vaultSymbol = await marketContract.methods.symbol().call()
          vaultName = await marketContract.methods.name().call()
          vaultIcon = `https://raw.githubusercontent.com/iearn-finance/yearn-assets/master/icons/tokens/${erc20address}/logo-128.png`

          erc20address = await marketContract.methods.underlying().call()
          erc20Contract = new web3.eth.Contract(ERC20ABI, erc20address)
          symbol = await erc20Contract.methods.symbol().call()
          decimals = parseInt(await erc20Contract.methods.decimals().call())
          name = await erc20Contract.methods.name().call()
          icon = `https://raw.githubusercontent.com/iearn-finance/yearn-assets/master/icons/tokens/${erc20address}/logo-128.png`
        }

        const lendingAsset = {
          address: market,
          symbol: vaultSymbol,
          decimals: vaultDecimals,
          displayName: vaultName,
          icon: vaultIcon,

          tokenMetadata: {
            address: erc20address,
            symbol: symbol,
            decimals: decimals,
            displayName: name,
            icon: icon,
          }
        }

        if(callback) {
          callback(null, lendingAsset)
        } else {
          return lendingAsset
        }
      } catch(ex) {
        console.log(ex)
        console.log(market)

        if(callback) {
          callback(ex)
        } else {
          throw ex
        }
      }
    }, (err, allMarketsData) => {
      if(err) {
        return this.emitter.emit(ERROR, err)
      }

      this.setStore({
        lendingAssets: allMarketsData
      })

      this.emitter.emit(LEND_UPDATED)

      this.dispatcher.dispatch({ type: GET_LENDING_BALANCES })
    })
  }

  _getCollateralPercent = (vaultSymbol) => {
    switch (vaultSymbol) {
      case 'cyWETH':
        return 85
      case 'cyDAI':
      case 'cyY3CRV':
        return 90
      default:
        return 90
    }
  }

  _getAllMarkets = async (web3) => {
    try {
      const comptrollerContract = new web3.eth.Contract(COMPTROLLERABI, COMPTROLLER_ADDRESS)
      const allMarkets = await comptrollerContract.methods.getAllMarkets().call()
      return allMarkets
    } catch(ex) {
      console.log(ex)
      return null
    }
  }

  _getAssetsIn = async (web3, account) => {
    try {
      const comptrollerContract = new web3.eth.Contract(COMPTROLLERABI, COMPTROLLER_ADDRESS)
      const assetsIn = await comptrollerContract.methods.getAssetsIn(account.address).call()
      return assetsIn
    } catch(ex) {
      console.log(ex)
      return null
    }
  }

  getLendingBalances = async (payload) => {
    const lendingAssets = this.getStore('lendingAssets')
    if(!lendingAssets) {
      return null
    }

    const account = stores.accountStore.getStore('account')

    const web3 = await stores.accountStore.getWeb3Provider()
    if(!web3) {
      return null
    }

    let assetsIn = null
    if(account && account.address) {
      assetsIn = await this._getAssetsIn(web3, account)
    }
    const blocksPeryear = 2425846

    const creamPriceOracleContract = new web3.eth.Contract(CREAMPRICEORACLEABI, CREAM_PRICE_ORACLE_ADDRESS)

    async.map(lendingAssets, async (asset, callback) => {
      try {
        const marketContract = new web3.eth.Contract(CERC20DELEGATORABI, asset.address)

        const exchangeRate = await marketContract.methods.exchangeRateStored().call()
        const exchangeRateReal = BigNumber(exchangeRate).div(bnDec(asset.tokenMetadata.decimals)).toFixed(asset.tokenMetadata.decimals, BigNumber.ROUND_DOWN)

        let cash = await marketContract.methods.getCash().call()
        cash = new BigNumber(cash).div(bnDec(asset.tokenMetadata.decimals)).toFixed(asset.tokenMetadata.decimals, BigNumber.ROUND_DOWN)

        const borrowRatePerBlock = await marketContract.methods.borrowRatePerBlock().call()
        const supplyRatePerBlock = await marketContract.methods.supplyRatePerBlock().call()

        const borrowRatePerYear = (borrowRatePerBlock) * blocksPeryear / 1e16
        const supplyRatePerYear = (supplyRatePerBlock) * blocksPeryear / 1e16

        if(account && account.address) {
          const erc20Contract = new web3.eth.Contract(ERC20ABI, asset.tokenMetadata.address)
          let balance = await erc20Contract.methods.balanceOf(account.address).call()
          balance = new BigNumber(balance).div(bnDec(asset.tokenMetadata.decimals)).toFixed(asset.tokenMetadata.decimals, BigNumber.ROUND_DOWN)

          let supplyBalance = await marketContract.methods.balanceOf(account.address).call()
          supplyBalance = new BigNumber(supplyBalance).times(exchangeRateReal).div(bnDec(18)).toFixed(asset.tokenMetadata.decimals, BigNumber.ROUND_DOWN)

          let borrowBalance = await marketContract.methods.borrowBalanceStored(account.address).call()
          borrowBalance = new BigNumber(borrowBalance).div(bnDec(asset.tokenMetadata.decimals)).toFixed(asset.tokenMetadata.decimals, BigNumber.ROUND_DOWN)

          const dollarPerAsset = await creamPriceOracleContract.methods.getUnderlyingPrice(asset.address).call()
          const dollarPerAssetReal = dollarPerAsset/(10**(36-asset.tokenMetadata.decimals))

          asset.tokenMetadata.balance = balance
          asset.price = dollarPerAssetReal

          asset.borrowBalance = borrowBalance
          asset.borrowBalanceDolar = borrowBalance*dollarPerAssetReal

          asset.supplyBalance = supplyBalance
          asset.supplyBalanceDolar = supplyBalance*dollarPerAssetReal

          asset.collateralEnabled =  assetsIn.includes(asset.address)
        }

        asset.liquidity = cash
        asset.collateralPercent = this._getCollateralPercent(asset.vaultSymbol)
        asset.supplyAPY = supplyRatePerYear
        asset.borrowAPY = borrowRatePerYear
        asset.exchangeRate = exchangeRate
        asset.exchangeRateReal = exchangeRateReal

        if(callback) {
          callback(null, asset)
        } else {
          return asset
        }
      } catch (ex) {
        console.log(asset)
        console.log(ex)

        if(callback) {
          callback(null, asset)
        } else {
          return asset
        }
      }
    }, (err, populatedLendingAssets) => {
      if(err) {
        return this.emitter.emit(ERROR)
      }

      const lendingSupply = populatedLendingAssets.reduce((val, market) => {
        return BigNumber(val).plus(market.supplyBalanceDolar).toNumber()
      }, 0)

      const lendingBorrowLimit = populatedLendingAssets.reduce((val, market) => {
        return BigNumber(val).plus(market.collateralEnabled ? BigNumber(market.supplyBalanceDolar).times(market.collateralPercent).div(100) : 0).toNumber()
      }, 0)

      const lendingBorrow = populatedLendingAssets.reduce((val, market) => {
        return BigNumber(val).plus(market.borrowBalanceDolar).toNumber()
      }, 0)

      this.setStore({
        lendingAssets: populatedLendingAssets,
        lendingSupply: lendingSupply,
        lendingBorrowLimit: lendingBorrowLimit,
        lendingBorrow: lendingBorrow
      })

      this.emitter.emit(LENDING_CONFIGURED)
      this.emitter.emit(LEND_UPDATED)
      return this.emitter.emit(LENDING_BALANCES_RETURNED)
    })

  }

}

export default Store;
