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
  ENABLE_COLLATERAL_LEND,
  ENABLE_COLLATERAL_LEND_RETURNED,
  DISABLE_COLLATERAL_LEND,
  DISABLE_COLLATERAL_LEND_RETURNED,
  IRON_BANK_REGISTRY_ADAPTER,
} from './constants';

import * as moment from 'moment';

import stores from './';
import lendJSON from './configurations/lend';
import { ERC20ABI, COMPTROLLERABI, CERC20DELEGATORABI, CREAMPRICEORACLEABI, IRONBANKREGISTRYADAPTERABI } from './abis';
import { bnDec } from '../utils';

import BatchCall from 'web3-batch-call';
import BigNumber from 'bignumber.js';
const fetch = require('node-fetch');

const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();

class Store {
  constructor(dispatcher, emitter) {
    this.dispatcher = dispatcher;
    this.emitter = emitter;

    this.store = {
      lendingAssets: [],
      lendingSupply: null,
      lendingBorrowLimit: null,
      lendingBorrow: null,
      lendingSupplyAPY: null,
      lendingBorrowAPY: null,
      ironBankTVL: 0,
      position: null,
    };

    dispatcher.register(
      function (payload) {
        switch (payload.type) {
          case CONFIGURE_LENDING:
            this.configure(payload);
            break;
          case GET_LENDING_BALANCES:
            this.getLendingBalances(payload);
            break;
          case APPROVE_LEND:
            this.approveLend(payload);
            break;
          case DEPOSIT_LEND:
            this.depositLend(payload);
            break;
          case WITHDRAW_LEND:
            this.withdrawLend(payload);
            break;
          case BORROW_LEND:
            this.borrowLend(payload);
            break;
          case REPAY_LEND:
            this.repayLend(payload);
            break;
          case ENABLE_COLLATERAL_LEND:
            this.enableCollateralLend(payload);
            break;
          case DISABLE_COLLATERAL_LEND:
            this.disableCollateralLend(payload);
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
    console.log(this.store);
    return this.emitter.emit(STORE_UPDATED);
  };

  configure = async (payload) => {
    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      return null;
    }

    const allMarkets = await this._getAllMarkets(web3);

    const blocksPeryear = 2425846;
    const defaultValues = lendJSON;
    const account = await stores.accountStore.getStore('account');
    if (!account && account.address === undefined) {
      return null;
    }else{

    const IronBankRegistryAdapter = new web3.eth.Contract(IRONBANKREGISTRYADAPTERABI, IRON_BANK_REGISTRY_ADAPTER);
    const adapterPositionOf = await IronBankRegistryAdapter.methods.adapterPositionOf(account.address).call();
    this.setStore({ position: adapterPositionOf });

    async.map(
      allMarkets,
      async (market, callback) => {
        try {
          const marketContract = new web3.eth.Contract(CERC20DELEGATORABI, market);

          //set static values to avoid doing tons more calls.
          let defaultMarket = defaultValues.filter((val) => {
            return val.address === market;
          });

          if (defaultMarket.length > 0) {
            defaultMarket = defaultMarket[0];
          } else {
            defaultMarket = null;
          }

          let erc20Contract = null;
          let vaultSymbol = '';
          let vaultDecimals = 0;
          let vaultName = '';
          let vaultIcon = '';
          let erc20address = '';
          let symbol = '';
          let decimals = 0;
          let name = '';
          let icon = '';

          if (defaultMarket !== null) {
            vaultSymbol = defaultMarket.symbol;
            vaultDecimals = defaultMarket.decimals;
            vaultName = defaultMarket.displayName;
            vaultIcon = defaultMarket.icon;

            erc20address = defaultMarket.tokenMetadata.address;
            symbol = defaultMarket.tokenMetadata.symbol;
            decimals = defaultMarket.tokenMetadata.decimals;
            name = defaultMarket.tokenMetadata.displayName;
            icon = defaultMarket.tokenMetadata.icon;
          } else {

            let localCalls1 = await Promise.all([
              marketContract.methods.decimals().call(),
              marketContract.methods.symbol().call(),
              marketContract.methods.name().call(),
              marketContract.methods.underlying().call()
            ]);

            erc20Contract = new web3.eth.Contract(ERC20ABI, localCalls1[3]);

            let localCalls2 = await Promise.all([
              erc20Contract.methods.symbol().call(),
              erc20Contract.methods.decimals().call(),
              erc20Contract.methods.name().call()
            ]);

            vaultDecimals = localCalls1[0]
            vaultSymbol = localCalls1[1]
            vaultName = localCalls1[2]
            erc20address = localCalls1[3]
            symbol = localCalls2[0]
            decimals = parseInt(localCalls2[1])
            name = localCalls2[2]
            vaultIcon = `https://raw.githubusercontent.com/iearn-finance/yearn-assets/master/icons/tokens/${erc20address}/logo-128.png`;
            icon = `https://raw.githubusercontent.com/iearn-finance/yearn-assets/master/icons/tokens/${erc20address}/logo-128.png`;
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
            },
          };

          if (callback) {
            callback(null, lendingAsset);
          } else {
            return lendingAsset;
          }
        } catch (ex) {
          // console.log(ex);
          // console.log(market);

          if (callback) {
            callback(ex);
          } else {
            throw ex;
          }
        }
      },
      (err, allMarketsData) => {
        if (err) {
          this.emitter.emit(LENDING_CONFIGURED);
          return this.emitter.emit(ERROR, err);
        }

        this.setStore({
          lendingAssets: allMarketsData,
        });

        this.emitter.emit(LEND_UPDATED);
        this.emitter.emit(LENDING_CONFIGURED);

        this.dispatcher.dispatch({ type: GET_LENDING_BALANCES });
      },
    );
    }
  };

  _getCollateralPercent = (vaultSymbol) => {
    switch (vaultSymbol) {
      case 'cyWBTC':
        return 80;
      case 'cyWETH':
        return 85;
      case 'cDAI':
      case 'cUSDT':
      case 'cUSDC':
      case 'cyDAI':
      case 'cyY3CRV':
      case 'cyUSDT':
      case 'cyUSDC':
      case 'cyMUSD':
      case 'cyDUSD':
      case 'cySEUR':
      case 'cyBUSD':
      case 'cyGUSD':
        return 90;
      default:
        return 0;
    }
  };

  _getAllMarkets = async (web3) => {
    try {
      const comptrollerContract = new web3.eth.Contract(COMPTROLLERABI, COMPTROLLER_ADDRESS);
      let allMarkets = await comptrollerContract.methods.getAllMarkets().call();
      let newMarkets = allMarkets.filter((market) => {
        return market !== '0x4e3a36A633f63aee0aB57b5054EC78867CB3C0b8';
      });
      return newMarkets;
    } catch (ex) {
      // console.log(ex);
      return null;
    }
  };

  _getAssetsIn = async (web3, account) => {
    try {
      const comptrollerContract = new web3.eth.Contract(COMPTROLLERABI, COMPTROLLER_ADDRESS);
      const assetsIn = await comptrollerContract.methods.getAssetsIn(account.address).call();
      return assetsIn;
    } catch (ex) {
      // console.log(ex);
      return null;
    }
  };

  getLendingBalances = async (payload) => {
    const lendingAssets = this.getStore('lendingAssets');
    if (!lendingAssets) {
      return null;
    }

    const account = stores.accountStore.getStore('account');

    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      return null;
    }

    let assetsIn = null;
    if (account && account.address) {
      assetsIn = await this._getAssetsIn(web3, account);
    }
    const blocksPeryear = 2425846;

    const creamPriceOracleContract = new web3.eth.Contract(CREAMPRICEORACLEABI, CREAM_PRICE_ORACLE_ADDRESS);
    const comptrollerContract = new web3.eth.Contract(COMPTROLLERABI, COMPTROLLER_ADDRESS);
    async.map(
      lendingAssets,
      async (asset, callback) => {
        // console.log(asset)
        try {
          const marketContract = new web3.eth.Contract(CERC20DELEGATORABI, asset.address);

          let [mar, exchangeRate, cash, borrowRatePerBlock, supplyRatePerBlock, totalBorrows] = await Promise.all([
            comptrollerContract.methods.markets(asset.address).call(),
            marketContract.methods.exchangeRateStored().call(),
            marketContract.methods.getCash().call(),
            marketContract.methods.borrowRatePerBlock().call(),
            marketContract.methods.supplyRatePerBlock().call(),
            marketContract.methods.totalBorrows().call(),
          ]);

          const exchangeRateReal = BigNumber(exchangeRate).div(bnDec(asset.tokenMetadata.decimals)).toFixed(asset.tokenMetadata.decimals, BigNumber.ROUND_DOWN);
          cash = new BigNumber(cash).div(bnDec(asset.tokenMetadata.decimals)).toFixed(asset.tokenMetadata.decimals, BigNumber.ROUND_DOWN);
          const borrowRatePerYear = (borrowRatePerBlock * blocksPeryear) / 1e16;
          const supplyRatePerYear = (supplyRatePerBlock * blocksPeryear) / 1e16;
          totalBorrows = new BigNumber(totalBorrows).div(bnDec(asset.tokenMetadata.decimals)).toFixed(asset.tokenMetadata.decimals, BigNumber.ROUND_DOWN);

          if (account && account.address) {
            const erc20Contract = new web3.eth.Contract(ERC20ABI, asset.tokenMetadata.address);

            let [balance, allowance, supplyBalance, borrowBalance, dollarPerAsset] = await Promise.all([
              erc20Contract.methods.balanceOf(account.address).call(),
              erc20Contract.methods.allowance(account.address, asset.address).call(),
              marketContract.methods.balanceOf(account.address).call(),
              marketContract.methods.borrowBalanceStored(account.address).call(),
              creamPriceOracleContract.methods.getUnderlyingPrice(asset.address).call(),
              marketContract.methods.totalBorrows().call(),
            ]);

            balance = new BigNumber(balance).div(bnDec(asset.tokenMetadata.decimals)).toFixed(asset.tokenMetadata.decimals, BigNumber.ROUND_DOWN);
            supplyBalance = new BigNumber(supplyBalance).times(exchangeRateReal).div(bnDec(18)).toFixed(asset.tokenMetadata.decimals, BigNumber.ROUND_DOWN);
            borrowBalance = new BigNumber(borrowBalance).div(bnDec(asset.tokenMetadata.decimals)).toFixed(asset.tokenMetadata.decimals, BigNumber.ROUND_DOWN);
            const dollarPerAssetReal = dollarPerAsset / 10 ** (36 - asset.tokenMetadata.decimals);

            asset.tokenMetadata.allowance = BigNumber(allowance)
              .div(bnDec(asset.tokenMetadata.decimals))
              .toFixed(asset.tokenMetadata.decimals, BigNumber.ROUND_DOWN);
            asset.tokenMetadata.balance = balance;
            asset.price = dollarPerAssetReal;

            asset.borrowBalance = borrowBalance;
            asset.borrowBalanceDolar = borrowBalance * dollarPerAssetReal;

            asset.supplyBalance = supplyBalance;
            asset.supplyBalanceDolar = supplyBalance * dollarPerAssetReal;

            asset.collateralEnabled = assetsIn.includes(asset.address);
          }

          asset.totalBorrows = totalBorrows;

          asset.liquidity = cash;
          asset.collateralPercent = BigNumber(mar.collateralFactorMantissa).div(10**16).toNumber();

          asset.supplyAPY = supplyRatePerYear;
          asset.borrowAPY = borrowRatePerYear;
          asset.exchangeRate = exchangeRate;
          asset.exchangeRateReal = exchangeRateReal;

          if (callback) {
            callback(null, asset);
          } else {
            return asset;
          }
        } catch (ex) {
          // console.log(asset);
          // console.log(ex);

          if (callback) {
            callback(null, asset);
          } else {
            return asset;
          }
        }
      },
      (err, populatedLendingAssets) => {
        if (err) {
          return this.emitter.emit(ERROR);
        }

        const lendingSupply = populatedLendingAssets.reduce((val, market) => {
          return BigNumber(val).plus(market.supplyBalanceDolar).toNumber();
        }, 0);

        const lendingSupplyAPY = populatedLendingAssets.reduce((val, market) => {
          const vvvv = BigNumber(market.supplyBalanceDolar).div(lendingSupply).times(market.supplyAPY).toNumber();
          return BigNumber(vvvv).plus(val).toNumber();
        }, 0);

        const lendingBorrowLimit = populatedLendingAssets.reduce((val, market) => {
          return BigNumber(val)
            .plus(market.collateralEnabled ? BigNumber(market.supplyBalanceDolar).times(market.collateralPercent).div(100) : 0)
            .toNumber();
        }, 0);

        const lendingBorrow = populatedLendingAssets.reduce((val, market) => {
          return BigNumber(val).plus(market.borrowBalanceDolar).toNumber();
        }, 0);

        const lendingBorrowAPY = populatedLendingAssets.reduce((val, market) => {
          const vvvv = BigNumber(market.borrowBalanceDolar).div(lendingBorrow).times(market.borrowAPY).toNumber();
          return BigNumber(vvvv).plus(val).toNumber();
        }, 0);

        const ironBankTVL = populatedLendingAssets.reduce((val, market) => {
          const vvvv = BigNumber(BigNumber(market.liquidity).plus(market.totalBorrows)).times(market.price).toNumber();
          return BigNumber(vvvv).plus(val).toNumber();
        }, 0);

        this.setStore({
          lendingAssets: populatedLendingAssets,
          lendingSupply: lendingSupply,
          lendingSupplyAPY: lendingSupplyAPY,
          lendingBorrowLimit: lendingBorrowLimit,
          lendingBorrow: lendingBorrow,
          lendingBorrowAPY: lendingBorrowAPY,
          ironBankTVL: ironBankTVL,
        });

        this.emitter.emit(LEND_UPDATED);
        return this.emitter.emit(LENDING_BALANCES_RETURNED);
      },
    );
  };

  approveLend = async (payload) => {
    const account = stores.accountStore.getStore('account');
    if (!account) {
      return false;
      //maybe throw an error
    }

    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      return false;
      //maybe throw an error
    }

    const { lendingAsset, amount, gasSpeed } = payload.content;

    this._callApproveLend(web3, lendingAsset, account, amount, gasSpeed, (err, approveResult) => {
      if (err) {
        return this.emitter.emit(ERROR, err);
      }

      return this.emitter.emit(APPROVE_LEND_RETURNED, approveResult);
    });
  };

  _callApproveLend = async (web3, lendingAsset, account, amount, gasSpeed, callback) => {
    const tokenContract = new web3.eth.Contract(ERC20ABI, lendingAsset.tokenMetadata.address);

    let amountToSend = '0';
    if (amount === 'max') {
      amountToSend = MAX_UINT256;
    } else {
      amountToSend = BigNumber(amount)
        .times(10 ** lendingAsset.tokenMetadata.decimals)
        .toFixed(0);
    }

    const gasPrice = await stores.accountStore.getGasPrice(gasSpeed);

    this._callContract(web3, tokenContract, 'approve', [lendingAsset.address, amountToSend], account, gasPrice, GET_LENDING_BALANCES, callback);
  };

  depositLend = async (payload) => {
    const account = stores.accountStore.getStore('account');
    if (!account) {
      return false;
      //maybe throw an error
    }

    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      return false;
      //maybe throw an error
    }

    const { lendingAsset, amount, gasSpeed } = payload.content;

    this._callDepositLend(web3, lendingAsset, account, amount, gasSpeed, (err, depositResult) => {
      if (err) {
        return this.emitter.emit(ERROR, err);
      }

      return this.emitter.emit(DEPOSIT_LEND_RETURNED, depositResult);
    });
  };

  _callDepositLend = async (web3, lendingAsset, account, amount, gasSpeed, callback) => {
    const lendingContract = new web3.eth.Contract(CERC20DELEGATORABI, lendingAsset.address);

    const amountToSend = BigNumber(amount).times(bnDec(lendingAsset.tokenMetadata.decimals)).toFixed(0);
    const gasPrice = await stores.accountStore.getGasPrice(gasSpeed);

    this._callContract(web3, lendingContract, 'mint', [amountToSend], account, gasPrice, GET_LENDING_BALANCES, callback);
  };

  withdrawLend = async (payload) => {
    const account = stores.accountStore.getStore('account');
    if (!account) {
      return false;
      //maybe throw an error
    }

    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      return false;
      //maybe throw an error
    }

    const { lendingAsset, amount, gasSpeed } = payload.content;

    this._callWithdrawLend(web3, lendingAsset, account, amount, gasSpeed, (err, depositResult) => {
      if (err) {
        return this.emitter.emit(ERROR, err);
      }

      return this.emitter.emit(WITHDRAW_LEND_RETURNED, depositResult);
    });
  };

  _callWithdrawLend = async (web3, lendingAsset, account, amount, gasSpeed, callback) => {
    const lendingContract = new web3.eth.Contract(CERC20DELEGATORABI, lendingAsset.address);

    const amountToSend = BigNumber(amount).times(bnDec(lendingAsset.tokenMetadata.decimals)).toFixed(0);
    const gasPrice = await stores.accountStore.getGasPrice(gasSpeed);

    this._callContract(web3, lendingContract, 'redeemUnderlying', [amountToSend], account, gasPrice, GET_LENDING_BALANCES, callback);
  };

  borrowLend = async (payload) => {
    const account = stores.accountStore.getStore('account');
    if (!account) {
      return false;
      //maybe throw an error
    }

    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      return false;
      //maybe throw an error
    }

    const { lendingAsset, amount, gasSpeed } = payload.content;

    this._callBorrowLend(web3, lendingAsset, account, amount, gasSpeed, (err, depositResult) => {
      if (err) {
        return this.emitter.emit(ERROR, err);
      }

      return this.emitter.emit(BORROW_LEND_RETURNED, depositResult);
    });
  };

  _callBorrowLend = async (web3, lendingAsset, account, amount, gasSpeed, callback) => {
    const lendingContract = new web3.eth.Contract(CERC20DELEGATORABI, lendingAsset.address);

    const amountToSend = BigNumber(amount).times(bnDec(lendingAsset.tokenMetadata.decimals)).toFixed(0);
    const gasPrice = await stores.accountStore.getGasPrice(gasSpeed);

    this._callContract(web3, lendingContract, 'borrow', [amountToSend], account, gasPrice, GET_LENDING_BALANCES, callback);
  };

  repayLend = async (payload) => {
    const account = stores.accountStore.getStore('account');
    if (!account) {
      return false;
      //maybe throw an error
    }

    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      return false;
      //maybe throw an error
    }

    const { lendingAsset, amount, gasSpeed } = payload.content;

    this._callRepayLend(web3, lendingAsset, account, amount, gasSpeed, (err, depositResult) => {
      if (err) {
        return this.emitter.emit(ERROR, err);
      }

      return this.emitter.emit(REPAY_LEND_RETURNED, depositResult);
    });
  };

  _callRepayLend = async (web3, lendingAsset, account, amount, gasSpeed, callback) => {
    const lendingContract = new web3.eth.Contract(CERC20DELEGATORABI, lendingAsset.address);

    const amountToSend = BigNumber(amount).times(bnDec(lendingAsset.tokenMetadata.decimals)).toFixed(0);
    const gasPrice = await stores.accountStore.getGasPrice(gasSpeed);

    this._callContract(web3, lendingContract, 'repayBorrow', [amountToSend], account, gasPrice, GET_LENDING_BALANCES, callback);
  };

  enableCollateralLend = async (payload) => {
    const account = stores.accountStore.getStore('account');
    if (!account) {
      return false;
      //maybe throw an error
    }

    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      return false;
      //maybe throw an error
    }

    const { lendingAsset, gasSpeed } = payload.content;

    this._callEnableCollateral(web3, lendingAsset, account, gasSpeed, (err, depositResult) => {
      if (err) {
        return this.emitter.emit(ERROR, err);
      }

      return this.emitter.emit(ENABLE_COLLATERAL_LEND_RETURNED, depositResult);
    });
  };

  _callEnableCollateral = async (web3, lendingAsset, account, gasSpeed, callback) => {
    const comptrollerContract = new web3.eth.Contract(COMPTROLLERABI, COMPTROLLER_ADDRESS);

    const gasPrice = await stores.accountStore.getGasPrice(gasSpeed);
    this._callContract(web3, comptrollerContract, 'enterMarkets', [[lendingAsset.address]], account, gasPrice, GET_LENDING_BALANCES, callback);
  };

  disableCollateralLend = async (payload) => {
    const account = stores.accountStore.getStore('account');
    if (!account) {
      return false;
      //maybe throw an error
    }

    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      return false;
      //maybe throw an error
    }

    const { lendingAsset, gasSpeed } = payload.content;

    this._callDIsableCollateral(web3, lendingAsset, account, gasSpeed, (err, depositResult) => {
      if (err) {
        return this.emitter.emit(ERROR, err);
      }

      return this.emitter.emit(DISABLE_COLLATERAL_LEND_RETURNED, depositResult);
    });
  };

  _callDIsableCollateral = async (web3, lendingAsset, account, gasSpeed, callback) => {
    const comptrollerContract = new web3.eth.Contract(COMPTROLLERABI, COMPTROLLER_ADDRESS);

    const gasPrice = await stores.accountStore.getGasPrice(gasSpeed);

    this._callContract(web3, comptrollerContract, 'exitMarket', [lendingAsset.address], account, gasPrice, GET_LENDING_BALANCES, callback);
  };

  _callContract = (web3, contract, method, params, account, gasPrice, dispatchEvent, callback) => {
    const context = this;
    contract.methods[method](...params)
      .send({
        from: account.address,
        gasPrice: web3.utils.toWei(gasPrice, 'gwei'),
      })
      .on('transactionHash', function (hash) {
        context.emitter.emit(TX_SUBMITTED, hash);
        callback(null, hash);
      })
      .on('confirmation', function (confirmationNumber, receipt) {
        if (dispatchEvent && confirmationNumber === 1) {
          context.dispatcher.dispatch({ type: dispatchEvent });
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
