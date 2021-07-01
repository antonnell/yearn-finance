import async from 'async';
import qs from 'query-string';
import {
  MAX_UINT256,
  YEARN_API,
  YEARN_VAULTS_API,
  ERROR,
  TX_SUBMITTED,
  STORE_UPDATED,
  VAULTS_UPDATED,
  CONFIGURE_VAULTS,
  VAULTS_CONFIGURED,
  GET_VAULT_BALANCES,
  VAULT_BALANCES_RETURNED,
  GET_VAULT_PERFORMANCE,
  VAULT_PERFORMANCE_RETURNED,
  DEPOSIT_VAULT,
  DEPOSIT_VAULT_ZAPPER,
  DEPOSIT_VAULT_RETURNED,
  WITHDRAW_VAULT,
  WITHDRAW_VAULT_ZAPPER,
  WITHDRAW_VAULT_RETURNED,
  APPROVE_VAULT,
  APPROVE_VAULT_RETURNED,
  GET_VAULT_TRANSACTIONS,
  VAULT_TRANSACTIONS_RETURNED,
  CLAIM_VAULT,
  CLAIM_VAULT_RETURNED,
  ZAPPER_API_URL,
  ZAPPER_API_KEY,
  ZAPPER_SLIPPAGE_PERCENTAGE,
  UPDATE_DEPOSIT_STATUS,
  UPDATE_WITHDRAWAL_STATUS,
} from './constants';

import stores from './';
import earnJSON from './configurations/earn';
import lockupJSON from './configurations/lockup';

import {
  ERC20ABI,
  VAULTV1ABI,
  VAULTV2ABI,
  EARNABI,
  LOCKUPABI,
  VOTINGESCROWABI,
  IEARN_TOKENABI,
  CURVE_POOLCONTRACTABI,
  COMP_TOKENABI,
} from './abis';
import { bnDec } from '../utils';

import BatchCall from 'web3-batch-call';
import BigNumber from 'bignumber.js';
const fetch = require('node-fetch');

class Store {
  constructor(dispatcher, emitter) {
    this.dispatcher = dispatcher;
    this.emitter = emitter;

    this.store = {
      portfolioBalanceUSD: null,
      portfolioGrowth: null,
      highestHoldings: null,
      vaults: [],
      tvlInfo: null,
      earn: earnJSON, //These values don't really ever change anymore, but still, should get them dynamically. For now, this will save on some calls for alchemy. (symbols, decimals, underlying tokens, their symbols and decimals etc)
      lockup: lockupJSON, // same
    };

    dispatcher.register(
      function (payload) {
        switch (payload.type) {
          case CONFIGURE_VAULTS:
            this.configure(payload);
            break;
          case GET_VAULT_BALANCES:
            this.getVaultBalances(payload);
            break;
          case GET_VAULT_PERFORMANCE:
            this.getVaultPerformance(payload);
            break;
          case DEPOSIT_VAULT:
            this.depositVault(payload);
            break;
          case DEPOSIT_VAULT_ZAPPER:
            this.depositVaultZapper(payload);
            break;
          case WITHDRAW_VAULT:
            this.withdrawVault(payload);
            break;
          case WITHDRAW_VAULT_ZAPPER:
            this.withdrawVaultZapper(payload);
            break;
          case APPROVE_VAULT:
            this.approveVault(payload);
            break;
          case GET_VAULT_TRANSACTIONS:
            this.getVaultTransactions(payload);
            break;
          case CLAIM_VAULT:
            this.claimVault(payload);
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

  getVault = (address) => {
    const vault = this.store.vaults.filter((v) => {
      return v.address === address;
    });

    if (vault && vault.length > 0) {
      return vault[0];
    } else {
      return null;
    }
  };

  setVault = (address, newVault) => {
    const vaults = this.store.vaults.map((v) => {
      if (v.address === address) {
        v = newVault;
      }
      return v;
    });
  };

  configure = async (payload) => {
    try {
      const url = `${YEARN_VAULTS_API}`;

      const vaultsApiResult = await fetch(url);
      const vaults = await vaultsApiResult.json();

      //hack
      const earn = this.getStore('earn');
      // for earn vaults, we need to calcualte the APY manually
      const earnWithAPY = await this.getEarnAPYs(earn);
      // const lockup = this.getStore('lockup')

      let mappedVaults = vaults
        .filter((vault) => {
          return vault.endorsed === true;
        })
        .filter((vault) => {
          return vault.type !== 'zap';
        })
        .filter((vault) => {
          return vault.address != '0xbD17B1ce622d73bD438b9E658acA5996dc394b0d' // excluding sushiswap LP pair vault. Doesn't work for now
        })
        .map((vault) => {
          if (vault.address === '0xc5bDdf9843308380375a611c18B50Fb9341f502A') {
            vault.type = 'Lockup';
          }
          vault.tokenMetadata = vault.token;

          if(!vault.tokenMetadata.displayName) {
            vault.tokenMetadata.displayName = vault.tokenMetadata.display_name
          }

          if(!vault.displayName) {
            vault.displayName = vault.display_name
          }

          return vault;
        });

      //, ...lockup

      this.setStore({ vaults: [...mappedVaults, ...earnWithAPY] });

      this.emitter.emit(VAULTS_UPDATED);
      this.emitter.emit(VAULTS_CONFIGURED);
      this.dispatcher.dispatch({ type: GET_VAULT_BALANCES });
    } catch (ex) {
      console.log(ex);
    }
  };

  getEarnAPYs = async (earn) => {
    try {
      const web3 = await stores.accountStore.getWeb3Provider();

      const provider = process.env.NEXT_PUBLIC_PROVIDER;
      const etherscanApiKey = process.env.NEXT_PUBLIC_ETHERSCAN_KEY;

      const options = {
        provider,
        etherscan: {
          apiKey: etherscanApiKey, // Only required if not providing abi in contract request configuration
          delayTime: 300, // delay time between etherscan ABI reqests. default is 300 ms
        },
      };

      let callOptions = {
        blockHeight: 272 * 24 * 30 + 1,
        blockResolution: 272 * 24 * 30,
      };

      const contracts = [
        {
          namespace: 'earn',
          abi: EARNABI,
          addresses: earn.map((e) => {
            return e.address;
          }),
          allReadMethods: false,
          groupByNamespace: false,
          logging: false,
          readMethods: [
            {
              name: 'getPricePerFullShare',
              args: [],
            },
          ],
        },
      ];

      const batchCall = new BatchCall(options);
      const result = await batchCall.execute(contracts, callOptions);

      const priceHistoric = result.map((res) => {
        return {
          address: res.address,
          priceLastMonth: res.getPricePerFullShare[0].values[0].value,
          priceNow: res.getPricePerFullShare[0].values[1].value,
          blockLastMonth: res.getPricePerFullShare[0].values[0].blockNumber,
          blockNow: res.getPricePerFullShare[0].values[1].blockNumber,
        };
      });

      for (let i = 0; i < earn.length; i++) {
        let apyObj = null;

        const historicPrice = priceHistoric.filter((pr) => {
          return pr.address === earn[i].address;
        });

        if (!historicPrice || historicPrice.length === 0) {
          apyObj = {
            net_apy: 0,
            type: 'Earn',
          };
        } else {
          const priceGrowthSinceLastMonth = historicPrice[0].priceNow - historicPrice[0].priceLastMonth;
          const priceGrowthSinceInception = historicPrice[0].priceNow - 1e18;

          const blocksSinceLastMonth = historicPrice[0].blockNow - historicPrice[0].blockLastMonth;
          const blocksSinceInception = historicPrice[0].blockNow - earn[i].created;

          const oneMonthAPY = (priceGrowthSinceLastMonth * 2389090) / 1e18 / blocksSinceLastMonth; // 2389090 = (60/13.2) * 60 * 24 * 365
          const inceptionAPY = (priceGrowthSinceInception * 2389090) / 1e18 / blocksSinceInception; // 2389090 = (60/13.2) * 60 * 24 * 365

          apyObj = {
            net_apy: oneMonthAPY,
            type: 'Earn',
          };
        }

        earn[i].apy = apyObj;
      }

      return earn;
    } catch (ex) {
      console.log(ex);
      return null;
    }
  };

  getVaultBalances = async () => {
    let vaultInfo = null;
    try {
      const url = `${YEARN_API}vaults`;

      const vaultsApiResult = await fetch(url);
      vaultInfo = await vaultsApiResult.json();
    } catch (ex) {
      console.log(ex);
      vaultInfo = [];
    }

    const vaults = this.getStore('vaults');

    const account = stores.accountStore.getStore('account');
    if (!account || !account.address) {
      const vaultPopulated = vaults.map((vault) => {
        if (!vault.strategies || vault.strategies.length === 0) {
          const theVaultInfo = vaultInfo.filter((v) => {
            return v.address === vault.address;
          });

          if (theVaultInfo && theVaultInfo.length > 0) {
            vault.strategies = [
              {
                name: theVaultInfo[0].strategyName,
                address: theVaultInfo[0].strategyAddress,
              },
            ];
          }
        }
        return vault;
      });

      this.setStore({
        vaults: vaultPopulated,
      });

      this.emitter.emit(VAULTS_UPDATED);
      return false;
    }

    const web3 = await stores.accountStore.getWeb3Provider();
    const zapperfiBalanceResults = await fetch(
      `https://api.zapper.fi/v1/protocols/yearn/balances?api_key=96e0cc51-a62e-42ca-acee-910ea7d2a241&addresses[]=${account.address}`,
    );
    const zapperfiBalance = await zapperfiBalanceResults.json();

    async.map(
      vaults,
      async (vault, callback) => {
        try {
          let abi = null;

          switch (vault.type) {
            case 'v1':
              abi = VAULTV1ABI;
              break;
            case 'v2':
              abi = VAULTV2ABI;
              break;
            case 'Earn':
              abi = EARNABI;
              break;
            case 'Lockup':
              abi = LOCKUPABI;
              break;
            default:
              abi = VAULTV2ABI;
          }

          const vaultContract = new web3.eth.Contract(abi, vault.address);
          const balanceOf = await vaultContract.methods.balanceOf(account.address).call();
          vault.balance = BigNumber(balanceOf).div(bnDec(vault.decimals)).toFixed(vault.decimals, BigNumber.ROUND_DOWN);

          try {
            // this throws execution reverted: SafeMath: division by zero for not properly finalised vaults
            let pricePerFullShare = 1;
            if (vault.type === 'Lockup') {
              vault.pricePerFullShare = 1; // GET ASSET PRICE?
            } else if (vault.type === 'v1' || vault.type === 'Earn') {
              pricePerFullShare = await vaultContract.methods.getPricePerFullShare().call();
              vault.pricePerFullShare = BigNumber(pricePerFullShare).div(bnDec(18)).toFixed(vault.tokenMetadata.decimals, BigNumber.ROUND_DOWN); // TODO: changed 18 decimals to vault decimals for v2
            } else {
              pricePerFullShare = await vaultContract.methods.pricePerShare().call();
              vault.pricePerFullShare = BigNumber(pricePerFullShare).div(bnDec(vault.decimals)).toFixed(vault.tokenMetadata.decimals, BigNumber.ROUND_DOWN); // TODO: changed 18 decimals to vault decimals for v2
            }
          } catch (ex) {
            vault.pricePerFullShare = 0;
          }

          vault.balanceInToken = BigNumber(vault.balance).times(vault.pricePerFullShare).toFixed(vault.tokenMetadata.decimals, BigNumber.ROUND_DOWN);

          const erc20Contract = new web3.eth.Contract(ERC20ABI, vault.tokenMetadata.address);
          const tokenBalanceOf = await erc20Contract.methods.balanceOf(account.address).call();
          vault.tokenMetadata.balance = BigNumber(tokenBalanceOf)
            .div(bnDec(vault.tokenMetadata.decimals))
            .toFixed(vault.tokenMetadata.decimals, BigNumber.ROUND_DOWN);

          const allowance = await erc20Contract.methods.allowance(account.address, vault.address).call();
          vault.tokenMetadata.allowance = BigNumber(allowance)
            .div(bnDec(vault.tokenMetadata.decimals))
            .toFixed(vault.tokenMetadata.decimals, BigNumber.ROUND_DOWN);

          if (BigNumber(vault.balance).gt(0)) {
            let foundZapperVault = zapperfiBalance[account.address].products[0].assets.filter((v) => {
              if(!vault.address || !v.address) {
                return false
              }
              return vault.address.toLowerCase() === v.address.toLowerCase();
            });
            if (foundZapperVault && foundZapperVault.length > 0) {
              vault.balanceUSD = foundZapperVault[0].balanceUSD;
            } else {
              // if we don't find a balance from zapper (new vault that they don't support yet for example)
              vault.balanceUSD = BigNumber(vault.balance).times(vault.pricePerFullShare).toFixed(vault.tokenMetadata.decimals, BigNumber.ROUND_DOWN);
              vault.tokenFoundInWalletButNotZapper = true;
            }
          } else {
            vault.balanceUSD = 0;
          }

          // Specific Earn info
          if (vault.type === 'Earn') {
            let price = 1; // this is not accurate for WBTC - used to get this from coingecko
            const totalSupply = await vaultContract.methods.totalSupply().call();
            vault.tvl = {
              total_assets: totalSupply,
              price: price,
              tvl: BigNumber(totalSupply)
                .times(price)
                .times(vault.pricePerFullShare)
                .div(10 ** vault.decimals)
                .toFixed(6),
            };
          }

          // Specific Lockup info
          if (vault.type === 'Lockup') {
            const votingEscrowContract = new web3.eth.Contract(VOTINGESCROWABI, '0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2');

            const totalSupply = await vaultContract.methods.totalSupply().call();
            const votingEscrowBalanceOf = await votingEscrowContract.methods.balanceOf('0xF147b8125d2ef93FB6965Db97D6746952a133934').call();

            const index = await vaultContract.methods.index().call();
            const supply_index = await vaultContract.methods.supplyIndex(account.address).call();

            vault.lockupMetadata = {
              vaultVsSolo: BigNumber(votingEscrowBalanceOf).div(totalSupply).toNumber(),
              claimable: BigNumber(index).minus(supply_index).times(vault.balance).div(bnDec(vault.decimals)).toNumber(),
            };

            vault.strategies = [
              {
                name: 'DAOFeeClaim',
                address: '0xc5bDdf9843308380375a611c18B50Fb9341f502A',
              },
            ];
          }

          // set strategies where not set
          if (!vault.strategies || vault.strategies.length === 0) {
            const theVaultInfo = vaultInfo.filter((v) => {
              return v.address === vault.address;
            });

            if (theVaultInfo && theVaultInfo.length > 0) {
              vault.strategies = [
                {
                  name: theVaultInfo[0].strategyName,
                  address: theVaultInfo[0].strategyAddress,
                },
              ];
            }
          }

          if (callback) {
            callback(null, vault);
          } else {
            return vault;
          }
        } catch (ex) {
          console.log(vault);
          console.log(ex);

          if (callback) {
            callback(null, vault);
          } else {
            return vault;
          }
        }
      },
      (err, vaultsBalanced) => {
        if (err) {
          console.log(err);
          return this.emitter.emit(ERROR, err);
        }

        const portfolioBalanceUSD = vaultsBalanced.reduce((accumulator, currentValue) => {
          let balanceUSD = currentValue.balanceUSD;
          return BigNumber(accumulator).plus(balanceUSD).toNumber();
        }, 0);

        const portfolioGrowth = vaultsBalanced.reduce((accumulator, currentValue) => {
          if (
            !currentValue.balanceUSD ||
            BigNumber(currentValue.balanceUSD).eq(0) ||
            !currentValue.apy ||
            !currentValue.apy.net_apy ||
            currentValue.apy.net_apy === 'New' ||
            BigNumber(currentValue.apy.net_apy).eq(0)
          ) {
            return accumulator;
          }

          return BigNumber(accumulator)
            .plus(
              BigNumber(currentValue.balanceUSD)
                .div(portfolioBalanceUSD)
                .times(currentValue.apy.net_apy * 100),
            )
            .toNumber();
        }, 0);

        let highestHoldings = vaultsBalanced.reduce((prev, current) => (BigNumber(prev.balanceUSD).gt(current.balanceUSD) ? prev : current));
        if (BigNumber(highestHoldings.balanceUSD).eq(0)) {
          highestHoldings = 'None';
        }

        const tvlInfo = {
          tvlUSD: vaultsBalanced.reduce((acc, current) => {
            return BigNumber(acc).plus((current.tvl && current.tvl.tvl) ? current.tvl.tvl : 0);
          }, 0),
          totalVaultHoldingsUSD: vaultsBalanced
            .filter((vault) => {
              return vault.type !== 'Earn';
            })
            .reduce((acc, current) => {
              return BigNumber(acc).plus((current.tvl && current.tvl.tvl) ? current.tvl.tvl : 0);
            }, 0),
          totalEarnHoldingsUSD: vaultsBalanced
            .filter((vault) => {
              return vault.type === 'Earn';
            })
            .reduce((acc, current) => {
              return BigNumber(acc).plus((current.tvl && current.tvl.tvl) ? current.tvl.tvl : 0);
            }, 0),
        };

        this.setStore({
          vaults: vaultsBalanced,
          portfolioBalanceUSD: portfolioBalanceUSD,
          portfolioGrowth: portfolioGrowth ? portfolioGrowth : 0,
          highestHoldings: highestHoldings,
          tvlInfo: tvlInfo,
        });

        this.emitter.emit(VAULTS_UPDATED);

        // this.calculateSystemOverview();
      },
    );
  };

  getVaultPerformance = async (payload) => {
    try {
      const { address, duration } = payload.content;

      //maybe do this on initial configuration load.

      const account = stores.accountStore.getStore('account');
      if (!account) {
        //maybe throw an error
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
      }

      const provider = process.env.NEXT_PUBLIC_PROVIDER;
      const etherscanApiKey = process.env.NEXT_PUBLIC_ETHERSCAN_KEY;

      const options = {
        provider,
        etherscan: {
          apiKey: etherscanApiKey, // Only required if not providing abi in contract request configuration
          delayTime: 300, // delay time between etherscan ABI reqests. default is 300 ms
        },
      };

      let callOptions = {};

      switch (duration) {
        case 'Week':
          callOptions = {
            blockHeight: 272 * 24 * 7, // Historical blocks to read (60 * (60/15) = 240)... Enter 240 for one hours worth of data - 272 = 13.2 seconds per block
            blockResolution: 272 * 24, // 7 data points
          };
          break;
        case 'Month':
          callOptions = {
            blockHeight: 272 * 24 * 30, // Historical blocks to read (60 * (60/15) = 240)... Enter 240 for one hours worth of data - 272 = 13.2 seconds per block
            blockResolution: 272 * 24, // 30 data points
          };
          break;
        case 'Year':
          callOptions = {
            blockHeight: 272 * 24 * 365, // Historical blocks to read (60 * (60/15) = 240)... Enter 240 for one hours worth of data - 272 = 13.2 seconds per block
            blockResolution: 272 * 24 * 18, // 20 data points
          };
          break;
        default:
          callOptions = {
            blockHeight: 272 * 24 * 30, // Historical blocks to read (60 * (60/15) = 240)... Enter 240 for one hours worth of data - 272 = 13.2 seconds per block
            blockResolution: 272 * 24, // 30 data points
          };
      }

      let contracts = {};

      if (!account || !account.address) {
        contracts = [
          {
            namespace: 'vaults',
            store: localStorage,
            addresses: [address],
            allReadMethods: true,
            groupByNamespace: false,
            logging: false,
            readMethods: [],
          },
        ];
      } else {
        contracts = [
          {
            namespace: 'vaults',
            store: localStorage,
            addresses: [address],
            allReadMethods: true,
            groupByNamespace: false,
            logging: false,
            readMethods: [
              {
                name: 'balanceOf',
                args: [account.address],
              },
            ],
          },
        ];
      }

      const batchCall = new BatchCall(options);
      const result = await batchCall.execute(contracts, callOptions);

      const vault = this.getVault(payload.content.address);

      vault.historicData = result[0];

      this.setVault({
        address: payload.content.address,
        vault: vault,
      });

      this.emitter.emit(VAULT_PERFORMANCE_RETURNED);
    } catch(ex) {
      console.log(ex)
      this.emitter.emit(VAULT_PERFORMANCE_RETURNED);
    }
  };

  depositVault = async (payload) => {
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

    const { vault, amount, gasSpeed } = payload.content;

    this._callDepositVault(web3, vault, account, amount, gasSpeed, (err, depositResult) => {
      if (err) {
        return this.emitter.emit(ERROR, err);
      }

      return this.emitter.emit(DEPOSIT_VAULT_RETURNED, depositResult);
    });
  };

  _callDepositVault = async (web3, vault, account, amount, gasSpeed, callback) => {
    let abi = null;

    switch (vault.type) {
      case 'v1':
        abi = VAULTV1ABI;
        break;
      case 'v2':
        abi = VAULTV2ABI;
        break;
      case 'Earn':
        abi = EARNABI;
        break;
      default:
        abi = 'UNKNOWN';
    }

    const vaultContract = new web3.eth.Contract(abi, vault.address);

    const amountToSend = BigNumber(amount)
      .times(10 ** vault.decimals)
      .toFixed(0);

    const gasPrice = await stores.accountStore.getGasPrice(gasSpeed);

    this._callContract(web3, vaultContract, 'deposit', [amountToSend], account, gasPrice, GET_VAULT_BALANCES, callback);
  };

  depositVaultZapper = async (payload) => {
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

    const { vault, amount, currentToken, zapperSlippage } = payload.content;
    let fullAmount = new BigNumber(amount).times(10 ** currentToken.decimals).toFixed(0);
    this._callDepositVaultZapper(web3, vault, account, fullAmount, currentToken, zapperSlippage);
  };

  _setZapperAPI = (path, search) => {
    const uri = ZAPPER_API_URL + `${path}?api_key=${ZAPPER_API_KEY}&` + qs.stringify(search);
    return uri;
  };

  _callDepositVaultZapper = async (web3, vault, account, amount, currentToken, zapperSlippage) => {
    //todo: rewrite the callback unfctionality.
    const zapperfiGasURI = this._setZapperAPI('/gas-price', {
      sellTokenAddress: currentToken.address,
      ownerAddress: account.address,
    });
    let alreadyApproved = currentToken.displayName === 'ETH' || currentToken.address === '0x0000000000000000000000000000000000000000';
    let zapperfiGas = {};
    try {
      this.emitter.emit(UPDATE_DEPOSIT_STATUS, 'Getting gas prices from zapper...');
      const response = await fetch(zapperfiGasURI);
      if (response.status === 200) {
        const zapperfiGasPrices = await response.json();

        const zapperfiGasPrice = new BigNumber(zapperfiGasPrices.fast).times(10 ** 9);
        const zapperfiApprovalURI = this._setZapperAPI('/zap-in/yearn/approval-state', {
          sellTokenAddress: currentToken.address,
          ownerAddress: account.address,
        });
        this.emitter.emit(UPDATE_DEPOSIT_STATUS, 'Checking token approval...');
        let responseApproval = { status: 200 };
        let zapperfiApproval = {};
        if (!alreadyApproved) {
          responseApproval = await fetch(zapperfiApprovalURI);
          zapperfiApproval = await responseApproval.json();
        }
        if (responseApproval.status === 200) {
          if (zapperfiApprovalURI) {
            const zapperfiApprovalTransactionURI = this._setZapperAPI('/zap-in/yearn/approval-transaction', {
              sellTokenAddress: currentToken.address,
              ownerAddress: account.address,
              gasPrice: zapperfiGasPrice,
            });
            this.emitter.emit(UPDATE_DEPOSIT_STATUS, 'Getting approval transaction...');
            let responseApprovalTransaction = { status: 200 };
            let zapperfiApprovalTransaction = {};
            if (!alreadyApproved) {
              responseApprovalTransaction = await fetch(zapperfiApprovalTransactionURI);
              zapperfiApprovalTransaction = await responseApprovalTransaction.json();
            }

            this.emitter.emit(UPDATE_DEPOSIT_STATUS, 'Waiting for your approval...');
            if (responseApprovalTransaction.status === 200) {
              alreadyApproved = (zapperfiApproval?.isApproved && zapperfiApproval.allowance > 0) || alreadyApproved;
              this._callZapperContract(web3, zapperfiApprovalTransaction, alreadyApproved, false, null, async (err, approveResult) => {
                if (err) {
                  return this.emitter.emit(ERROR, err);
                } else {
                  if (!alreadyApproved) {
                    this.emitter.emit(APPROVE_VAULT_RETURNED, approveResult);
                  }
                  let slippage = zapperSlippage;
                  if (!slippage || slippage === 0 || Number.isNaN(slippage)) {
                    slippage = ZAPPER_SLIPPAGE_PERCENTAGE;
                  }
                  const zapperfiSendTransactionURI = this._setZapperAPI('/zap-in/yearn/transaction', {
                    sellTokenAddress: currentToken.address,
                    ownerAddress: account.address,
                    gasPrice: zapperfiGasPrice,
                    slippagePercentage: slippage,
                    poolAddress: vault.address.toLowerCase(),
                    sellAmount: amount,
                  });
                  const responseSendTransaction = await fetch(zapperfiSendTransactionURI);
                  let zapperfiSendTransaction = await responseSendTransaction.json();
                  this.emitter.emit(UPDATE_DEPOSIT_STATUS, 'Getting deposit transaction...');
                  if (responseSendTransaction.status === 200) {
                    this._callZapperContract(web3, zapperfiSendTransaction, false, true, GET_VAULT_BALANCES, (err, depositResult) => {
                      if (err) {
                        return this.emitter.emit(ERROR, err);
                      } else {
                        this.emitter.emit(DEPOSIT_VAULT_RETURNED, depositResult);
                      }
                    });
                  } else {
                    if (zapperfiSendTransaction?.message) {
                      return this.emitter.emit(
                        ERROR,
                        zapperfiSendTransaction.message
                          ? zapperfiSendTransaction.message
                          : 'Sorry, we could not process your request, no funds have been touched.',
                      );
                    }
                  }
                }
              });
            } else {
              return this.emitter.emit(
                ERROR,
                zapperfiApprovalTransaction?.message
                  ? zapperfiApprovalTransaction.message
                  : 'Sorry, we could not process your request, no funds have been touched.',
              );
            }
          }
        } else {
          return this.emitter.emit(
            ERROR,
            zapperfiApproval?.message ? zapperfiApproval.message : 'Sorry, we could not process your request, no funds have been touched.',
          );
        }
      }
    } catch (error) {
      console.log({ message: `Zap Failed. ${error.message}`, poolAddress: 'poolAddress' });
      return this.emitter.emit(ERROR, error.message ? error.message : 'Sorry, we could not process your request, no funds have been touched.');
    }
  };

  _callZapperContract = async (web3, transaction, skip, returnImediately, dispatchEvent, callback) => {
    if (skip) {
      callback(null);
      return true;
    } else {
      const context = this;
      web3.eth
        .sendTransaction(transaction)
        .on('transactionHash', function (hash) {
          context.emitter.emit(TX_SUBMITTED, hash);
          if (returnImediately) {
            callback(null, hash);
          }
        })
        .on('confirmation', function (confirmationNumber, receipt) {
          if (!returnImediately && confirmationNumber === 1) {
            callback(null, receipt.transactionHash);
          }
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
    }
  };

  withdrawVaultZapper = async (payload) => {
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

    const { vault, amount, gasSpeed, currentToken, zapperSlippage } = payload.content;

    this._callWithdrawVaultZapper(web3, vault, account, amount, currentToken, zapperSlippage, (err, withdrawResult) => {
      if (err) {
        return this.emitter.emit(ERROR, err);
      }

      return this.emitter.emit(WITHDRAW_VAULT_RETURNED, withdrawResult);
    });
  };

  _callWithdrawVaultZapper = async (web3, vault, account, amount, currentToken, zapperSlippage, callback) => {
    const zapperfiGasURI = this._setZapperAPI('/gas-price', {
      sellTokenAddress: vault.address,
      ownerAddress: account.address,
    });
    let alreadyApproved = false;
    try {
      this.emitter.emit(UPDATE_DEPOSIT_STATUS, 'Getting gas prices from zapper...');
      const response = await fetch(zapperfiGasURI);
      if (response.status === 200) {
        const zapperfiGasPrices = await response.json();

        const zapperfiGasPrice = new BigNumber(zapperfiGasPrices.fast).times(10 ** 9);
        const zapperfiApprovalURI = this._setZapperAPI('/zap-out/yearn/approval-state', {
          sellTokenAddress: vault.address,
          ownerAddress: account.address,
        });
        this.emitter.emit(UPDATE_WITHDRAWAL_STATUS, 'Checking token approval...');
        let responseApproval = { status: 200 };
        let zapperfiApproval = {};
        if (!alreadyApproved) {
          responseApproval = await fetch(zapperfiApprovalURI);
          zapperfiApproval = await responseApproval.json();
        }
        if (responseApproval.status === 200) {
          if (zapperfiApprovalURI) {
            const zapperfiApprovalTransactionURI = this._setZapperAPI('/zap-out/yearn/approval-transaction', {
              sellTokenAddress: vault.address,
              ownerAddress: account.address,
              gasPrice: zapperfiGasPrice,
            });
            this.emitter.emit(UPDATE_WITHDRAWAL_STATUS, 'Getting approval transaction...');
            let responseApprovalTransaction = { status: 200 };
            let zapperfiApprovalTransaction = {};
            if (!alreadyApproved) {
              responseApprovalTransaction = await fetch(zapperfiApprovalTransactionURI);
              zapperfiApprovalTransaction = await responseApprovalTransaction.json();
            }

            this.emitter.emit(UPDATE_WITHDRAWAL_STATUS, 'Waiting for your approval...');
            if (responseApprovalTransaction.status === 200) {
              alreadyApproved = (zapperfiApproval?.isApproved && zapperfiApproval.allowance > 0) || alreadyApproved;
              this._callZapperContract(web3, zapperfiApprovalTransaction, alreadyApproved, false, null, async (err, approveResult) => {
                if (err) {
                  return this.emitter.emit(ERROR, err);
                } else {
                  if (!alreadyApproved) {
                    this.emitter.emit(WITHDRAW_VAULT_RETURNED, approveResult);
                  }
                  let slippage = zapperSlippage;
                  if (!slippage || slippage === 0 || Number.isNaN(slippage)) {
                    slippage = ZAPPER_SLIPPAGE_PERCENTAGE;
                  }
                  const sellAmount = new BigNumber(amount).times(10 ** vault.decimals).toFixed(0);
                  const zapperfiSendTransactionURI = this._setZapperAPI('/zap-out/yearn/transaction', {
                    ownerAddress: account.address,
                    gasPrice: zapperfiGasPrice,
                    slippagePercentage: slippage,
                    poolAddress: vault.address.toLowerCase(),
                    sellAmount: sellAmount,
                    toTokenAddress: currentToken.address,
                  });
                  const responseSendTransaction = await fetch(zapperfiSendTransactionURI);
                  let zapperfiSendTransaction = await responseSendTransaction.json();
                  this.emitter.emit(UPDATE_WITHDRAWAL_STATUS, 'Getting withdrawal transaction...');
                  if (responseSendTransaction.status === 200) {
                    this._callZapperContract(web3, zapperfiSendTransaction, false, true, GET_VAULT_BALANCES, (err, depositResult) => {
                      if (err) {
                        return this.emitter.emit(ERROR, err);
                      } else {
                        this.emitter.emit(WITHDRAW_VAULT_RETURNED, depositResult);
                      }
                    });
                  } else {
                    if (zapperfiSendTransaction?.message) {
                      return this.emitter.emit(
                        ERROR,
                        zapperfiSendTransaction.message
                          ? zapperfiSendTransaction.message
                          : 'Sorry, we could not process your request, no funds have been touched.',
                      );
                    }
                  }
                }
              });
            } else {
              return this.emitter.emit(
                ERROR,
                zapperfiApprovalTransaction?.message
                  ? zapperfiApprovalTransaction.message
                  : 'Sorry, we could not process your request, no funds have been touched.',
              );
            }
          }
        } else {
          return this.emitter.emit(
            ERROR,
            zapperfiApproval?.message ? zapperfiApproval.message : 'Sorry, we could not process your request, no funds have been touched.',
          );
        }
      }
    } catch (error) {
      console.log({ message: `Zap Failed. ${error.message}`, poolAddress: 'poolAddress' });
      return this.emitter.emit(ERROR, error.message ? error.message : 'Sorry, we could not process your request, no funds have been touched.');
    }
  };
  withdrawVault = async (payload) => {
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

    const { vault, amount, gasSpeed } = payload.content;

    this._callWithdrawVault(web3, vault, account, amount, gasSpeed, (err, withdrawResult) => {
      if (err) {
        return this.emitter.emit(ERROR, err);
      }

      return this.emitter.emit(WITHDRAW_VAULT_RETURNED, withdrawResult);
    });
  };

  _callWithdrawVault = async (web3, vault, account, amount, gasSpeed, callback) => {
    let abi = null;

    switch (vault.type) {
      case 'Earn':
        abi = EARNABI;
        break;
      case 'v1':
        abi = VAULTV1ABI;
        break;
      case 'v2':
        abi = VAULTV2ABI;
        break;
      default:
        abi = 'UNKNOWN';
    }

    const vaultContract = new web3.eth.Contract(abi, vault.address);

    const amountToSend = BigNumber(amount)
      .times(10 ** vault.decimals)
      .toFixed(0);

    const gasPrice = await stores.accountStore.getGasPrice(gasSpeed);

    this._callContract(web3, vaultContract, 'withdraw', [amountToSend], account, gasPrice, GET_VAULT_BALANCES, callback);
  };

  _callContract = (web3, contract, method, params, account, gasPrice, dispatchEvent, callback) => {
    //todo: rewrite the callback unfctionality.

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

  approveVault = async (payload) => {
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

    const { vault, amount, gasSpeed } = payload.content;

    this._callApproveVault(web3, vault, account, amount, gasSpeed, (err, approveResult) => {
      if (err) {
        return this.emitter.emit(ERROR, err);
      }

      return this.emitter.emit(APPROVE_VAULT_RETURNED, approveResult);
    });
  };

  _callApproveVault = async (web3, vault, account, amount, gasSpeed, callback) => {
    const tokenContract = new web3.eth.Contract(ERC20ABI, vault.tokenMetadata.address);

    let amountToSend = '0';
    if (amount === 'max') {
      amountToSend = MAX_UINT256;
    } else {
      amountToSend = BigNumber(amount)
        .times(10 ** vault.tokenMetadata.decimals)
        .toFixed(0);
    }

    const gasPrice = await stores.accountStore.getGasPrice(gasSpeed);

    this._callContract(web3, tokenContract, 'approve', [vault.address, amountToSend], account, gasPrice, GET_VAULT_BALANCES, callback);
  };

  getVaultTransactions = async (payload) => {
    const { address } = payload.content;

    const account = stores.accountStore.getStore('account');
    if (!account || !account.address) {
      //maybe throw an error
      return false;
    }


    //we are not using the transactions call anymore as it is broken. I think the core team has depricated api.yearn.tools.
    this.emitter.emit(VAULTS_UPDATED);
    this.emitter.emit(VAULT_TRANSACTIONS_RETURNED);

    return;


    try {
      const url = `${YEARN_API}user/${account.address}/vaults/transactions`;

      const vaultsApiResult = await fetch(url);
      const transactions = await vaultsApiResult.json();

      const vaults = this.getStore('vaults');

      const vaultsPopulated = vaults.map((vault) => {
        const txs = transactions.filter((tx) => {
          return tx.vaultAddress === vault.address;
        });

        if (txs && txs.length > 0) {
          const array = [];
          array.push(
            ...txs[0].deposits.map((tx) => {
              tx.description = 'Deposit into vault';
              return tx;
            }),
          );
          array.push(
            ...txs[0].withdrawals.map((tx) => {
              tx.description = 'Withdraw from vault';
              return tx;
            }),
          );
          array.push(
            ...txs[0].transfersIn.map((tx) => {
              tx.description = 'Transfer into vault';
              return tx;
            }),
          );
          array.push(
            ...txs[0].transfersOut.map((tx) => {
              tx.description = 'Transfer out of vault';
              return tx;
            }),
          );

          vault.transactions = array.sort((a, b) => {
            return a.timestamp < b.timestamp ? 1 : -1;
          });
        } else {
          vault.transactions = [];
        }

        return vault;
      });

      this.setStore({ vaults: vaultsPopulated });

      this.emitter.emit(VAULTS_UPDATED);
      this.emitter.emit(VAULT_TRANSACTIONS_RETURNED);
    } catch (ex) {
      console.log(ex);
    }
  };

  claimVault = async (payload) => {
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

    const { vault, gasSpeed } = payload.content;

    this._callClaimVault(web3, vault, account, gasSpeed, (err, result) => {
      if (err) {
        return this.emitter.emit(ERROR, err);
      }

      return this.emitter.emit(CLAIM_VAULT_RETURNED, result);
    });
  };

  _callClaimVault = async (web3, vault, account, gasSpeed, callback) => {
    const vaultContract = new web3.eth.Contract(LOCKUPABI, vault.address);

    const gasPrice = await stores.accountStore.getGasPrice(gasSpeed);

    this._callContract(web3, vaultContract, 'claim', [], account, gasPrice, GET_VAULT_BALANCES, callback);
  };


  calculateSystemOverview = async () => {
    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
    }

    const vaultData = this.getStore('vaults')

    var size = 10;
    var items = vaultData.slice(0, size).map(i => {
      return i
    })

    console.log(items)

    async.map(items, async (vault, callback) => {
      const depositToken = await this.getTokenTree(web3, vault.tokenMetadata.address)
      vault.depositToken = depositToken

      const strategiesData = await this.getVaultStrategiesData(web3, vault)
      vault.strategies = strategiesData

      if(callback) {
        callback(null, vault)
      } else {
        return vault
      }

    }, (err, vaults) => {
      if(err) {
        console.log(err)
      }
      console.log(vaults)
    })
  }

  getTokenTree = async (web3, tokenAddress) => {
    const curvePoolContract = this.mapCurveTokenToPool(tokenAddress)
    const isCompoundToken = this.mapCompAssetToUnderlying(tokenAddress)
    const isIEarnToken = this.mapIearnTokenToUnderlying(tokenAddress)

    const assetContract = new web3.eth.Contract(ERC20ABI, tokenAddress)
    const decimals = parseInt(await assetContract.methods.decimals().call())
    const symbol = await assetContract.methods.symbol().call()

    // this is a curve pool token, we need to get the underling assets
    if(curvePoolContract !== false) {
        try {
          let tokens = []
          const poolContract = new web3.eth.Contract(CURVE_POOLCONTRACTABI, curvePoolContract)
          for(let i = 0; i < 4; i++) {
            try {
              const underlyingTokenAddress = await poolContract.methods.coins(i).call()
              let underlyingToken = await this.getTokenTree(web3, underlyingTokenAddress)
              tokens.push(underlyingToken)
            } catch(ex) {
              console.log(ex)
              // there might not be 4 tokens, so this is very reasonable to expect. we just ignore it I guess
            }
          }

          return {
            address: tokenAddress,
            // balance: BigNumber(balanceOf).div(10**decimals).toFixed(decimals),
            decimals: decimals,
            symbol: symbol,
            isCompoundToken: false,
            isIEarnToken: false,
            isCurveToken: true,
            curveUnderlyingTokens: tokens
          }

        } catch(ex) {
          console.log('curvePoolContract')
          console.log(curvePoolContract)
          console.log(ex)
        }
    } else if (isCompoundToken !== false) {
      const compoundContract = new web3.eth.Contract(COMP_TOKENABI, tokenAddress)

      const underlying = await compoundContract.methods.underlying().call()
      let underlyingToken = await this.getTokenTree(web3, underlying)

      // const getCash = await compoundContract.methods.getCash().call()
      // const totalBorrows = await compoundContract.methods.totalBorrows().call()
      // const totalReserves = await compoundContract.methods.totalReserves().call()
      // const totalSupply = await compoundContract.methods.totalSupply().call()
      //
      // const exchangeRate = BigNumber(BigNumber(getCash/(10**underlyingToken.decimals)).plus(totalBorrows/(10**underlyingToken.decimals)).minus(totalReserves/(10**underlyingToken.decimals))).div(totalSupply/(10**8)).toFixed(18)
      // const balanceOf = await contract.methods.balances(index).call()
      //
      // balance = BigNumber(balanceOf).div(10**decimals).times(exchangeRate).toFixed(underlyingToken.decimals)
      // underlyingToken.balance = balance

      return {
        address: tokenAddress,
        // balance: BigNumber(balanceOf).div(10**decimals).toFixed(decimals),
        decimals: decimals,
        symbol: symbol,
        isCompoundToken: true,
        isIEarnToken: false,
        isCurveToken: false,
        compoundUnderlyingToken: underlyingToken
      }
    } else if (isIEarnToken !== false) {
      const iearnContract = new web3.eth.Contract(IEARN_TOKENABI, tokenAddress)

      const underlying = await iearnContract.methods.token().call()
      let underlyingToken = await this.getTokenTree(web3, underlying)

      // const exchangeRate = await iearnContract.methods.getPricePerFullShare().call()
      //
      // const balanceOf = await contract.methods.balances(index).call()
      // balance = BigNumber(balanceOf).div(10**decimals).times(exchangeRate/(10**18)).toFixed(underlyingToken.decimals)
      // underlyingToken.balance = balance

      return {
        address: tokenAddress,
        // balance: BigNumber(balanceOf).div(10**decimals).toFixed(decimals),
        decimals: decimals,
        symbol: symbol,
        isCompoundToken: false,
        isIEarnToken: true,
        isCurveToken: false,
        iEarnUnderlingToken: underlyingToken
      }
    } else {
      return {
        address: tokenAddress,
        // balance: BigNumber(balance).div(10**decimals).toFixed(decimals),
        decimals: decimals,
        symbol: symbol,
        isCompoundToken: false,
        isIEarnToken: false,
        isCurveToken: false
      }
    }
  }

  mapCurveTokenToPool = (address) => {
    switch (address) {
      case '0x845838DF265Dcd2c412A1Dc9e959c7d08537f8a2':
        return '0xA2B47E3D5c44877cca798226B7B8118F9BFb7A56';
      case '0x9fC689CCaDa600B6DF723D9E47D84d76664a1F23':
        return '0x52EA46506B9CC5Ef470C5bf89f17Dc28bB35D85C';
      case '0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8':
        return '0x45F783CCE6B7FF23B2ab2D70e416cdb7D6055f51';
      case '0x3B3Ac5386837Dc563660FB6a0937DFAa5924333B':
        return '0x79a8C46DeA5aDa233ABaFFD40F3A0A2B1e5A4F27';
      case '0xC25a3A3b969415c80451098fa907EC722572917F':
        return '0xA5407eAE9Ba41422680e2e00537571bcC53efBfD';
      case '0xD905e2eaeBe188fc92179b6350807D8bd91Db0D8':
        return '0x06364f10B501e868329afBc005b3492902d6C763';
      case '0x49849C98ae39Fff122806C06791Fa73784FB3675':
        return '0x93054188d876f558f4a66B2EF1d97d16eDf0895B';
      case '0x075b1bb99792c9E1041bA13afEf80C91a1e70fB3':
        return '0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714';
      case '0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490':
        return '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7';
      case '0xD2967f45c4f384DEEa880F807Be904762a3DeA07':
        return '0x4f062658EaAF2C1ccf8C8e36D6824CDf41167956';
      case '0x5B5CFE992AdAC0C9D48E05854B2d91C73a003858':
        return '0x3eF6A01A0f81D6046290f3e2A8c5b843e738E604';
      case '0x4f3E8F405CF5aFC05D68142F3783bDfE13811522':
        return '0x0f9cb53Ebe405d49A0bbdBD291A65Ff571bC83e1';
      case '0x6D65b498cb23deAba52db31c93Da9BFFb340FB8F':
        return '0xE7a24EF0C5e95Ffb0f6684b813A78F2a3AD7D171';
      case '0x1AEf73d49Dedc4b1778d0706583995958Dc862e6':
        return '0x8474DdbE98F5aA3179B3B3F5942D724aFcdec9f6';
      case '0xC2Ee6b0334C261ED60C72f6054450b61B8f18E35':
        return '0xC18cC39da8b11dA8c3541C598eE022258F9744da';
      case '0x64eda51d3Ad40D56b9dFc5554E06F94e1Dd786Fd':
        return '0xC25099792E9349C7DD09759744ea681C7de2cb66';
      case '0x3a664Ab939FD8482048609f652f9a0B0677337B9':
        return '0x8038C01A0390a8c547446a0b2c18fc9aEFEcc10c';
      case '0xDE5331AC4B3630f94853Ff322B66407e0D6331E8':
        return '0x7F55DDe206dbAD629C080068923b36fe9D6bDBeF';
      case '0x410e3E86ef427e30B9235497143881f717d93c2A':
        return '0x071c661B4DeefB59E2a3DdB20Db036821eeE8F4b';
      case '0x2fE94ea3d5d4a175184081439753DE15AeF9d614':
        return '0xd81dA8D904b52208541Bade1bD6595D8a251F8dd';
      case '0x94e131324b6054c0D789b190b2dAC504e4361b53':
        return '0x890f4e345B1dAED0367A877a1612f86A1f86985f';
      case '0x194eBd173F6cDacE046C53eACcE9B953F28411d1':
        return '0x0Ce6a5fF5217e38315f87032CF90686C96627CAA';
      case '0xA3D87FffcE63B53E0d54fAa1cc983B7eB0b74A9c':
        return '0xc5424B857f758E906013F3555Dad202e4bdB4567';
      case '0xFd2a8fA60Abd58Efe3EeE34dd494cD491dC14900':
        return '0xDeBF20617708857ebe4F679508E7b7863a8A8EeE';
      case '0x06325440D014e39736583c165C2963BA99fAf14E':
        return '0xDC24316b9AE028F1497c275EB9192a3Ea0f67022';
      case '0x02d341CcB60fAaf662bC0554d13778015d1b285C':
        return '0xEB16Ae0052ed37f479f7fe63849198Df1765a733';
      case '0xaA17A236F2bAdc98DDc0Cf999AbB47D47Fc0A6Cf':
        return '0xA96A65c051bF88B4095Ee1f2451C2A9d43F53Ae2';
      case '0x7Eb40E450b9655f4B3cC4259BCC731c63ff55ae6':
        return '0x42d7025938bEc20B69cBae5A77421082407f053A';
      case '0x5282a4eF67D9C33135340fB3289cc1711c13638C':
        return '0x2dded6Da1BF5DBdF597C45fcFaa3194e53EcfeAF';
      case '0xcee60cFa923170e4f8204AE08B4fA6A3F5656F3a':
        return '0xF178C0b5Bb7e7aBF4e12A4838C7b7c5bA2C623c0';
      case '0xEcd5e75AFb02eFa118AF914515D6521aaBd189F1':
        return '0xEcd5e75AFb02eFa118AF914515D6521aaBd189F1';
      case '0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B':
        return '0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B';
      case '0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA':
        return '0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA';
      case '0x4807862AA8b2bF68830e4C8dc86D0e9A998e085a':
        return '0x4807862AA8b2bF68830e4C8dc86D0e9A998e085a';
      case '0x53a901d48795C58f485cBB38df08FA96a24669D5':
        return '0xF9440930043eb3997fc70e1339dBb11F341de7A8';
      case '0xcA3d75aC011BF5aD07a98d02f18225F9bD9A6BDF':
        return '0x80466c64868E1ab14a1Ddf27A676C3fcBE638Fe5';
      case '0x43b4FdFD4Ff969587185cDB6f0BD875c5Fc83f8c':
        return '0x43b4FdFD4Ff969587185cDB6f0BD875c5Fc83f8c';
      case '0x5a6A4D54456819380173272A5E8E9B9904BdF41B':
        return '0x5a6A4D54456819380173272A5E8E9B9904BdF41B';
      default:
        return false;
    }
  }

  mapIearnTokenToUnderlying = (address) => {
    switch (address) {
      case '0x16de59092dAE5CcF4A1E6439D611fd0653f0Bd01':
      case '0xd6aD7a6750A7593E092a9B218d66C0A814a3436e':
      case '0x83f798e925BcD4017Eb265844FDDAbb448f1707D':
      case '0x73a052500105205d34Daf004eAb301916DA8190f':
      case '0x04bC0Ab673d88aE9dbC9DA2380cB6B79C4BCa9aE':
        return true;
      default:
        return false;
    }
  }

  mapCompAssetToUnderlying = (address) => {
    switch (address) {
      case '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643':
      case '0x39AA39c021dfbaE8faC545936693aC917d5E7563':
        return true;
      default:
        return false;
    }
  }

  getVaultStrategiesData = async (web3, vault) => {
    return null
  }
}

export default Store;
