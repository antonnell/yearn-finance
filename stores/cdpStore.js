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
  VAULT_MANAGER_STANDARD,
  COLLATERAL_REGISTRY_ADDRESS,
} from './constants';

import * as moment from 'moment';

import stores from './';
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
  COLLATERALREGISTRYABI,
  UNISWAPPAIRABI,
  CHAINLINKORACLEABI,
} from './abis';
import { bnDec, sqrt } from '../utils';
import cdpJSON from './configurations/cdp';

import BigNumber from 'bignumber.js';
const fetch = require('node-fetch');

class Store {
  constructor(dispatcher, emitter) {
    this.dispatcher = dispatcher;
    this.emitter = emitter;

    this.store = {
      rawCDPAssets: cdpJSON.collaterals,
      cdpAssets: [],
      cdpActive: [],
      borrowAsset: cdpJSON.borrowAsset,
      position: {},
    };

    dispatcher.register(
      function (payload) {
        switch (payload.type) {
          case CONFIGURE_CDP:
            this.configure(payload);
            break;
          case GET_CDP_BALANCES:
            this.getCDPBalances(payload);
            break;
          case APPROVE_CDP:
            this.approveCDP(payload);
            break;
          case DEPOSIT_BORROW_CDP:
            this.depositCDP(payload);
            break;
          case WITHDRAW_REPAY_CDP:
            this.withdrawCDP(payload);
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

    const account = await stores.accountStore.getStore('account');
    if (!account) {
      return null;
    }

    // set borrow details
    let borrowAsset = this.getStore('borrowAsset');

    try {
      const borrowAssetContract = new web3.eth.Contract(ERC20ABI, borrowAsset.address);
      const borrowBalanceOf = await borrowAssetContract.methods.balanceOf(account.address).call();
      borrowAsset.balance = BigNumber(borrowBalanceOf).div(bnDec(borrowAsset.decimals)).toFixed(borrowAsset.decimals, BigNumber.ROUND_DOWN);
      const allowanceOf = await borrowAssetContract.methods.allowance(account.address, CDP_VAULT_ADDRESS).call();
      borrowAsset.allowance = BigNumber(allowanceOf).div(bnDec(borrowAsset.decimals)).toFixed(borrowAsset.decimals, BigNumber.ROUND_DOWN);

      this.setStore({ borrowAsset: borrowAsset });

      //get all supported assets
      const allAssets = await this._getAssets(web3);
      // get open CDPS
      const vaultContract = new web3.eth.Contract(CDPVAULTABI, CDP_VAULT_ADDRESS);

      let ethPrice = null;
      try {
        const contractAddress = await web3.eth.ens.getAddress(`eth-usd.data.eth`);
        const chainLinkContract = new web3.eth.Contract(CHAINLINKORACLEABI, contractAddress);

        const assetPrice = await chainLinkContract.methods.latestAnswer().call();
        ethPrice = BigNumber(assetPrice)
          .div(10 ** 8)
          .toNumber();
      } catch (ex) {
        console.log(ex);
      }

      const vaultManagerParamsContract = new web3.eth.Contract(VAULTMANAGERPARAMSABI, VAULT_MANAGER_PARAMETERS_ADDRESS);
      const vaultParametersContract = new web3.eth.Contract(VAULTPARAMETERSABI, VAULT_PARAMETERS_ADDRESS);

      async.map(
        allAssets,
        async (asset, callback) => {
          if (!asset || !asset.address) {
            callback(null, null);
            return null;
          }

          try {
            const collateral = await vaultContract.methods.collaterals(asset.address, account.address).call();
            const debt = await vaultContract.methods.debts(asset.address, account.address).call();

            const oracleType = await this._getORacleType(vaultParametersContract, asset.address);

            if (![5, 12].includes(oracleType)) {
              if (callback) {
                callback(null, returnAsset);
              } else {
                return returnAsset;
              }

              return;
            }

            const stabilityFee = await vaultParametersContract.methods.stabilityFee(asset.address).call();
            const tokenDebts = await vaultContract.methods.tokenDebts(asset.address).call();
            const liquidationFee = await vaultParametersContract.methods.liquidationFee(asset.address).call();
            const tokenDebtLimit = await vaultParametersContract.methods.tokenDebtLimit(asset.address).call();

            const initialCollateralRatio = await vaultManagerParamsContract.methods.initialCollateralRatio(asset.address).call();
            const liquidationRatio = await vaultManagerParamsContract.methods.liquidationRatio(asset.address).call();
            const maxColPercent = await vaultManagerParamsContract.methods.maxColPercent(asset.address).call();
            const minColPercent = await vaultManagerParamsContract.methods.minColPercent(asset.address).call();

            const erc20Contract = new web3.eth.Contract(ERC20ABI, asset.address);

            let decimals = 0;
            let symbol = '';
            // MAKER returns a web3 error for .decimals. logic
            if (asset.address !== '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2') {
              if (oracleType === 4 || oracleType === 8 || oracleType === 12) {
                const isSushi = await this._isSushi(vaultParametersContract, asset.address);

                const uniswapPairContract = new web3.eth.Contract(UNISWAPPAIRABI, asset.address);
                const token0 = await uniswapPairContract.methods.token0().call();
                const token1 = await uniswapPairContract.methods.token1().call();

                const prepend = isSushi ? 'SUSHI' : 'UNI';
                const erc20Contract0 = new web3.eth.Contract(ERC20ABI, token0);
                const erc20Contract1 = new web3.eth.Contract(ERC20ABI, token1);
                let symbol0 = '';
                let symbol1 = '';

                if (token0 !== '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2') {
                  symbol0 = await erc20Contract0.methods.symbol().call();
                } else {
                  symbol0 = 'MKR';
                }

                if (token1 !== '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2') {
                  symbol1 = await erc20Contract1.methods.symbol().call();
                } else {
                  symbol1 = 'MKR';
                }

                symbol = `${prepend}-${symbol0}/${symbol1}`;
              } else {
                symbol = await erc20Contract.methods.symbol().call();
              }
              decimals = BigNumber(await erc20Contract.methods.decimals().call()).toNumber();
            } else {
              decimals = 18;
              symbol = 'MKR';
            }
            const balanceOf = await erc20Contract.methods.balanceOf(account.address).call();
            const allowance = await erc20Contract.methods.allowance(account.address, CDP_VAULT_ADDRESS).call();

            let addy = asset.address;
            if (symbol.includes('UNI-')) {
              addy = '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984';
            } else if (symbol.includes('SUSHI-')) {
              addy = '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2';
            }

            asset.decimals = decimals;
            asset.symbol = symbol;
            asset.defaultOracleType = oracleType;

            // get dolar price
            const dolarPrice = await this._getDolarPrice(asset, ethPrice);

            let utilizationRatio = 0;
            let maxUSDPAvailable = 0;
            let liquidationPrice = 0;
            let status = 'Unknown';

            if (BigNumber(collateral).gt(0)) {
              let theDebt = BigNumber(debt).div(bnDec(borrowAsset.decimals));
              let theCollateral = BigNumber(collateral).div(bnDec(decimals));

              if (dolarPrice === 'Stale price') {
                utilizationRatio = 'Unknown';
                maxUSDPAvailable = 'Unknown';
                liquidationPrice = 'Unknown';
              } else {
                utilizationRatio = BigNumber(theDebt)
                  .times(10000)
                  .div(BigNumber(theCollateral).times(liquidationRatio).times(dolarPrice).toNumber())
                  .toNumber();
                maxUSDPAvailable = BigNumber(collateral).div(bnDec(decimals)).times(liquidationRatio).div(100).times(dolarPrice).toNumber();
                liquidationPrice = BigNumber(dolarPrice).times(utilizationRatio).div(100).toNumber();
              }

              if (utilizationRatio === 'Unknown') {
                status = 'Unknown';
              } else if (BigNumber(utilizationRatio).gt(90)) {
                status = 'Liquidatable';
              } else if (BigNumber(utilizationRatio).gt(90)) {
                status = 'Dangerous';
              } else if (BigNumber(utilizationRatio).gt(75)) {
                status = 'Moderate';
              } else {
                status = 'Safe';
              }
            } else {
              status = 'Safe';
            }

            const returnAsset = {
              defaultOracleType: oracleType,
              collateral: BigNumber(BigNumber(collateral).div(bnDec(decimals)).toFixed(decimals, BigNumber.ROUND_DOWN)).toNumber(),
              collateralDolar:
                dolarPrice === 'Stale price'
                  ? 'Unknown'
                  : BigNumber(BigNumber(collateral).times(dolarPrice).div(bnDec(decimals)).toFixed(decimals, BigNumber.ROUND_DOWN)).toNumber(),
              debt: BigNumber(BigNumber(debt).div(bnDec(borrowAsset.decimals)).toFixed(borrowAsset.decimals, BigNumber.ROUND_DOWN)).toNumber(),
              stabilityFee: BigNumber(BigNumber(stabilityFee).div(1000).toFixed(decimals, BigNumber.ROUND_DOWN)).toNumber(),
              liquidationFee: BigNumber(BigNumber(liquidationFee).toFixed(decimals, BigNumber.ROUND_DOWN)).toNumber(),
              symbol: symbol,
              balance: BigNumber(BigNumber(balanceOf).div(bnDec(decimals)).toFixed(decimals, BigNumber.ROUND_DOWN)).toNumber(),
              dolarPrice: dolarPrice,
              utilizationRatio: utilizationRatio,
              liquidationPrice: liquidationPrice,
              initialCollateralRatio: initialCollateralRatio,
              liquidationRatio: liquidationRatio,
              maxColPercent: maxColPercent,
              minColPercent: minColPercent,
              maxUSDPAvailable: maxUSDPAvailable,
              tokenDebts: BigNumber(
                BigNumber(tokenDebts)
                  .div(10 ** 18)
                  .toFixed(decimals, BigNumber.ROUND_DOWN),
              ).toNumber(),
              tokenDebtLimit: BigNumber(
                BigNumber(tokenDebtLimit)
                  .div(10 ** 18)
                  .toFixed(decimals, BigNumber.ROUND_DOWN),
              ).toNumber(),
              tokenDebtAvailable: BigNumber(
                BigNumber(tokenDebtLimit - tokenDebts)
                  .div(10 ** 18)
                  .toFixed(decimals, BigNumber.ROUND_DOWN),
              ).toNumber(),
              status: status,
              tokenMetadata: {
                address: web3.utils.toChecksumAddress(asset.address),
                symbol: symbol,
                decimals: decimals,
                balance: BigNumber(BigNumber(balanceOf).div(bnDec(decimals)).toFixed(decimals, BigNumber.ROUND_DOWN)).toNumber(),
                balanceDolar:
                  dolarPrice === 'Stale price'
                    ? 'Unknown'
                    : BigNumber(BigNumber(balanceOf).times(dolarPrice).div(bnDec(decimals)).toFixed(decimals, BigNumber.ROUND_DOWN)).toNumber(),
                allowance: BigNumber(BigNumber(allowance).div(bnDec(decimals)).toFixed(decimals)).toNumber(),
                icon: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${web3.utils.toChecksumAddress(addy)}/logo.png`,
              },
            };

            if (callback) {
              callback(null, returnAsset);
            } else {
              return returnAsset;
            }
          } catch (ex) {
            console.log(asset);
            console.log(ex);
            if (callback) {
              callback(null, null);
            } else {
              return null;
            }
          }
        },
        (err, allAssetsPopulated) => {
          if (err) {
            return this.emitter.emit(ERROR);
          }

          const cdpSupplied = allAssetsPopulated.reduce((val, asset) => {
            if (!asset) {
              return val;
            }
            if (val === 'Unknown') {
              return 'Unknown';
            }
            if (BigNumber(asset.collateral).gt(0) && asset.collateralDolar === 'Unknown') {
              return 'Unknown';
            }
            if (asset.collateralDolar !== 'Unknown') {
              return BigNumber(val).plus(asset.collateralDolar).toNumber();
            }

            return val;
          }, 0);

          const cdpMinted = allAssetsPopulated.reduce((val, asset) => {
            if (!asset) {
              return val;
            }
            return BigNumber(val).plus(asset.debt).toNumber();
          }, 0);

          this.setStore({
            cdpActive: allAssetsPopulated.filter((asset) => {
              if (!asset) {
                return false;
              }
              return BigNumber(asset.collateral).gt(0) || BigNumber(asset.debt).gt(0);
            }),
            cdpAssets: allAssetsPopulated,
            cdpSupplied: cdpSupplied,
            cdpMinted: cdpMinted,
          });

          this.emitter.emit(CDP_UPDATED);
          this.emitter.emit(CDP_CONFIGURED);
          this.dispatcher.dispatch({ type: GET_CDP_BALANCES });
        },
      );
    } catch (ex) {
      console.log(ex);
      this.emitter.emit(CDP_CONFIGURED);
      this.emitter.emit(ERROR, ex);
    }
  };

  _isSushi = async (vaultParams, address) => {
    const isSushi = await vaultParams.methods.isOracleTypeEnabled(8, address).call();
    return isSushi;
  };

  _getORacleType = async (vaultParams, address) => {
    //only ever seen oracle types: 3, 4, 7, 8

    // 5 is chainlink, which I believe they changed all their feeds to
    const is5 = await vaultParams.methods.isOracleTypeEnabled(5, address).call();
    if (is5) {
      return 5;
    }
    const is3 = await vaultParams.methods.isOracleTypeEnabled(3, address).call();
    if (is3) {
      return 3;
    }
    const is7 = await vaultParams.methods.isOracleTypeEnabled(7, address).call();
    if (is7) {
      return 7;
    }

    const is12 = await vaultParams.methods.isOracleTypeEnabled(12, address).call();
    if (is12) {
      return 12;
    }

    const is4 = await vaultParams.methods.isOracleTypeEnabled(4, address).call();
    if (is4) {
      return 4;
    }
    const is8 = await vaultParams.methods.isOracleTypeEnabled(8, address).call();
    if (is8) {
      return 8;
    }

    return 0;
  };

  isKeydonixOracle = (oracleType) => {
    return [1, 2].includes(oracleType);
  };

  isKeep3rOracle = (oracleType) => {
    return [3, 4].includes(oracleType);
  };

  isKeep3rSushiSwapOracle = (oracleType) => {
    return [7, 8].includes(oracleType);
  };

  isChainlinkOracle = (oracleType) => {
    return [5, 12].includes(oracleType);
  };

  _getDolarPrice = async (asset, ethPrice) => {
    try {
      const web3 = await stores.accountStore.getWeb3Provider();

      let dolar = 0;

      let sendAmount0 = (10 ** asset.decimals).toFixed(0);

      //if it is weth, we don't do comparison to weth...
      if (asset.address.toLowerCase() === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'.toLowerCase()) {
        return ethPrice;
      }

      if (this.isChainlinkOracle(asset.defaultOracleType)) {
        try {
          if (asset.defaultOracleType === 5) {
            const contractAddress = await web3.eth.ens.getAddress(
              `${['WBTC', 'renBTC'].includes(asset.symbol) ? 'btc' : asset.symbol.toLowerCase()}-eth.data.eth`,
            );
            const chainLinkContract = new web3.eth.Contract(CHAINLINKORACLEABI, contractAddress);

            const assetPrice = await chainLinkContract.methods.latestAnswer().call();

            dolar = BigNumber(assetPrice)
              .times(ethPrice)
              .div(10 ** 18)
              .toNumber();
          } else {
            const uniswapPairContract = new web3.eth.Contract(UNISWAPPAIRABI, asset.address);
            const token0 = await uniswapPairContract.methods.token0().call();
            const token1 = await uniswapPairContract.methods.token1().call();

            const totalSupply = await uniswapPairContract.methods.totalSupply().call();
            const obj = await uniswapPairContract.methods.getReserves().call();
            let reserve0 = obj[0];
            let reserve1 = obj[1];

            let token0Price = 0;
            let token1Price = 0;

            if (token0.toLowerCase() === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'.toLowerCase()) {
              token0Price = ethPrice;
            } else {
              let erc20Contract = new web3.eth.Contract(ERC20ABI, token0);
              let decimalsToken0 = parseInt(await erc20Contract.methods.decimals().call());
              let symbolToken0 = await erc20Contract.methods.symbol().call();
              let sendAmountToken0 = (10 ** decimalsToken0).toFixed(0);

              const contractAddress = await web3.eth.ens.getAddress(
                `${['WBTC', 'renBTC'].includes(symbolToken0) ? 'btc' : symbolToken0.toLowerCase()}-eth.data.eth`,
              );
              const chainLinkContract = new web3.eth.Contract(CHAINLINKORACLEABI, contractAddress);
              const token0EthPrice = await chainLinkContract.methods.latestAnswer().call();

              token0Price = BigNumber(token0EthPrice)
                .times(ethPrice)
                .div(10 ** decimalsToken0)
                .toNumber();
            }

            if (token1.toLowerCase() === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'.toLowerCase()) {
              token1Price = ethPrice;
            } else {
              let erc20Contract = new web3.eth.Contract(ERC20ABI, token1);
              let decimalsToken1 = parseInt(await erc20Contract.methods.decimals().call());
              let symbolToken1 = await erc20Contract.methods.symbol().call();
              let sendAmountToken1 = (10 ** decimalsToken1).toFixed(0);

              const contractAddress = await web3.eth.ens.getAddress(
                `${['WBTC', 'renBTC'].includes(symbolToken1) ? 'btc' : symbolToken1.toLowerCase()}-eth.data.eth`,
              );
              const chainLinkContract = new web3.eth.Contract(CHAINLINKORACLEABI, contractAddress);
              const token1EthPrice = await chainLinkContract.methods.latestAnswer().call();

              token1Price = BigNumber(token1EthPrice)
                .times(ethPrice)
                .div(10 ** decimalsToken1)
                .toNumber();
            }

            console.log(token0);
            console.log(token0Price);
            console.log(reserve0);
            console.log('---');
            console.log(token1);
            console.log(token1Price);
            console.log(reserve1);
            console.log('----------------------');

            let pricePerShare0 = BigNumber(token0Price).times(reserve0);
            let pricePerShare1 = BigNumber(token1Price).times(reserve1);

            dolar = BigNumber(BigNumber(pricePerShare0).plus(pricePerShare1)).div(totalSupply).toNumber();
          }
        } catch (ex) {
          console.log(ex);
        }
      } else if (this.isKeep3rOracle(asset.defaultOracleType)) {
        const keep3rContract = new web3.eth.Contract(KEEP3RV1ORACLEABI, KEEP3R_ORACLE_ADDRESS);

        if (asset.defaultOracleType === 3) {
          const ethPerAsset = await keep3rContract.methods.current(asset.address, sendAmount0, '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2').call({});

          dolar = BigNumber(ethPerAsset)
            .times(ethPrice)
            .div(10 ** 18)
            .toNumber();
        } else {
          // pool asset
          const uniswapPairContract = new web3.eth.Contract(UNISWAPPAIRABI, asset.address);
          const token0 = await uniswapPairContract.methods.token0().call();
          const token1 = await uniswapPairContract.methods.token1().call();

          const totalSupply = await uniswapPairContract.methods.totalSupply().call();
          const obj = await uniswapPairContract.methods.getReserves().call();
          let reserve0 = obj[0];
          let reserve1 = obj[1];

          let token0Price = 0;
          let token1Price = 0;

          if (token0.toLowerCase() === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'.toLowerCase()) {
            token0Price = ethPrice;
          } else {
            let erc20Contract = new web3.eth.Contract(ERC20ABI, token0);
            let decimalsToken0 = parseInt(await erc20Contract.methods.decimals().call());
            let sendAmountToken0 = (10 ** decimalsToken0).toFixed(0);
            let token0EthPrice = await keep3rContract.methods.current(token0, sendAmountToken0, '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2').call({});

            token0Price = BigNumber(token0EthPrice)
              .times(ethPrice)
              .div(10 ** decimalsToken0)
              .toNumber();
          }

          if (token1.toLowerCase() === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'.toLowerCase()) {
            token1Price = ethPrice;
          } else {
            let erc20Contract = new web3.eth.Contract(ERC20ABI, token1);
            let decimalsToken1 = parseInt(await erc20Contract.methods.decimals().call());
            let sendAmountToken1 = (10 ** decimalsToken1).toFixed(0);
            let token1EthPrice = await keep3rContract.methods.current(token1, sendAmountToken1, '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2').call({});

            token1Price = BigNumber(token1EthPrice)
              .times(ethPrice)
              .div(10 ** decimalsToken1)
              .toNumber();
            //still need to multiply by ethPrice ???
          }

          let pricePerShare0 = BigNumber(token0Price).times(reserve0);
          let pricePerShare1 = BigNumber(token1Price).times(reserve1);

          dolar = BigNumber(BigNumber(pricePerShare0).plus(pricePerShare1)).div(totalSupply).toNumber();
        }
      } else if (this.isKeep3rSushiSwapOracle(asset.defaultOracleType)) {
        const keep3rContract = new web3.eth.Contract(KEEP3RV1ORACLEABI, KEEP3R_SUSHI_ORACLE_ADDRESS);

        if (asset.defaultOracleType === 7) {
          const ethPerAsset = await keep3rContract.methods.current(asset.address, sendAmount0, '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2').call({});
          dolar = BigNumber(ethPerAsset)
            .times(ethPrice)
            .div(10 ** 18)
            .toNumber();
        } else {
          // pool asset
          const uniswapPairContract = new web3.eth.Contract(UNISWAPPAIRABI, asset.address);
          const token0 = await uniswapPairContract.methods.token0().call();
          const token1 = await uniswapPairContract.methods.token1().call();

          const totalSupply = await uniswapPairContract.methods.totalSupply().call();
          const obj = await uniswapPairContract.methods.getReserves().call();
          let reserve0 = obj[0];
          let reserve1 = obj[1];

          let token0Price = 0;
          let token1Price = 0;

          if (token0.toLowerCase() === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'.toLowerCase()) {
            token0Price = ethPrice;
          } else {
            let erc20Contract = new web3.eth.Contract(ERC20ABI, token0);
            let decimalsToken0 = 18;
            if (token0 !== '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2') {
              decimalsToken0 = parseInt(await erc20Contract.methods.decimals().call());
            } else {
              //for MKR
              decimalsToken0 = 18;
            }
            let sendAmountToken0 = (10 ** decimalsToken0).toFixed(0);
            let token0EthPrice = await keep3rContract.methods.current(token0, sendAmountToken0, '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2').call({});

            token0Price = BigNumber(token0EthPrice)
              .times(ethPrice)
              .div(10 ** decimalsToken0)
              .toNumber();
          }

          if (token1.toLowerCase() === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'.toLowerCase()) {
            token1Price = ethPrice;
          } else {
            let erc20Contract = new web3.eth.Contract(ERC20ABI, token1);
            let decimalsToken1 = 18;
            if (token1 !== '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2') {
              decimalsToken1 = parseInt(await erc20Contract.methods.decimals().call());
            } else {
              //for MKR
              decimalsToken0 = 18;
            }

            let sendAmountToken1 = (10 ** decimalsToken1).toFixed(0);
            let token1EthPrice = await keep3rContract.methods.current(token1, sendAmountToken1, '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2').call({});

            token1Price = BigNumber(token1EthPrice)
              .times(ethPrice)
              .div(10 ** decimalsToken1)
              .toNumber();
            //still need to multiply by ethPrice ???
          }

          let pricePerShare0 = BigNumber(token0Price).times(reserve0);
          let pricePerShare1 = BigNumber(token1Price).times(reserve1);

          dolar = BigNumber(BigNumber(pricePerShare0).plus(pricePerShare1)).div(totalSupply).toNumber();
        }
      } else {
        //don't know?
        return 0;
      }

      return dolar;
    } catch (ex) {
      // console.log(ex)
      if (ex.message?.includes('stale prices')) {
        return 'Stale price';
      }
      return 0;
    }
  };

  _getAssets = async (web3) => {
    // return this.getStore("rawCDPAssets");

    const cdpRegistryContract = new web3.eth.Contract(COLLATERALREGISTRYABI, COLLATERAL_REGISTRY_ADDRESS);
    const collaterals = await cdpRegistryContract.methods.collaterals().call();

    let collateralArr = collaterals.map((c) => {
      return {
        address: c,
      };
    });

    return collateralArr;
  };

  getCDPBalances = async (payload) => {
    const cdpAssets = this.getStore('cdpAssets');
    if (!cdpAssets) {
      return null;
    }

    const account = stores.accountStore.getStore('account');

    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      return null;
    }
  };

  approveCDP = async (payload) => {
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

    const { asset, amount, gasSpeed } = payload.content;

    this._callApproveCDP(web3, asset, account, amount, gasSpeed, (err, approveResult) => {
      if (err) {
        return this.emitter.emit(ERROR, err);
      }

      return this.emitter.emit(APPROVE_CDP_RETURNED, approveResult);
    });
  };

  _callApproveCDP = async (web3, asset, account, amount, gasSpeed, callback) => {
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

    this._callContract(web3, tokenContract, 'approve', [CDP_VAULT_ADDRESS, amountToSend], account, gasPrice, CONFIGURE_CDP, callback);
  };

  depositCDP = async (payload) => {
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

    const { cdp, depositAmount, borrowAmount, gasSpeed } = payload.content;

    // all others for now
    if (BigNumber(depositAmount).gt(0) && (!borrowAmount || borrowAmount === '' || BigNumber(borrowAmount).eq(0))) {
      this._callDepositCDP(web3, cdp, account, depositAmount, borrowAmount, gasSpeed, (err, depositResult) => {
        if (err) {
          return this.emitter.emit(ERROR, err);
        }

        return this.emitter.emit(DEPOSIT_BORROW_CDP_RETURNED, depositResult);
      });
    } else {
      this._callDepositAndBorrowCDP(web3, cdp, account, depositAmount, borrowAmount, gasSpeed, (err, depositResult) => {
        if (err) {
          return this.emitter.emit(ERROR, err);
        }

        return this.emitter.emit(DEPOSIT_BORROW_CDP_RETURNED, depositResult);
      });
    }
  };

  _callDepositCDP = async (web3, asset, account, depositAmount, borrowAmount, gasSpeed, callback) => {
    try {
      let cdpContract = new web3.eth.Contract(VAULTMANAGERSTANDARDABI, VAULT_MANAGER_STANDARD);

      const depositAmountToSend = BigNumber(depositAmount === '' ? 0 : depositAmount)
        .times(10 ** 18)
        .toFixed(0);
      const gasPrice = await stores.accountStore.getGasPrice(gasSpeed);

      this._callContract(web3, cdpContract, 'deposit', [asset.tokenMetadata.address, depositAmountToSend], account, gasPrice, CONFIGURE_CDP, callback);
    } catch (ex) {
      console.log(ex);
      return this.emitter.emit(ERROR, ex);
    }
  };

  _callDepositAndBorrowCDP = async (web3, asset, account, depositAmount, borrowAmount, gasSpeed, callback) => {
    try {
      const depositAmountToSend = BigNumber(depositAmount === '' ? 0 : depositAmount)
        .times(bnDec(asset.tokenMetadata.decimals))
        .toFixed(0);
      const borrowAmountToSend = BigNumber(borrowAmount === '' ? 0 : borrowAmount)
        .times(10 ** 18)
        .toFixed(0);
      const gasPrice = await stores.accountStore.getGasPrice(gasSpeed);

      let cdpContract = null;
      let params = null;

      if (this.isKeydonixOracle(asset.defaultOracleType)) {
        return;
      } else if (this.isKeep3rOracle(asset.defaultOracleType)) {
        cdpContract = new web3.eth.Contract(VAULTMANAGERKEEP3RABI, VAULT_MANAGER_KEEP3R_ASSET);
        params = [asset.tokenMetadata.address, depositAmountToSend, '0', borrowAmountToSend];
      } else if (this.isKeep3rSushiSwapOracle(asset.defaultOracleType)) {
        cdpContract = new web3.eth.Contract(VAULTMANAGERKEEP3RSUSHIABI, VAULT_MANAGER_KEEP3R_SUSHI_ASSET);
        params = [asset.tokenMetadata.address, depositAmountToSend, borrowAmountToSend];
      }

      if (BigNumber(asset.debt).gt(0)) {
        this._callContract(web3, cdpContract, 'depositAndBorrow', params, account, gasPrice, CONFIGURE_CDP, callback);
      } else {
        this._callContract(web3, cdpContract, 'spawn', params, account, gasPrice, CONFIGURE_CDP, callback);
      }
    } catch (ex) {
      console.log(ex);
      return this.emitter.emit(ERROR, ex);
    }
  };

  withdrawCDP = async (payload) => {
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

    const { cdp, repayAmount, withdrawAmount, gasSpeed } = payload.content;

    if (BigNumber(repayAmount).eq(cdp.debt) || ((!repayAmount || repayAmount === '' || BigNumber(repayAmount).eq(0)) && BigNumber(cdp.debt).eq(0))) {
      this._callRepayAllAndWithdrawCDP(web3, cdp, account, repayAmount, withdrawAmount, gasSpeed, (err, depositResult) => {
        if (err) {
          return this.emitter.emit(ERROR, err);
        }

        return this.emitter.emit(WITHDRAW_REPAY_CDP_RETURNED, depositResult);
      });
    } else if (BigNumber(repayAmount).gt(0) && (!withdrawAmount || withdrawAmount === '' || BigNumber(withdrawAmount).eq(0))) {
      this._callRepayCDP(web3, cdp, account, repayAmount, withdrawAmount, gasSpeed, (err, depositResult) => {
        if (err) {
          return this.emitter.emit(ERROR, err);
        }

        return this.emitter.emit(WITHDRAW_REPAY_CDP_RETURNED, depositResult);
      });
    } else {
      this._callWithdrawCDP(web3, cdp, account, repayAmount, withdrawAmount, gasSpeed, (err, depositResult) => {
        if (err) {
          return this.emitter.emit(ERROR, err);
        }

        return this.emitter.emit(WITHDRAW_REPAY_CDP_RETURNED, depositResult);
      });
    }
  };

  _callRepayAllAndWithdrawCDP = async (web3, asset, account, repayAmount, withdrawAmount, gasSpeed, callback) => {
    try {
      let cdpContract = new web3.eth.Contract(VAULTMANAGERSTANDARDABI, VAULT_MANAGER_STANDARD);

      const withdrawAmountToSend = BigNumber(withdrawAmount === '' ? 0 : withdrawAmount)
        .times(bnDec(asset.tokenMetadata.decimals))
        .toFixed(0);
      const gasPrice = await stores.accountStore.getGasPrice(gasSpeed);

      this._callContract(
        web3,
        cdpContract,
        'repayAllAndWithdraw',
        [asset.tokenMetadata.address, withdrawAmountToSend],
        account,
        gasPrice,
        CONFIGURE_CDP,
        callback,
      );
    } catch (ex) {
      console.log(ex);
      return this.emitter.emit(ERROR, ex);
    }
  };

  _callRepayCDP = async (web3, asset, account, repayAmount, withdrawAmount, gasSpeed, callback) => {
    try {
      let cdpContract = new web3.eth.Contract(VAULTMANAGERSTANDARDABI, VAULT_MANAGER_STANDARD);

      const repayAmountToSend = BigNumber(repayAmount === '' ? 0 : repayAmount)
        .times(10 ** 18)
        .toFixed(0);
      const gasPrice = await stores.accountStore.getGasPrice(gasSpeed);

      this._callContract(web3, cdpContract, 'repay', [asset.tokenMetadata.address, repayAmountToSend], account, gasPrice, CONFIGURE_CDP, callback);
    } catch (ex) {
      console.log(ex);
      return this.emitter.emit(ERROR, ex);
    }
  };

  _callWithdrawCDP = async (web3, asset, account, repayAmount, withdrawAmount, gasSpeed, callback) => {
    try {
      const repayAmountToSend = BigNumber(repayAmount === '' ? 0 : repayAmount)
        .times(10 ** 18)
        .toFixed(0);
      const withdrawAmountToSend = BigNumber(withdrawAmount === '' ? 0 : withdrawAmount)
        .times(bnDec(asset.tokenMetadata.decimals))
        .toFixed(0);
      const gasPrice = await stores.accountStore.getGasPrice(gasSpeed);

      let cdpContract = null;
      let params = null;

      if (this.isKeydonixOracle(asset.defaultOracleType)) {
        return;
      } else if (this.isKeep3rOracle(asset.defaultOracleType)) {
        cdpContract = new web3.eth.Contract(VAULTMANAGERKEEP3RABI, VAULT_MANAGER_KEEP3R_ASSET);
        params = [asset.tokenMetadata.address, withdrawAmountToSend, '0', repayAmountToSend];
      } else if (this.isKeep3rSushiSwapOracle(asset.defaultOracleType)) {
        cdpContract = new web3.eth.Contract(VAULTMANAGERKEEP3RSUSHIABI, VAULT_MANAGER_KEEP3R_SUSHI_ASSET);
        params = [asset.tokenMetadata.address, withdrawAmountToSend, repayAmountToSend];
      }

      this._callContract(web3, cdpContract, 'withdrawAndRepay', params, account, gasPrice, CONFIGURE_CDP, callback);
    } catch (ex) {
      console.log(ex);
      return this.emitter.emit(ERROR, ex);
    }
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
        if (dispatchEvent && confirmationNumber === 0) {
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
