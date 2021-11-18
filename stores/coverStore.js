import async from "async";
import {
  MAX_UINT256,
  COVER_API,
  ERROR,
  TX_SUBMITTED,
  STORE_UPDATED,
  COVER_UPDATED,
  CONFIGURE_COVER,
  COVER_CONFIGURED,
  GET_COVER_BALANCES,
  COVER_BALANCES_RETURNED,
  APPROVE_COVER,
  APPROVE_COVER_RETURNED,
  BUY_COVER,
  BUY_COVER_RETURNED,
  SELL_COVER,
  SELL_COVER_RETURNED
} from "./constants";

import * as moment from "moment";

import stores from "./";

import { ERC20ABI, BALANCERPROXYABI } from "./abis";
import { bnDec } from "../utils";

import BatchCall from "web3-batch-call";
import BigNumber from "bignumber.js";
const fetch = require("node-fetch");

const CoinGecko = require("coingecko-api");
const CoinGeckoClient = new CoinGecko();

class Store {
  constructor(dispatcher, emitter) {
    this.dispatcher = dispatcher;
    this.emitter = emitter;

    this.store = {
      coverCollateral: [],
      coverAssets: [],
      coverProtocols: []
    };

    dispatcher.register(
      function(payload) {
        switch (payload.type) {
          case CONFIGURE_COVER:
            this.configure(payload);
            break;
          case BUY_COVER:
            this.buyCover(payload);
            break;
          case SELL_COVER:
            this.sellCover(payload);
            break;
          case APPROVE_COVER:
            this.approveCover(payload);
            break;
          case GET_COVER_BALANCES:
            this.getCoverBalances(payload);
            break;
          default: {
          }
        }
      }.bind(this)
    );
  }

  getStore = index => {
    return this.store[index];
  };

  setStore = obj => {
    this.store = { ...this.store, ...obj };
    // console.log(this.store);
    return this.emitter.emit(STORE_UPDATED);
  };

  getCoverProtocol = address => {
    const coverProtocol = this.store.coverProtocols.filter(c => {
      return c.protocolAddress === address;
    });

    if (coverProtocol && coverProtocol.length > 0) {
      return coverProtocol[0];
    } else {
      return null;
    }
  };

  setCoverProtocol = (address, newCoverProtocol) => {
    const coverProtocol = this.store.coverProtocols.map(c => {
      if (c.protocolAddress === address) {
        c = newCoverProtocol;
      }
      return c;
    });
  };

  configure = async payload => {
    try {
      const url = COVER_API;

      const coverApiResult = await fetch(url);
      const protocolsJSON = await coverApiResult.json();

      const poolDataArr = Object.entries(protocolsJSON.poolData);
      const shieldMiningPoolData = protocolsJSON.shieldMiningData.poolData;

      async.map(
        protocolsJSON.protocols,
        (protocol, callback) => {
          const protocolActive = protocol.protocolActive;
          const protocolAddress = protocol.protocolAddress;
          const protocolTokenAddress = protocol.protocolTokenAddress;
          const protocolDisplayName = protocol.protocolDisplayName;
          const protocolUrl = protocol.protocolUrl;

          const name = protocol.protocolName;
          const expires = protocol.expirationTimestamps;
          const daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

          var now = moment();

          const filteredCoverObjects = protocol.coverObjects.filter(
            (obj, index) => {
              return moment(expires[index] * 1000) > now;
            }
          );

          async.map(
            filteredCoverObjects,
            (coverObject, callbackInner) => {
              const claimAddress = coverObject.tokens.claimAddress;
              const noClaimAddress = coverObject.tokens.noClaimAddress;
              const collateralAddress = coverObject.collateralAddress;
              const coverAddress = coverObject.coverAddress;

              // GET CLIAM DATA
              let claimPoolData = poolDataArr
                .filter(data => {
                  const token0Address = data[1].poolId.tokens[0].address.toLowerCase();
                  const token1Address = data[1].poolId.tokens[1].address.toLowerCase();
                  if (
                    token0Address === claimAddress.toLowerCase() &&
                    token1Address === daiAddress.toLowerCase()
                  ) {
                    return true;
                  }
                  if (
                    token1Address === claimAddress.toLowerCase() &&
                    token0Address === daiAddress.toLowerCase()
                  ) {
                    return true;
                  }

                  return false;
                })
                .map(data => {
                  return {
                    address: data[1].poolId.id,
                    price: data[1].price,
                    symbol: data[1].symbol,
                    swapFee: BigNumber(data[1].poolId.swapFee).toNumber(),
                    liquidity: data[1].poolId.liquidity,
                    daiInPool: BigNumber(
                      data[1].poolId.tokens.find(
                        token =>
                          token.address.toLowerCase() ===
                          daiAddress.toLowerCase()
                      ).balance
                    ).toNumber(),
                    covTokenBalance: BigNumber(
                      data[1].poolId.tokens.find(
                        token =>
                          token.address.toLowerCase() ===
                          claimAddress.toLowerCase()
                      ).balance
                    ).toNumber(),
                    covTokenWeight: BigNumber(
                      data[1].poolId.tokens.find(
                        token =>
                          token.address.toLowerCase() ===
                          claimAddress.toLowerCase()
                      ).denormWeight
                    )
                      .div(data[1].poolId.totalWeight)
                      .toNumber()
                  };
                });

              if (claimPoolData.length > 0) {
                claimPoolData = claimPoolData.sort((a, b) => {
                  return b.liquidity !== null
                    ? BigNumber(b.liquidity).minus(a.liquidity)
                    : -9999999999;
                })[0];
              } else {
                claimPoolData = {
                  price: 0,
                  symbol: "N/A",
                  swapFee: 0,
                  liquidity: 0
                };
              }

              //GET NOCLAIM DATA
              let noClaimPoolData = poolDataArr
                .filter(data => {
                  if (
                    data[1].poolId.tokens[0].address.toLowerCase() ===
                      noClaimAddress.toLowerCase() &&
                    data[1].poolId.tokens[1].address.toLowerCase() ===
                      daiAddress.toLowerCase()
                  ) {
                    return true;
                  }
                  if (
                    data[1].poolId.tokens[1].address.toLowerCase() ===
                      noClaimAddress.toLowerCase() &&
                    data[1].poolId.tokens[0].address.toLowerCase() ===
                      daiAddress.toLowerCase()
                  ) {
                    return true;
                  }

                  return false;
                })
                .map(data => {
                  return {
                    address: data[1].poolId.id,
                    price: data[1].price,
                    symbol: data[1].symbol,
                    swapFee: BigNumber(data[1].poolId.swapFee).toNumber(),
                    liquidity: data[1].poolId.liquidity,
                    daiInPool: BigNumber(
                      data[1].poolId.tokens.find(
                        token =>
                          token.address.toLowerCase() ===
                          daiAddress.toLowerCase()
                      ).balance
                    ).toNumber(),
                    covTokenBalance: BigNumber(
                      data[1].poolId.tokens.find(
                        token =>
                          token.address.toLowerCase() ===
                          noClaimAddress.toLowerCase()
                      ).balance
                    ).toNumber(),
                    covTokenWeight: BigNumber(
                      data[1].poolId.tokens.find(
                        token =>
                          token.address.toLowerCase() ===
                          noClaimAddress.toLowerCase()
                      ).denormWeight
                    )
                      .div(data[1].poolId.totalWeight)
                      .toNumber()
                  };
                });

              if (noClaimPoolData.length > 0) {
                noClaimPoolData = noClaimPoolData.sort((a, b) => {
                  return b.liquidity !== null
                    ? BigNumber(b.liquidity).minus(a.liquidity)
                    : -9999999999;
                })[0];
              } else {
                noClaimPoolData = {
                  price: 0,
                  symbol: "N/A",
                  swapFee: 0,
                  liquidity: 0
                };
              }

              let noClaimShieldData = shieldMiningPoolData.filter(data => {
                return (
                  data.tokensList
                    .map(a => {
                      return a.toLowerCase();
                    })
                    .includes(noClaimAddress.toLowerCase()) &&
                  data.tokensList
                    .map(a => {
                      return a.toLowerCase();
                    })
                    .includes(daiAddress.toLowerCase())
                );
              });

              if (noClaimShieldData.length > 0) {
                noClaimShieldData = noClaimShieldData.sort((a, b) => {
                  return BigNumber(b.liquidity).minus(a.liquidity);
                })[0];
              } else {
                noClaimShieldData = {
                  id: null
                };
              }

              let claimShieldData = shieldMiningPoolData.filter(data => {
                return (
                  data.tokensList
                    .map(a => {
                      return a.toLowerCase();
                    })
                    .includes(claimAddress.toLowerCase()) &&
                  data.tokensList
                    .map(a => {
                      return a.toLowerCase();
                    })
                    .includes(daiAddress.toLowerCase())
                );
              });

              if (claimShieldData.length > 0) {
                claimShieldData = claimShieldData.sort((a, b) => {
                  return BigNumber(b.liquidity).minus(a.liquidity);
                })[0];
              } else {
                claimShieldData = {
                  id: null
                };
              }

              if (claimShieldData.id) {
                claimPoolData.address = claimShieldData.id;
              }
              if (noClaimShieldData.id) {
                noClaimPoolData.address = noClaimShieldData.id;
              }

              callbackInner(null, {
                claimAddress,
                noClaimAddress,
                collateralAddress,
                coverAddress,
                purchaseCurrency: daiAddress,
                claimPoolData: claimPoolData,
                noClaimPoolData: noClaimPoolData
              });
            },
            (err, poolData) => {
              if (err) {
                console.log(err);
              }

              callback(null, {
                protocolActive,
                protocolAddress,
                protocolTokenAddress,
                protocolUrl,
                protocolDisplayName,
                name,
                expires,
                poolData
              });
            }
          );
        },
        (err, coverProtocols) => {
          if (err) {
            console.log(err);
          }

          this.setStore({ coverProtocols: coverProtocols });

          this.emitter.emit(COVER_UPDATED);
          this.emitter.emit(COVER_CONFIGURED);

          if (payload.content.connected) {
            this.dispatcher.dispatch({ type: GET_COVER_BALANCES });
          }
        }
      );
    } catch (e) {
      console.log(e);
      this.emitter.emit(ERROR, e);
    }
  };

  getCoverBalances = async payload => {
    const coverProtocols = this.getStore("coverProtocols");
    if (!coverProtocols) {
      return null;
    }

    const account = stores.accountStore.getStore("account");
    if (!account || !account.address) {
      return false;
    }

    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      return null;
    }

    async.map(
      coverProtocols,
      async (protocol, callback) => {
        async.map(
          protocol.poolData,
          async (poolData, callbackInner) => {
            const claimAsset = await this._getInfo(
              web3,
              account,
              poolData.claimAddress,
              poolData.claimPoolData.address
            );
            const noClaimAsset = await this._getInfo(
              web3,
              account,
              poolData.noClaimAddress,
              poolData.claimPoolData.address
            );
            const collateralAsset = await this._getInfo(
              web3,
              account,
              poolData.collateralAddress,
              poolData.claimPoolData.address
            );

            poolData.claimAsset = claimAsset;
            poolData.noClaimAsset = noClaimAsset;
            poolData.collateralAsset = collateralAsset;

            if (callbackInner) {
              callbackInner(null, poolData);
            } else {
              return poolData;
            }
          },
          (err, populatedPoolData) => {
            if (err) {
              callback(err);
            }

            protocol.poolData = populatedPoolData;

            if (callback) {
              callback(null, protocol);
            } else {
              return protocol;
            }
          }
        );
      },
      (err, populatedCoverProtocols) => {
        if (err) {
          return this.emitter.emit(ERROR);
        }

        this.setStore({
          coverProtocols: populatedCoverProtocols
        });

        this.emitter.emit(COVER_CONFIGURED);
        this.emitter.emit(COVER_UPDATED);
        return this.emitter.emit(COVER_BALANCES_RETURNED);
      }
    );
  };

  _getClaimAssetInfo = async (web3, account, assets, poolAddress) => {
    const promises = assets.map(asset => {
      return new Promise((resolve, reject) => {
        const assetInfo = this._getInfo(web3, account, asset, poolAddress);
        resolve(assetInfo);
      });
    });

    const result = await Promise.all(promises);

    return result;
  };

  _getInfo = async (web3, account, asset, spender) => {
    const erc20Contract = new web3.eth.Contract(ERC20ABI, asset);

    try {
      const decimals = parseInt(await erc20Contract.methods.decimals().call());
      const symbol = await erc20Contract.methods.symbol().call();
      let balance = await erc20Contract.methods
        .balanceOf(account.address)
        .call();
      balance = BigNumber(balance)
        .div(bnDec(decimals))
        .toFixed(decimals);

      let allowance = await erc20Contract.methods
        .allowance(account.address, spender)
        .call();
      allowance = BigNumber(allowance)
        .div(bnDec(decimals))
        .toFixed(decimals);

      return {
        address: asset,
        decimals: decimals,
        symbol: symbol,
        balance: balance,
        allowance: allowance,
        icon:
          symbol === "DAI"
            ? `https://raw.githubusercontent.com/yearn/yearn-assets/master/icons/multichain-tokens/1/${asset}/logo-128.png`
            : "/tokens/cover-logo.png"
      };
    } catch (ex) {
      console.log(ex);
      return {
        balance: 0,
        decimals: 0
      };
    }
  };

  buyCover = async payload => {
    const account = stores.accountStore.getStore("account");
    if (!account) {
      return false;
      //maybe throw an error
    }

    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      return false;
      //maybe throw an error
    }

    const {
      asset,
      collateral,
      amount,
      amountOut,
      pool,
      gasSpeed
    } = payload.content;

    this._callSwapExactAmountIn(
      web3,
      collateral,
      asset,
      amount,
      amountOut,
      account,
      pool,
      gasSpeed,
      (err, res) => {
        if (err) {
          return this.emitter.emit(ERROR, err);
        }

        return this.emitter.emit(BUY_COVER_RETURNED, res);
      }
    );
  };

  _callSwapExactAmountIn = async (
    web3,
    assetIn,
    assetOut,
    amountIn,
    amountOut,
    account,
    pool,
    gasSpeed,
    callback
  ) => {
    let balancerContract = new web3.eth.Contract(
      BALANCERPROXYABI,
      pool.claimPoolData.address
    );

    const amountToSend = new BigNumber(amountIn)
      .times(bnDec(assetIn.decimals))
      .toFixed(0);
    const tokenAmountOut = new BigNumber(amountOut)
      .times(95 / 100)
      .times(bnDec(assetOut.decimals))
      .toFixed(0);

    const gasPrice = await stores.accountStore.getGasPrice(gasSpeed);

    this._callContract(
      web3,
      balancerContract,
      "swapExactAmountIn",
      [
        assetIn.address,
        amountToSend,
        assetOut.address,
        tokenAmountOut,
        MAX_UINT256
      ],
      account,
      gasPrice,
      GET_COVER_BALANCES,
      callback
    );
  };

  sellCover = async payload => {
    const account = stores.accountStore.getStore("account");
    if (!account) {
      return false;
      //maybe throw an error
    }

    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      return false;
      //maybe throw an error
    }

    const {
      asset,
      collateral,
      amount,
      amountOut,
      pool,
      gasSpeed
    } = payload.content;

    this._callSwapExactAmountIn(
      web3,
      asset,
      collateral,
      amount,
      amountOut,
      account,
      pool,
      gasSpeed,
      (err, res) => {
        if (err) {
          return this.emitter.emit(ERROR, err);
        }

        return this.emitter.emit(SELL_COVER_RETURNED, res);
      }
    );
  };

  _callContract = (
    web3,
    contract,
    method,
    params,
    account,
    gasPrice,
    dispatchEvent,
    callback
  ) => {
    //todo: rewrite the callback unfctionality.

    const context = this;
    contract.methods[method](...params)
      .send({
        from: account.address,
        gasPrice: web3.utils.toWei(gasPrice, "gwei")
      })
      .on("transactionHash", function(hash) {
        context.emitter.emit(TX_SUBMITTED, hash);
        callback(null, hash);
      })
      .on("confirmation", function(confirmationNumber, receipt) {
        if (dispatchEvent && confirmationNumber === 1) {
          context.dispatcher.dispatch({ type: dispatchEvent });
        }
      })
      .on("error", function(error) {
        if (!error.toString().includes("-32601")) {
          if (error.message) {
            return callback(error.message);
          }
          callback(error);
        }
      })
      .catch(error => {
        if (!error.toString().includes("-32601")) {
          if (error.message) {
            return callback(error.message);
          }
          callback(error);
        }
      });
  };

  approveCover = async payload => {
    const account = stores.accountStore.getStore("account");
    if (!account) {
      return false;
      //maybe throw an error
    }

    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      return false;
      //maybe throw an error
    }

    const { poolAddress, asset, amount, gasSpeed } = payload.content;

    this._callApproveCover(
      web3,
      poolAddress,
      asset,
      amount,
      gasSpeed,
      account,
      (err, approveResult) => {
        if (err) {
          return this.emitter.emit(ERROR, err);
        }

        return this.emitter.emit(APPROVE_COVER_RETURNED, approveResult);
      }
    );
  };

  _callApproveCover = async (
    web3,
    poolAddress,
    asset,
    amount,
    gasSpeed,
    account,
    callback
  ) => {
    const tokenContract = new web3.eth.Contract(ERC20ABI, asset.address);

    let amountToSend = "0";
    if (amount === "max") {
      amountToSend = MAX_UINT256;
    } else {
      amountToSend = BigNumber(amount)
        .times(10 ** asset.decimals)
        .toFixed(0);
    }

    const gasPrice = await stores.accountStore.getGasPrice(gasSpeed);

    this._callContract(
      web3,
      tokenContract,
      "approve",
      [poolAddress, amountToSend],
      account,
      gasPrice,
      GET_COVER_BALANCES,
      callback
    );
  };
}

export default Store;
