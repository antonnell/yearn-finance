import async from 'async';
import qs from 'query-string';
import {
  MAX_UINT256,
  YEARN_API,
  YEARN_VAULTS_API,
  COINGECKO_API,
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
  SYSTEM_UPDATED,
} from './constants';

import stores from './';
import earnJSON from './configurations/earn';
import lockupJSON from './configurations/lockup';
import systemAssetsJSON from './configurations/systemAssets';
import systemJSON from './configurations/system';

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
  VAULT_StrategyLenderYieldOptimiserABI,
  VAULT_StrategyPoolABI,
  VAULT_AaveWETHLenderUSDTBorrowerABI,
  VAULT_StrategyRookDaiStablecoinABI,
  VAULT_StrategyVesperWBTCABI,
  VAULT_StrategyIdleidleRAIYieldABI,
  YEARNVAULT_0_3_3ABI,
  VECURVEVAULTABI,
  AAVETOKENABI,
  OTHERAAVETOKENABI,
  CRV3TOKENABI,
  VAULT_USDCABI,
  VAULT_StrategyMKRVaultDAIDelegateABI,
  VAULT_StrategyYPoolABI,
  VAULT_StrategyGenericLevCompFarmABI,
  VAULT_StrategySingleSidedCrvABI,
  CERC20DELEGATORABI,
  CURVE_STEPOOLCONTRACTABI,
  CURVE_SAPOOLCONTRACTABI,
  VAULT_StrategysteCurveWETHSingleSidedABI,
  VAULT_StrategyeCurveWETHSingleSidedABI,
  VAULT_StrategySynthetixSusdMinterABI,
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
      systemAssetInfo: systemAssetsJSON,
      systemJSON: systemJSON,
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
    // console.log(this.store);
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
      // console.log(ex);
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
      // console.log(ex);
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
      // console.log(ex);
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
              total_assets: BigNumber(totalSupply).div(10 ** vault.decimals),
              price: vault.pricePerFullShare,
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
          // console.log(vault);
          // console.log(ex);

          if (callback) {
            callback(null, vault);
          } else {
            return vault;
          }
        }
      },
      (err, vaultsBalanced) => {
        if (err) {
          // console.log(err);
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

        this.calculateSystemOverview();
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
      // console.log(ex)
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
      // console.log({ message: `Zap Failed. ${error.message}`, poolAddress: 'poolAddress' });
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
      // console.log({ message: `Zap Failed. ${error.message}`, poolAddress: 'poolAddress' });
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
      // console.log(ex);
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

  // gets the system overview.
  calculateSystemOverview = async () => {
    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
    }

    const vaultData = this.getStore('vaults').filter((vault) => {
      // ADD YVBOOST BACK IN '0xc5bDdf9843308380375a611c18B50Fb9341f502A'
      // ADD OLD WETH VAULT BACK IN '0xa9fE4601811213c340e850ea305481afF02f5b28'
      return !['0xc5bDdf9843308380375a611c18B50Fb9341f502A', '0xa9fE4601811213c340e850ea305481afF02f5b28', '0x881b06da56BB5675c54E4Ed311c21E54C5025298', '0x29E240CFD7946BA20895a7a02eDb25C210f9f324', '0xE625F5923303f1CE7A43ACFEFd11fd12f30DbcA4'].includes(vault.address)
    })

    const coingeckoCoinList = await this.getCoingeckoTokenList()

    // let da = vaultData.filter((vault) => {
    //   return vault.address === '0x5f18C75AbDAe578b483E5F43f12a39cF75b973a9'
    // })

    async.mapLimit(vaultData, 10, async (vault, callback) => {

      let depositToken = await this.getTokenTree(web3, vault.tokenMetadata.address, coingeckoCoinList, vault)

      const erc20Contract = new web3.eth.Contract(ERC20ABI, vault.address);
      const depositTokenTotalSupply = await erc20Contract.methods.totalSupply().call()
      depositToken.balance = BigNumber(depositTokenTotalSupply).times(vault.pricePerFullShare).div(10**depositToken.decimals).toFixed(depositToken.decimals)
      depositToken.balanceUSD = BigNumber(depositTokenTotalSupply).times(vault.pricePerFullShare).times(depositToken.price).div(10**depositToken.decimals).toFixed(depositToken.decimals)

      vault.depositToken = depositToken

      const strategiesData = await this.getVaultStrategiesData(web3, vault, coingeckoCoinList)
      vault.strategies = strategiesData

      if(callback) {
        callback(null, vault)
      } else {
        return vault
      }

    }, (err, vaults) => {
      if(err) {
        // console.log(err)
      }
      // console.log(JSON.stringify(vaults))

      this.setStore({ systemJSON: vaults })
      this.emitter.emit(SYSTEM_UPDATED)
    })
  }

  // gets a token by address. returns all sub tokens in the case of aave, compound, curve, iEarn tokens
  getTokenTree = async (web3, tokenAddress, coingeckoCoinList, vault) => {
    const curvePoolContract = this.mapCurveTokenToPool(tokenAddress)
    const isCompoundToken = this.mapCompAssetToUnderlying(tokenAddress)
    const isIEarnToken = this.mapIearnTokenToUnderlying(tokenAddress)
    const isAToken = this.mapATokenToUnderlying(tokenAddress)
    const isYearnVault = this.mapYVaultToUnderlying(tokenAddress)
    const isCreamToken = this.mapCreamTokenToUnderlying(tokenAddress)

    const assetInfo = await this.mapTokenAddressToInfo(tokenAddress, web3, coingeckoCoinList, vault)

    if(!assetInfo) {
      return null
    }

    // this is a curve pool token, we need to get the underling assets
    if(curvePoolContract !== false) {
        try {
          let tokens = []

          let poolContract = null
          if(['yDAI+yUSDC+yUSDT+yTUSD', 'yDAI+yUSDC+yUSDT+yBUSD', 'crvRenWSBTC', 'cDAI+cUSDC', 'crvRenWBTC', 'crvPlain3andSUSD', 'ypaxCrv', 'cDAI+cUSDC+USDT'].includes(assetInfo.symbol)) {
            poolContract = new web3.eth.Contract(CURVE_POOLCONTRACTABI, curvePoolContract)
          } else if (['steCRV'].includes(assetInfo.symbol)) {
            poolContract = new web3.eth.Contract(CURVE_STEPOOLCONTRACTABI, curvePoolContract)
          } else if (['saCRV'].includes(assetInfo.symbol)) {
            poolContract = new web3.eth.Contract(CURVE_SAPOOLCONTRACTABI, curvePoolContract)
          } else {
            poolContract = new web3.eth.Contract(CRV3TOKENABI, curvePoolContract)
          }

          for(let i = 0; i < 4; i++) {
            try {
              const underlyingTokenAddress = await poolContract.methods.coins(i).call()
              let underlyingToken = await this.getTokenTree(web3, underlyingTokenAddress, coingeckoCoinList)
              const underlyingBalance = await poolContract.methods.balances(i).call()
              underlyingToken.protocolBalance = BigNumber(underlyingBalance).div(10**underlyingToken.decimals).toFixed(underlyingToken.decimals)
              tokens.push(underlyingToken)
            } catch(ex) {
              // console.log(ex)
              // there might not be 4 tokens, so this is very reasonable to expect. we just ignore it I guess
            }
          }

          let total = tokens.reduce((acc, val) => {
            if(!acc) {
              acc = 0
            }
            return BigNumber(val.protocolBalance).plus(acc).toFixed(val.decimals)
          }, 0)

          //once we have ratios, we can get actualy balances
          for(let i = 0; i < tokens.length; i++) {
            tokens[i].protocolRatio = BigNumber(tokens[i].protocolBalance).times(100).div(total).toFixed(tokens[i].decimals)
          }

          return {
            address: tokenAddress,
            decimals: assetInfo.decimals,
            symbol: assetInfo.symbol,
            price: assetInfo.price,
            description: assetInfo.description,
            isCompoundToken: false,
            isIEarnToken: false,
            isCurveToken: true,
            isAaveToken: false,
            isYVaultToken: false,
            isCreamToken: false,
            curveUnderlyingTokens: tokens,
          }

        } catch(ex) {
          // console.log(ex)
        }
    } else if (isCompoundToken !== false) {
      const compoundContract = new web3.eth.Contract(COMP_TOKENABI, tokenAddress)

      const underlying = await compoundContract.methods.underlying().call()
      let underlyingToken = await this.getTokenTree(web3, underlying, coingeckoCoinList)

      const getCash = await compoundContract.methods.getCash().call()
      const totalBorrows = await compoundContract.methods.totalBorrows().call()
      const totalReserves = await compoundContract.methods.totalReserves().call()
      const totalSupply = await compoundContract.methods.totalSupply().call()

      const exchangeRate = BigNumber(BigNumber(getCash/(10**underlyingToken.decimals)).plus(totalBorrows/(10**underlyingToken.decimals)).minus(totalReserves/(10**underlyingToken.decimals))).div(totalSupply/(10**8)).toFixed(18)
      underlyingToken.exchangeRate = exchangeRate

      return {
        address: tokenAddress,
        decimals: assetInfo.decimals,
        symbol: assetInfo.symbol,
        price: assetInfo.price,
        description: assetInfo.description,
        isCompoundToken: true,
        isIEarnToken: false,
        isCurveToken: false,
        isAaveToken: false,
        isYVaultToken: false,
        isCreamToken: false,
        compoundUnderlyingToken: underlyingToken,
      }
    } else if (isIEarnToken !== false) {
      const iearnContract = new web3.eth.Contract(IEARN_TOKENABI, tokenAddress)

      const underlying = await iearnContract.methods.token().call()
      let underlyingToken = await this.getTokenTree(web3, underlying, coingeckoCoinList)

      const exchangeRate = await iearnContract.methods.getPricePerFullShare().call()
      underlyingToken.exchangeRate = BigNumber(exchangeRate).div(10**18).toFixed(18)

      return {
        address: tokenAddress,
        decimals: assetInfo.decimals,
        symbol: assetInfo.symbol,
        price: assetInfo.price,
        description: assetInfo.description,
        isCompoundToken: false,
        isIEarnToken: true,
        isCurveToken: false,
        isAaveToken: false,
        isYVaultToken: false,
        isCreamToken: false,
        iEarnUnderlingToken: underlyingToken,
      }
    } else if (isAToken !== false) {
      let underlying = null
      if(tokenAddress === '0xA64BD6C70Cb9051F6A9ba1F163Fdc07E0DfB5F84') { // they changed their contract...obviously, why would they keep it the same??? Who needs consistency?
        const aTokenContract = new web3.eth.Contract(AAVETOKENABI, tokenAddress)
        underlying = await aTokenContract.methods.underlyingAssetAddress().call()
      } else {
        const aTokenContract = new web3.eth.Contract(OTHERAAVETOKENABI, tokenAddress)
        underlying = await aTokenContract.methods.UNDERLYING_ASSET_ADDRESS().call()
      }
      let underlyingToken = await this.getTokenTree(web3, underlying, coingeckoCoinList)

      underlyingToken.exchangeRate = 1 //dont know how to get ratio between aToken and token

      return {
        address: tokenAddress,
        decimals: assetInfo.decimals,
        symbol: assetInfo.symbol,
        price: assetInfo.price,
        description: assetInfo.description,
        isCompoundToken: false,
        isIEarnToken: false,
        isCurveToken: false,
        isAaveToken: true,
        isYVaultToken: false,
        isCreamToken: false,
        aaveUnderlyingToken: underlyingToken,
      }
    } else if (isCreamToken !== false) {
      const cyTokenContract = new web3.eth.Contract(CERC20DELEGATORABI, tokenAddress)

      const underlying = await cyTokenContract.methods.underlying().call()
      let underlyingToken = await this.getTokenTree(web3, underlying, coingeckoCoinList)

      const getCash = await cyTokenContract.methods.getCash().call()
      const totalBorrows = await cyTokenContract.methods.totalBorrows().call()
      const totalReserves = await cyTokenContract.methods.totalReserves().call()
      const totalSupply = await cyTokenContract.methods.totalSupply().call()

      const exchangeRate = BigNumber(BigNumber(getCash/(10**underlyingToken.decimals)).plus(totalBorrows/(10**underlyingToken.decimals)).minus(totalReserves/(10**underlyingToken.decimals))).div(totalSupply/(10**8)).toFixed(18)
      underlyingToken.exchangeRate = exchangeRate

      return {
        address: tokenAddress,
        decimals: assetInfo.decimals,
        symbol: assetInfo.symbol,
        price: assetInfo.price,
        description: assetInfo.description,
        isCompoundToken: false,
        isIEarnToken: false,
        isCurveToken: false,
        isAaveToken: false,
        isYVaultToken: false,
        isCreamToken: true,
        creamUnderlyingToken: underlyingToken,
      }
    } else if (isYearnVault !== false) {  // probably need to split this into v1 vs v2 contracts. (getPricePerFullShare vs pricePerFullShare)
      const yVaultContract = new web3.eth.Contract(VAULTV1ABI, tokenAddress)

      const underlying = await yVaultContract.methods.token().call()
      const underlyingToken = await this.getTokenTree(web3, underlying, coingeckoCoinList)

      let exchangeRate = await yVaultContract.methods.getPricePerFullShare().call()
      underlyingToken.exchangeRate = BigNumber(exchangeRate).div(10**18).toFixed(18)

      return {
        address: tokenAddress,
        decimals: assetInfo.decimals,
        symbol: assetInfo.symbol,
        price: assetInfo.price,
        description: assetInfo.description,
        isCompoundToken: false,
        isIEarnToken: false,
        isCurveToken: false,
        isAaveToken: false,
        isYVaultToken: true,
        isCreamToken: false,
        yVaultUnderlyingToken: underlyingToken,
      }

    } else {
      return {
        address: tokenAddress,
        decimals: assetInfo.decimals,
        symbol: assetInfo.symbol,
        price: assetInfo.price,
        description: assetInfo.description,
        isCompoundToken: false,
        isIEarnToken: false,
        isCurveToken: false,
        isAaveToken: false,
        isYVaultToken: false,
        isCreamToken: false,
      }
    }
  }

  // returns the list of coingecko assets for us to itterate through
  getCoingeckoTokenList = async () => {
    try {
      const url = `${COINGECKO_API}/coins/list`

      const coinsApiResult = await fetch(url);
      const coinsList = await coinsApiResult.json();

      return coinsList
    } catch(ex) {
      // console.log(ex)
      return []
    }
  }

  // gets a specific tokens's 'static' information (symbol, decimals, price, desription)
  mapTokenAddressToInfo = async (tokenAddress, web3, coingeckoCoinList, vault) => {
    if(!tokenAddress) {
      return null
    }
    // search our local storage if asset objects.
    // geuss we need to populate some storage info first.
    const assetInfos = this.getStore('systemAssetInfo')
    const assetInfo = assetInfos.find(asset => asset.address === tokenAddress)

    let symbol = null
    let decimals = null
    let price = 1
    let description = `I don't have a description for this asset at this moment.`
    let priceUpdated = false
    let shouldSearchPrice = false

    if(assetInfo) {
      symbol = assetInfo.symbol
      decimals = assetInfo.decimals
      if(assetInfo.description) {
        description = assetInfo.description
      }
      if(assetInfo.price) {
        price = assetInfo.price
      }

      if(assetInfo.priceUpdated) {
        shouldSearchPrice = false
      }
    } else {
      const erc20Contract = new web3.eth.Contract(ERC20ABI, tokenAddress);
      symbol = await erc20Contract.methods.symbol().call()
      decimals = parseInt(await erc20Contract.methods.decimals().call())
    }

    // get a different price oracle somewhere. sushiQuote or something.
    if(shouldSearchPrice) {
      const coingeckoItem = coingeckoCoinList.find((coin) => {
        if(symbol.toLowerCase() === 'musd') {
          return coin.symbol.toLowerCase() === 'musd' && coin.id === 'musd'
        } else if(symbol.toLowerCase() === 'uni') {
          return coin.symbol.toLowerCase() === 'uni' && coin.id === 'uniswap'
        } else {
          return coin.symbol.toLowerCase() === symbol.toLowerCase()
        }
      })
      if(coingeckoItem) {
        try {
          priceUpdated = true
          const url = `${COINGECKO_API}/coins/${coingeckoItem.id}`

          const coinsApiResult = await fetch(url);
          const coinInfo = await coinsApiResult.json();

          if(coinInfo && !coinInfo.error) {
            if(coinInfo.description.en && coinInfo.description.en !== '') {
              description = coinInfo.description.en
            }
            if(coinInfo.market_data.current_price.usd) {
              price = coinInfo.market_data.current_price.usd
            }
          }
        } catch(ex) {
          // console.log(ex)
        }
      }
    }

    if (vault && vault.tokenMetadata && symbol === vault.tokenMetadata.symbol && price === 1 && vault.tvl && vault.tvl.price) {
      price = vault.tvl.price
    }

    const returnObj = {
      address: tokenAddress,
      symbol: symbol,
      decimals: decimals,
      description: description,
      price: price,
      priceUpdated: priceUpdated
    }

    const assetInfoIndex = assetInfos.findIndex(asset => asset.address === tokenAddress)

    if(assetInfoIndex === -1) {
      assetInfos.push(returnObj)
    } else {
      assetInfos[assetInfoIndex] = returnObj
    }

    this.setStore({ systemAssetInfo: assetInfos })

    return returnObj
  }

  // checks to see if an asset is a curve asset and returns the pool asset (so we can get tthe breakdown of assets)
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
      case '0xb19059ebb43466C323583928285a49f558E572Fd':
        return '0x4CA9b3063Ec5866A4B82E437059D2C43d1be596F';
      case '0x97E2768e8E73511cA874545DC5Ff8067eB19B787':
        return '0x3E01dD8a5E1fb3481F0F589056b428Fc308AF0Fb';
      default:
        return false;
    }
  }

  // checks to see if an asset is a iEarn asset
  mapIearnTokenToUnderlying = (address) => {
    switch (address) {
      case '0x16de59092dAE5CcF4A1E6439D611fd0653f0Bd01':
      case '0xd6aD7a6750A7593E092a9B218d66C0A814a3436e':
      case '0x83f798e925BcD4017Eb265844FDDAbb448f1707D':
      case '0x73a052500105205d34Daf004eAb301916DA8190f':
      case '0x04bC0Ab673d88aE9dbC9DA2380cB6B79C4BCa9aE':
      case '0xE6354ed5bC4b393a5Aad09f21c46E101e692d447':
      case '0x26EA744E5B887E5205727f55dFBE8685e3b21951':
      case '0xC2cB1040220768554cf699b0d863A3cd4324ce32':
        return true;
      default:
        return false;
    }
  }

  // checks to see if an asset is a aave asset
  mapATokenToUnderlying = (address) => {
    switch (address) {
      case '0xA64BD6C70Cb9051F6A9ba1F163Fdc07E0DfB5F84':
      case '0x028171bCA77440897B824Ca71D1c56caC55b68A3':
      case '0x6C5024Cd4F8A59110119C56f8933403A539555EB':
        return true;
      default:
        return false;
    }
  }

  // checks to see if an asset is a compound asset
  mapCompAssetToUnderlying = (address) => {
    switch (address) {
      case '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643':
      case '0x39AA39c021dfbaE8faC545936693aC917d5E7563':
        return true;
      default:
        return false;
    }
  }

  //checks to see if an asset is a yearn vault
  mapYVaultToUnderlying = (address) => {
    const vaults = this.getStore('vaults').map((vault) => {
      if(address === '0xc5bDdf9843308380375a611c18B50Fb9341f502A') {
        return false
      }
      if(address === '0x9d409a0A012CFbA9B15F6D4B36Ac57A46966Ab9a') {
        return false
      }
      return vault.address
    })

    return vaults.includes(address)
  }

  mapCreamTokenToUnderlying = (address) => {
    switch (address) {
      case '0x8e595470Ed749b85C6F7669de83EAe304C2ec68F':
      case '0x76Eb2FE28b36B3ee97F3Adae0C69606eeDB2A37c':
      case '0x48759F220ED983dB51fA7A8C0D2AAb8f3ce4166a':
        return true;
      default:
        return false;
    }
  }

  // gets all the strategies for a vault
  getVaultStrategiesData = async (web3, vault, coingeckoCoinList) => {

    const promises = vault.strategies.map(strategy => {
      return new Promise(async (resolve, reject) => {
        try {
          const strat = await this.mapStrategyToBalance(web3, strategy, vault, coingeckoCoinList)

          strategy.balance = strat.strategyBalance
          strategy.balanceUSD = strat.strategyBalanceUSD
          strategy.protocols = strat.protocols
          strategy.description = strat.description
        } catch(ex) {
          strategy.balance = 0
          strategy.balanceUSD = 0
          strategy.protocols = []
          strategy.description = ''
        }

        resolve(strategy);
      });
    });

    const strategiesPopulated = await Promise.all(promises);

    return strategiesPopulated
  }

  // takes a strategy, gets the exposure asset. gets used balances of each exposure asset
  mapStrategyToBalance = async (web3, strategy, vault, coingeckoCoinList) => {

    try {
      let strategyContract = null
      let asset = null
      let token = null
      let protocols = []
      let strategyBalance = 0
      let strategyBalanceUSD = 0

      const strategyDescription = this.mapStrategyToDescription(strategy.name, vault.tokenMetadata.symbol)

      if (strategy.name.includes('SingleSided') || strategy.name.includes('VoterProxy') ||
        ['StrategyTUSDypool', 'StrategyUSDC3pool', 'StrategyDAI3pool', 'StrategyUSDT3pool', 'StrategystETHCurve', 'StrategyYearnVECRV', 'yvWBTCStratMMV1', 'StrategyGUSDRescue', 'StrategymUSDCurve'].includes(strategy.name)) {

        asset = await this.mapStrategyAddressToAsset(web3, strategy.address, strategy.name.includes('SingleSided'))
        token = await this.getTokenTree(web3, asset, coingeckoCoinList, vault)

        let isThatContract = ['yvWBTCStratMMV1', 'StrategystETHCurve', 'CurveeCRVVoterProxy', 'StrategyYearnVECRV', 'StrategyCurveIBVoterProxy', 'CurvehCRVVoterProxy',
          'CurvesaCRVVoterProxy', 'CurveoBTC/sbtcCRVVoterProxy', 'CurvepBTC/sbtcCRVVoterProxy', 'CurvecrvRenWBTCVoterProxy', 'CurvecrvRenWSBTCVoterProxy',
          'CurveFRAX3CRV-fVoterProxy', 'CurveyDAI+yUSDC+yUSDT+yBUSDVoterProxy', 'CurvecDAI+cUSDCVoterProxy', 'Curvegusd3CRVVoterProxy', 'CurveyDAI+yUSDC+yUSDT+yTUSDVoterProxy', 'Curve3CrvVoterProxy',
          'CurveTUSD3CRV-fVoterProxy', 'CurveBUSD3CRV-fVoterProxy', 'Curvedusd3CRVVoterProxy', 'Curveust3CRVVoterProxy', 'Curvemusd3CRVVoterProxy', 'CurvecrvPlain3andSUSDVoterProxy',
          'CurvelinkCRVVoterProxy', 'Curveusdn3CRVVoterProxy', 'Curveusdp3CRVVoterProxy', 'CurvealUSD3CRV-fVoterProxy', 'CurverCRVVoterProxy', 'Curvea3CRVVoterProxy', 'Curvehusd3CRVVoterProxy',
          'CurveeursCRVVoterProxy', 'CurvecrvTricryptoVoterProxy', 'CurveypaxCrvVoterProxy', 'CurvecDAI+cUSDC+USDTVoterProxy', 'CurveankrCRVVoterProxy', 'Curveusdk3CRVVoterProxy', 'Curversv3CRVVoterProxy',
          'CurvebBTC/sbtcCRVVoterProxy', 'CurveLUSD3CRV-fVoterProxy'].includes(strategy.name)

        let abi = VAULT_StrategyPoolABI
        if (['StrategyTUSDypool'].includes(strategy.name)) {
          abi = VAULT_StrategyYPoolABI
        } else if (strategy.name.includes('StrategysteCurveWETHSingleSided')) {
          abi = VAULT_StrategysteCurveWETHSingleSidedABI
        } else if (strategy.name.includes('StrategyeCurveWETHSingleSided')) {
          abi = VAULT_StrategyeCurveWETHSingleSidedABI
        } else if (strategy.name.includes('SingleSided')) {
          abi = VAULT_StrategySingleSidedCrvABI
        } else if (isThatContract) {
          abi = VAULT_AaveWETHLenderUSDTBorrowerABI
        }
        strategyContract = new web3.eth.Contract(abi, strategy.address)
        let overrideDecimals = false

        if(strategy.name.includes('StrategysteCurveWETHSingleSided')) {
          strategyBalance = await strategyContract.methods.balanceOfyvsteCRV().call()
        } else if(strategy.name.includes('StrategyeCurveWETHSingleSided')) {
          strategyBalance = await strategyContract.methods.balanceOfyveCRV().call()
        } else if(strategy.name.includes('SingleSided')) {
          strategyBalance = await strategyContract.methods.curveTokensInYVault().call()
          overrideDecimals = 18
        } else if(isThatContract) {
          strategyBalance = await strategyContract.methods.estimatedTotalAssets().call()
        } else {
          strategyBalance = await strategyContract.methods.balanceOf().call()
        }

        strategyBalance = BigNumber(strategyBalance).div(10**(overrideDecimals ? overrideDecimals : token.decimals)).toFixed((overrideDecimals ? overrideDecimals : token.decimals))
        strategyBalanceUSD = BigNumber(strategyBalance).times(token.price).toFixed((overrideDecimals ? overrideDecimals : token.decimals))

        token.balance = strategyBalance
        token.balanceUSD = strategyBalanceUSD

        protocols = [
          {
            name: 'Curve',
            balance: strategyBalance,
            balanceUSD: strategyBalanceUSD,
            tokens: [token],
            description: this.mapProtocolToDescription('Curve')
          }
        ]

      } else if (strategy.name.includes('StrategyYFIGovernance')) {

        asset = await this.mapStrategyAddressToAsset(web3, strategy.address)
        token = await this.getTokenTree(web3, asset, coingeckoCoinList, vault)

        strategyContract = new web3.eth.Contract(VAULT_StrategyPoolABI, strategy.address)
        strategyBalance = await strategyContract.methods.balanceOf().call()
        strategyBalance = BigNumber(strategyBalance).div(10**token.decimals).toFixed(token.decimals)
        strategyBalanceUSD = BigNumber(strategyBalance).times(vault.tvl.price).toFixed(token.decimals)

        token.balance = strategyBalance
        token.balanceUSD = strategyBalanceUSD

        protocols = [
          {
            name: 'Yearn',
            balance: strategyBalance,
            balanceUSD: strategyBalanceUSD,
            tokens: [token],
            description: this.mapProtocolToDescription('Yearn')
          }
        ]
      } else if (strategy.name === 'StrategyMKRVaultDAIDelegate' || (strategy.name.includes('Maker') && strategy.name.includes('DAIDelegate'))) {

        let assets = await this.mapStrategyAddressToAsset(web3, strategy.address)
        let collateralToken = await this.getTokenTree(web3, assets.collateral, coingeckoCoinList, vault)
        let debtToken = await this.getTokenTree(web3, assets.debt, coingeckoCoinList, vault)

        strategyContract = new web3.eth.Contract(VAULT_StrategyMKRVaultDAIDelegateABI, strategy.address)
        const debt = await strategyContract.methods.getTotalDebtAmount().call()
        const collateral = await strategyContract.methods.balanceOfmVault().call()

        collateralToken.balance = BigNumber(collateral).div(10**18).toFixed(collateralToken.decimals)
        collateralToken.balanceUSD = BigNumber(collateral).times(collateralToken.price).div(10**collateralToken.decimals).toFixed(collateralToken.decimals)

        debtToken.balance = BigNumber(debt).div(10**18).toFixed(debtToken.decimals)
        debtToken.balanceUSD = BigNumber(debt).times(debtToken.price).div(10**debtToken.decimals).toFixed(debtToken.decimals)

        protocols = [
          {
            name: 'Maker',
            balance: BigNumber(collateral).div(10**18).toFixed(18),
            balanceUSD: BigNumber(collateral).div(10**18).times(vault.tvl.price).toFixed(vault.token.decimals),
            tokens: [collateralToken, debtToken],
            description: this.mapProtocolToDescription('Maker')
          }
        ]

        strategyBalance = protocols.reduce((acc, curr) => {
          return BigNumber(acc).plus(curr.balance).toFixed(18)
        }, 0)
        strategyBalanceUSD = protocols.reduce((acc, curr) => {
          return BigNumber(acc).plus(curr.balanceUSD).toFixed(18)
        }, 0)

      } else if (strategy.name.includes('IBLevComp') || strategy.name.includes('StrategyGenericLevCompFarm')) {   // these do other things with assets. Iron Bank or DyDx. Get balances etc.

        // estimatedTotalAssets
        // getCurrentPosition
        let assets = await this.mapStrategyAddressToAsset(web3, strategy.address)
        let collateralToken = await this.getTokenTree(web3, assets.collateral, coingeckoCoinList, vault)
        let debtToken = await this.getTokenTree(web3, assets.debt, coingeckoCoinList, vault)

        strategyContract = new web3.eth.Contract(VAULT_StrategyGenericLevCompFarmABI, strategy.address)
        const position = await strategyContract.methods.getCurrentPosition().call()

        collateralToken.balance = BigNumber(position.deposits).div(10**collateralToken.decimals).toFixed(collateralToken.decimals)
        collateralToken.balanceUSD = BigNumber(position.deposits).times(collateralToken.price).div(10**collateralToken.decimals).toFixed(collateralToken.decimals)

        debtToken.balance = BigNumber(position.borrows).div(10**debtToken.decimals).toFixed(debtToken.decimals)
        debtToken.balanceUSD = BigNumber(position.borrows).times(debtToken.price).div(10**debtToken.decimals).toFixed(debtToken.decimals)

        protocols = [
          {
            name: 'Compound',
            balance: BigNumber(collateralToken.balance).plus(debtToken.balance).toFixed(vault.token.decimals),
            balanceUSD: BigNumber(collateralToken.balance).plus(debtToken.balance).times(vault.tvl.price).toFixed(vault.token.decimals),
            tokens: [collateralToken, debtToken],
            description: this.mapProtocolToDescription('Compound')
          },
          // {
          //   name: 'DyDx',  //understand how it uses dydx better, then add this
          //   balance: 0,
          //   balanceUSD: BigNumber(0).times(vault.tvl.price).toFixed(vault.token.decimals),
          //   tokens: []
          // }
        ]

        strategyBalance = protocols.reduce((acc, curr) => {
          return BigNumber(acc).plus(curr.balance).toFixed(18)
        }, 0)
        strategyBalanceUSD = protocols.reduce((acc, curr) => {
          return BigNumber(acc).plus(curr.balanceUSD).toFixed(18)
        }, 0)

      } else if (strategy.name.includes('StrategyAH2Earncy')) {
        asset = await this.mapStrategyAddressToAsset(web3, strategy.address)
        token = await this.getTokenTree(web3, asset, coingeckoCoinList, vault)

        strategyContract = new web3.eth.Contract(VAULT_AaveWETHLenderUSDTBorrowerABI, strategy.address)
        strategyBalance = await strategyContract.methods.estimatedTotalAssets().call()
        strategyBalance = BigNumber(strategyBalance).div(10**token.decimals).toFixed(token.decimals)
        strategyBalanceUSD = BigNumber(strategyBalance).times(vault.tvl.price).toFixed(token.decimals)

        token.balance = strategyBalance
        token.balanceUSD = strategyBalanceUSD

        protocols = [
          {
            name: 'Alpha Homora',
            balance: strategyBalance,
            balanceUSD: strategyBalanceUSD,
            tokens: [token],
            description: this.mapProtocolToDescription('Alpha Homora')
          }
        ]
      } else if(['StrategyLenderYieldOptimiser'].includes(strategy.name)) {
        asset = await this.mapStrategyAddressToAsset(web3, strategy.address)
        token = await this.getTokenTree(web3, asset, coingeckoCoinList, vault)

        strategyContract = new web3.eth.Contract(VAULT_StrategyLenderYieldOptimiserABI, strategy.address)
        const protocolTuple = await strategyContract.methods.lendStatuses().call()
        protocols = protocolTuple.map((pro) => {
          var tok = { ...token }

          tok.balance = BigNumber(pro.assets).div(10**tok.decimals).toFixed(tok.decimals)
          tok.balanceUSD = BigNumber(pro.assets).div(10**tok.decimals).times(vault.tvl.price).toFixed(tok.decimals)

          return {
            name: this.mapLenderNameToProtocol(pro.name),
            balance: tok.balance,
            balanceUSD: tok.balanceUSD,
            tokens: [tok],
            description: this.mapProtocolToDescription(this.mapLenderNameToProtocol(pro.name))
          }
        })

        strategyBalance = protocols.reduce((acc, curr) => {
          return BigNumber(acc).plus(curr.balance).toFixed(18)
        }, 0)
        strategyBalanceUSD = protocols.reduce((acc, curr) => {
          return BigNumber(acc).plus(curr.balanceUSD).toFixed(18)
        }, 0)

      } else if (strategy.name.includes('StrategyIdleidle')) {
        asset = await this.mapStrategyAddressToAsset(web3, strategy.address)
        token = await this.getTokenTree(web3, asset, coingeckoCoinList, vault)

        strategyContract = new web3.eth.Contract(VAULT_StrategyIdleidleRAIYieldABI, strategy.address)
        strategyBalance = await strategyContract.methods.balanceOnIdle().call()
        strategyBalance = BigNumber(strategyBalance).div(10**token.decimals).toFixed(token.decimals)
        strategyBalanceUSD = BigNumber(strategyBalance).times(vault.tvl.price).toFixed(token.decimals)

        token.balance = strategyBalance
        token.balanceUSD = strategyBalanceUSD

        protocols = [
          {
            name: 'Idle.Finance',
            balance: strategyBalance,
            balanceUSD: strategyBalanceUSD,
            tokens: [token],
            description: this.mapProtocolToDescription('Idle.Finance')
          }
        ]
      } else if (strategy.name.includes('PoolTogether')) {
        asset = await this.mapStrategyAddressToAsset(web3, strategy.address)
        token = await this.getTokenTree(web3, asset, coingeckoCoinList, vault)

        strategyContract = new web3.eth.Contract(YEARNVAULT_0_3_3ABI, strategy.address)
        strategyBalance = await strategyContract.methods.balanceOfPool().call()
        strategyBalance = BigNumber(strategyBalance).div(10**token.decimals).toFixed(token.decimals)
        strategyBalanceUSD = BigNumber(strategyBalance).times(vault.tvl.price).toFixed(token.decimals)

        token.balance = strategyBalance
        token.balanceUSD = strategyBalanceUSD

        protocols = [
          {
            name: 'PoolTogether',
            balance: strategyBalance,
            balanceUSD: strategyBalanceUSD,
            tokens: [token],
            description: this.mapProtocolToDescription('PoolTogether')
          }
        ]
      } else if (strategy.name.includes('StrategyRook')) {
        asset = await this.mapStrategyAddressToAsset(web3, strategy.address)
        token = await this.getTokenTree(web3, asset, coingeckoCoinList, vault)

        strategyContract = new web3.eth.Contract(VAULT_StrategyRookDaiStablecoinABI, strategy.address)
        strategyBalance = await strategyContract.methods.balanceOfStaked().call()
        strategyBalance = BigNumber(strategyBalance).div(10**token.decimals).toFixed(token.decimals)
        strategyBalanceUSD = BigNumber(strategyBalance).times(vault.tvl.price).toFixed(token.decimals)

        token.balance = strategyBalance
        token.balanceUSD = strategyBalanceUSD

        protocols = [
          {
            name: 'KeeperDAO',
            balance: strategyBalance,
            balanceUSD: strategyBalanceUSD,
            tokens: [token],
            description: this.mapProtocolToDescription('KeeperDAO')
          }
        ]
      } else if (strategy.name.includes('Convex')) {

        asset = await this.mapStrategyAddressToAsset(web3, strategy.address)
        token = await this.getTokenTree(web3, asset, coingeckoCoinList, vault)

        strategyContract = new web3.eth.Contract(VAULT_AaveWETHLenderUSDTBorrowerABI, strategy.address)
        strategyBalance = await strategyContract.methods.estimatedTotalAssets().call()
        strategyBalance = BigNumber(strategyBalance).div(10**token.decimals).toFixed(token.decimals)
        strategyBalanceUSD = BigNumber(strategyBalance).times(vault.tvl.price).toFixed(token.decimals)

        token.balance = strategyBalance
        token.balanceUSD = strategyBalanceUSD

        protocols = [
          {
            name: 'Convex',
            balance: strategyBalance,
            balanceUSD: strategyBalanceUSD,
            tokens: [token],
            description: this.mapProtocolToDescription('Convex')
          },
          {
            name: 'Curve',
            balance: strategyBalance,
            balanceUSD: strategyBalanceUSD,
            tokens: [token],
            description: this.mapProtocolToDescription('Curve')
          }
        ]
      } else if (strategy.name.includes('Strategy1INCHGovernance')) {
        asset = await this.mapStrategyAddressToAsset(web3, strategy.address)
        token = await this.getTokenTree(web3, asset, coingeckoCoinList, vault)

        strategyContract = new web3.eth.Contract(VAULT_AaveWETHLenderUSDTBorrowerABI, strategy.address)
        strategyBalance = await strategyContract.methods.estimatedTotalAssets().call()
        strategyBalance = BigNumber(strategyBalance).div(10**token.decimals).toFixed(token.decimals)
        strategyBalanceUSD = BigNumber(strategyBalance).times(vault.tvl.price).toFixed(token.decimals)

        token.balance = strategyBalance
        token.balanceUSD = strategyBalanceUSD

        protocols = [
          {
            name: '1INCH',
            balance: strategyBalance,
            balanceUSD: strategyBalanceUSD,
            tokens: [token],
            description: this.mapProtocolToDescription('1INCH')
          }
        ]
      } else if (strategy.name.includes('Vesper')) {
        asset = await this.mapStrategyAddressToAsset(web3, strategy.address)
        token = await this.getTokenTree(web3, asset, coingeckoCoinList, vault)

        strategyContract = new web3.eth.Contract(VAULT_StrategyVesperWBTCABI, strategy.address)
        strategyBalance = await strategyContract.methods.calcWantHeldInVesper().call()
        strategyBalance = BigNumber(strategyBalance).div(10**token.decimals).toFixed(token.decimals)
        strategyBalanceUSD = BigNumber(strategyBalance).times(vault.tvl.price).toFixed(token.decimals)

        token.balance = strategyBalance
        token.balanceUSD = strategyBalanceUSD

        protocols = [
          {
            name: 'Vesper',
            balance: strategyBalance,
            balanceUSD: strategyBalanceUSD,
            tokens: [token],
            description: this.mapProtocolToDescription('Vesper')
          }
        ]
      } else if (strategy.name.includes('Synthetix')) {

        let assets = await this.mapStrategyAddressToAsset(web3, strategy.address)
        let collateralToken = await this.getTokenTree(web3, assets.collateral, coingeckoCoinList, vault)
        let debtToken = await this.getTokenTree(web3, assets.debt, coingeckoCoinList, vault)

        strategyContract = new web3.eth.Contract(VAULT_StrategySynthetixSusdMinterABI, strategy.address)
        const collateral = await strategyContract.methods.balanceOfWant().call()
        const debt = await strategyContract.methods.balanceOfDebt().call()

        collateralToken.balance = BigNumber(collateral).div(10**collateralToken.decimals).toFixed(collateralToken.decimals)
        collateralToken.balanceUSD = BigNumber(collateral).times(collateralToken.price).div(10**collateralToken.decimals).toFixed(collateralToken.decimals)

        debtToken.balance = BigNumber(debt).div(10**debtToken.decimals).toFixed(debtToken.decimals)
        debtToken.balanceUSD = BigNumber(debt).times(debtToken.price).div(10**debtToken.decimals).toFixed(debtToken.decimals)

        protocols = [
          {
            name: 'Synthetix',
            balance: BigNumber(collateralToken.balance).plus(debtToken.balance).toFixed(vault.token.decimals),
            balanceUSD: BigNumber(collateralToken.balanceUSD).plus(debtToken.balanceUSD).toFixed(vault.token.decimals),
            tokens: [collateralToken, debtToken],
            description: this.mapProtocolToDescription('Synthetix')
          }
        ]

        strategyBalance = protocols.reduce((acc, curr) => {
          return BigNumber(acc).plus(curr.balance).toFixed(18)
        }, 0)
        strategyBalanceUSD = protocols.reduce((acc, curr) => {
          return BigNumber(acc).plus(curr.balanceUSD).toFixed(18)
        }, 0)

      } else if (strategy.name.includes('Aave')) {

        asset = await this.mapStrategyAddressToAsset(web3, strategy.address)
        token = await this.getTokenTree(web3, asset, coingeckoCoinList, vault)

        strategyContract = new web3.eth.Contract(VAULT_AaveWETHLenderUSDTBorrowerABI, strategy.address)
        strategyBalance = await strategyContract.methods.estimatedTotalAssets().call()
        strategyBalance = BigNumber(strategyBalance).div(10**token.decimals).toFixed(token.decimals)
        strategyBalanceUSD = BigNumber(strategyBalance).times(vault.tvl.price).toFixed(token.decimals)

        token.balance = strategyBalance
        token.balanceUSD = strategyBalanceUSD

        // we can also borrow things apparently, but I don't have any public functions to get this info. might need to dig into aave contracts to get it?

        protocols = [
          {
            name: 'Aave',
            balance: strategyBalance,
            balanceUSD: strategyBalanceUSD,
            tokens: [token],
            description: this.mapProtocolToDescription('Aave')
          }
        ]
      } else if (strategy.name.includes('LPProfitSwitching')) {

        asset = await this.mapStrategyAddressToAsset(web3, strategy.address)
        token = await this.getTokenTree(web3, asset, coingeckoCoinList, vault)

        strategyContract = new web3.eth.Contract(IEARN_TOKENABI, strategy.address)
        const aaveBalance = await strategyContract.methods.balanceAave().call()
        const dydxBalance = await strategyContract.methods.balanceDydx().call()
        const fulcrumBalance = await strategyContract.methods.balanceFulcrum().call()
        const compoundBalance = await strategyContract.methods.balanceCompound().call()

        let aaveToken = { ...token }
        aaveToken.balance = BigNumber(aaveBalance).div(10**token.decimals).toFixed(token.decimals)
        aaveToken.balanceUSD = BigNumber(aaveBalance).times(vault.tvl.price).div(10**token.decimals).toFixed(token.decimals)

        let dydxToken = { ...token }
        dydxToken.balance = BigNumber(dydxBalance).div(10**token.decimals).toFixed(token.decimals)
        dydxToken.balanceUSD = BigNumber(dydxBalance).times(vault.tvl.price).div(10**token.decimals).toFixed(token.decimals)

        let fulcrumToken = { ...token }
        fulcrumToken.balance = BigNumber(fulcrumBalance).div(10**token.decimals).toFixed(token.decimals)
        fulcrumToken.balanceUSD = BigNumber(fulcrumBalance).times(vault.tvl.price).div(10**token.decimals).toFixed(token.decimals)

        let compoundToken = { ...token }
        compoundToken.balance = BigNumber(compoundBalance).div(10**token.decimals).toFixed(token.decimals)
        compoundToken.balanceUSD = BigNumber(compoundBalance).times(vault.tvl.price).div(10**token.decimals).toFixed(token.decimals)

        protocols = [
          {
            name: 'Aave',
            balance: aaveToken.balance,
            balanceUSD: aaveToken.balanceUSD,
            tokens: [aaveToken],
            description: this.mapProtocolToDescription('Aave')
          },
          {
            name: 'DyDx',
            balance: dydxToken.balance,
            balanceUSD: dydxToken.balanceUSD,
            tokens: [dydxToken],
            description: this.mapProtocolToDescription('DyDx')
          },
          {
            name: 'Fulcrum',
            balance: fulcrumToken.balance,
            balanceUSD: fulcrumToken.balanceUSD,
            tokens: [fulcrumToken],
            description: this.mapProtocolToDescription('Fulcrum')
          },
          {
            name: 'Compound',
            balance: compoundToken.balance,
            balanceUSD: compoundToken.balanceUSD,
            tokens: [compoundToken],
            description: this.mapProtocolToDescription('Compound')
          }
        ]

        strategyBalance = protocols.reduce((acc, curr) => {
          return BigNumber(acc).plus(curr.balance).toFixed(18)
        }, 0)
        strategyBalanceUSD = protocols.reduce((acc, curr) => {
          return BigNumber(acc).plus(curr.balanceUSD).toFixed(18)
        }, 0)
      }



      return { strategyBalance, strategyBalanceUSD, protocols, description: strategyDescription }
    } catch(ex) {
      // console.log(ex)
    }



    return {
      protocols: [],
      balance: 0,
      balanceUSD: 0,
      description: ''
    }
  }

  // gets the exposure asset that is used by the strategy
  mapStrategyAddressToAsset = async (web3, address, isSingleSided) => {
    if(['0x4f2fdebE0dF5C92EEe77Ff902512d725F6dfE65c', '0x2F90c531857a2086669520e772E9d433BbfD5496', '0xAa12d6c9d680EAfA48D8c1ECba3FCF1753940A12'].includes(address)) {  // y3CRV
      return '0x9cA85572E6A3EbF24dEDd195623F188735A5179f'
    } else if (address === '0x07DB4B9b3951094B9E278D336aDf46a036295DE7') {
      return '0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8'
    } else if (address === '0x4BA03330338172fEbEb0050Be6940c6e7f9c91b0') {
      return '0x5dbcF33D8c2E976c6b560249878e6F1491Bca25c'
    } else if (address === '0x6f1EbF5BBc5e32fffB6B3d237C3564C15134B8cF') {
      return '0x0FCDAeDFb8A7DfDa2e9838564c5A1665d856AFDF'
    } else if (address === '0x39AFF7827B9D0de80D86De295FE62F7818320b76') {
      return {
        collateral: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        debt: '0x6b175474e89094c44da98b954eedeac495271d0f'
      }
    } else if (address === '0x4730D10703155Ef4a448B17b0eaf3468fD4fb02d') {
      return {
        collateral: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
        debt: '0x6b175474e89094c44da98b954eedeac495271d0f'
      }
    } else if (['0x4031afd3B0F71Bace9181E554A9E680Ee4AbE7dF', '0x77b7CD137Dd9d94e7056f78308D7F65D2Ce68910', '0x55ec3771376b6E1E4cA88D0eEa5e42A448f51C7F', '0x4d069f267DaAb537c4ff135556F711c0A6538496'].includes(address)) { //dai collat, dai debt
      return {
        collateral: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        debt: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
      }
    } else if (['0x32b8C26d0439e1959CEa6262CBabC12320b384c4', '0x7D960F3313f3cB1BBB6BF67419d303597F3E2Fa8', '0x9f51F4df0b275dfB1F74f6Db86219bAe622B36ca', '0x57e848A6915455a7e77CF0D55A1474bEFd9C374d'].includes(address)) { // dai
      return '0x6B175474E89094C44Da98b954EedeAC495271d0F'
    } else if (['0x4D7d4485fD600c61d840ccbeC328BfD76A050F87', '0xE68A8565B4F837BDa10e2e917BFAaa562e1cD143', '0xE6c78b85f93c25B8EE7d963fD15d1d53a00F5908', '0x339dc96a37Dba86008126B3391Db77af93cC0Bd9'].includes(address)) { //usdc collat, usdc debt
      return {
        collateral: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        debt: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
      }
    } else if (['0x04A508664B053E0A08d5386303E649925CBF763c'].includes(address)) { //wbtc collat, dai debt
      return {
        collateral: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
        debt: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
      }
    } else if (['0x9Ae0B9a67cF5D603847980D95Ad4D45b57Ff7783'].includes(address)) {
      return {
        collateral: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        debt: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
      }
    } else if (address === '0xFB5F4E0656ebfF31743e674d324554fd185e1c4b' || address === '0xc9a62e09834cEdCFF8c136f33d0Ae3406aea66bD') {
      return {
        collateral: '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F',
        debt: '0x57ab1ec28d129707052df4df418d58a2d46d5f51'
      }
    } else if (address === '0x136fe75bfDf142a917C954F58577DB04ef6F294B') {  //link collat, dai debt
      return {
        collateral: '0x514910771af9ca656af840dff83e8264ecf986ca',
        debt: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
      }
    } else if (address === '0xD8Fbdf6B01d176C2853e78c62620458ad410e41E') {  //weth collat, weth debt
      return {
        collateral: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        debt: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
      }
    } else if (address === '0xd28b508EA08f14A473a5F332631eA1972cFd7cC0') {
      return '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
    } else if (address == '0x2886971eCAF2610236b4869f58cD42c115DFb47A') {
      return '0x06325440D014e39736583c165C2963BA99fAf14E'
    } else if (address == '0xda988eBb26F505246C59Ba26514340B634F9a7a2') {
      return '0x986b4aff588a109c09b50a03f42e4110e29d353f'
    } else if ([''].includes(address)) { //usdc
      return '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
    } else if (['0xC2cB1040220768554cf699b0d863A3cd4324ce32', '0x26EA744E5B887E5205727f55dFBE8685e3b21951', '0xE6354ed5bC4b393a5Aad09f21c46E101e692d447', '0x04bC0Ab673d88aE9dbC9DA2380cB6B79C4BCa9aE',
      '0x16de59092dAE5CcF4A1E6439D611fd0653f0Bd01', '0xd6aD7a6750A7593E092a9B218d66C0A814a3436e', '0x83f798e925BcD4017Eb265844FDDAbb448f1707D', '0x73a052500105205d34Daf004eAb301916DA8190f',
      '0xF61718057901F84C4eEC4339EF8f0D86D2B45600', '0x04Aa51bbcB46541455cCF1B8bef2ebc5d3787EC9'].includes(address)) {
      const strategyContract = new web3.eth.Contract(IEARN_TOKENABI, address)
      const token = await strategyContract.methods.token().call()
      return token
    } else if (isSingleSided === true) {
      const strategyContract = new web3.eth.Contract(VAULT_StrategySingleSidedCrvABI, address)
      const apiVersion = await strategyContract.methods.apiVersion().call()

      if(apiVersion === '0.3.5') {
        const curveToken = await strategyContract.methods.curveToken().call()
        return curveToken
      } else if (apiVersion === '0.3.3.Edited') {
        const curveToken = await strategyContract.methods.yvToken().call()
        return curveToken
      } else if (apiVersion === '0.4.2') {
        if(address === '0xCdC3d3A18c9d83Ee6E10E91B48b1fcb5268C97B5') {
          return '0xA3D87FffcE63B53E0d54fAa1cc983B7eB0b74A9c'
        } else if (address === '0x8c44Cc5c0f5CD2f7f17B9Aca85d456df25a61Ae8') {
          return '0x06325440D014e39736583c165C2963BA99fAf14E'
        } else if (address === '0x95eA1643699F8DE347975F31CA8d03eCC507616c') {
          const curveToken = await strategyContract.methods.curveToken().call()
          return curveToken
        }
      } else if (apiVersion === '0.3.2') {
        if(address === '0x148f64a2BeD9c815EDcD43754d3323283830070c') {
          return '0xb19059ebb43466C323583928285a49f558E572Fd'
        }
      } else {
        const wantAddress = await strategyContract.methods.want().call()
        return wantAddress
      }
    } else {
      const strategyContract = new web3.eth.Contract(VAULT_StrategyPoolABI, address)
      const wantAddress = await strategyContract.methods.want().call()
      return wantAddress
    }
  }

  // standardises the lender's name. different strates display them in different ways.
  mapLenderNameToProtocol = (name) => {
    if(name.toLowerCase().includes('aave')) {
      return 'Aave'
    } else if(name.toLowerCase().includes('dydx')) {
      return 'DyDx'
    } else if(name.toLowerCase().includes('alphahomo')) {
      return 'Alpha Homora'
    } else if(name.toLowerCase().includes('cream')) {
      return 'Cream'
    } else if(name.toLowerCase().includes('ib') || name.toLowerCase().includes('ironbank')) {
      return 'Iron Bank'
    }
  }

  mapStrategyToDescription = (name, tokens) => {
    // generic farms
    if (name.includes('StrategyLenderYieldOptimiser')) {
      return `This strategy lends the ${tokens} on various lending platforms such as CREAM, AAVE or ALPHA HOMORA to gain yield.`;
    } else if (name.includes('StrategyGenericLevCompFarm')) {
      return `This strategy supplies the ${tokens} on Compound and borrows an additional amount of the ${tokens} to maximize COMP farming. Flashloans are used to obtain additional ${tokens} from dYdX in order to gain additional leverage and boost the APY. Earned COMP is harvested and sold for more ${tokens} and re-deposited into the vault.`;
    } else if (name.includes('StrategyAH2Earncy')) {
      return `Lends ${tokens} on Alpha Homora v2 to generate interest. Users of Alpha Homora borrow ${tokens} to perform leveraged yield-farming on Alpha’s platform.`;
    } else if (name.includes('StrategyIdle')) {
      return `This strategy supplies ${tokens} on IDLE.finance to farm COMP and IDLE. Rewards are harvested, sold for more ${tokens}, and deposited back to the vault.`;
    } else if (name.includes('StrategyCurve') && name.includes('VoterProxy')) {
      return `This vault accepts deposits of ${tokens} tokens obtained by supplying either aDai, aUSDC or aUSDT to the liquidity pool on Curve.fi. ${tokens} tokens are staked in the gauge on Curve.fi to earn CRV rewards. Rewards are swapped for one of the underlying assets and resupplied to the liquidity pool to obtain more ${tokens}.`;
    } else if (name.includes('StrategyDAI3pool')) {
      return `This vault deposits ${tokens} into the 3pool on Curve.fi. The 3Crv tokens are then deposited into the Curve 3Pool yVault.`;
    } else if (name.includes('StrategyHegicETH') || name.includes('StrategyHegicWBTC')) {
      return `These three strategies work together to alternatively use HEGIC to buy ETH or WBTC lots on HEGIC.co. While the vault is building up the required 888,000 HEGIC needed to buy a lot, it lends it out on C.R.E.A.M to earn interest. The vault also keeps a buffer of HEGIC in reserve for withdrawals earning interest in CREAM.`;
    } else if (name.includes('StrategyMKRVaultDAIDelegate')) {
      return `Users deposit ETH, which is used to mint DAI from MakerDAO. DAI is then deposited into our v1 yDAI vault, which earns CRV. CRV is periodically harvested, sold for more ETH and re-deposited into the vault.`;
    } else if (name === 'IBLevComp') {
      return 'Supplies DAI on Compound and opens a long-term debt for an additional amount of DAI from Ironbank without the need for collateral, to maximize COMP farming. Earned COMP is harvested and sold for more DAI and re-deposited into the vault.';
    } else if (name.includes('StrategysteCurveWETHSingleSided')) {
      return 'Supplies WETH to the liquidity pool on Curve here to obtain steCRV tokens which it then puts into the v2 Curve stETH Pool yVault (yvsteCRV)to gain yield.';
    } else if (name.includes('StrategyeCurveWETHSingleSided')) {
      return 'Supplies WETH to the liquidity pool on Curve here to obtain eCRV tokens which it then puts into the v2 Curve sETH Pool yVault (yveCRV) to gain yield.';
    } else if (name.includes('DAOFeeClaim')) {
      return 'This vault converts your CRV into yveCRV, earning you a continuous share of Curve fees. The more converted, the greater the rewards. Every Friday, these can be claimed from the vault as 3Crv (Curve’s 3pool LP token).';
    } else if (name.includes('LPProfitSwitching')) {
      return 'Earn is a lending aggregator that strives to attain the highest yield for supported coins (DAI, USDC, USDT, TUSD, sUSD, or wBTC) at all times. It does this by programmatically shifting these coins between several lending protocols (AAVE, dYdX, and Compound) operating on the Ethereum blockchain.';
    } else if (name.includes('StrategyDAI3Pool')) {
      return 'This vault deposits DAI into the 3Pool on Curve.fi. The 3Crv tokens are then deposited into the Curve 3Pool yVault.';
    } else if (name.includes('StrategyUSDC3pool')) {
      return 'This vault deposits USDC into the 3pool on Curve.fi. The 3Crv tokens are then deposited into the Curve 3Pool yVault.';
    } else if (name.includes('StrategyUSDT3pool')) {
      return 'This vault deposits USDT into the 3pool on Curve.fi. The 3Crv tokens are then deposited into the Curve 3Pool yVault.';
    } else if (name.includes('StrategyTUSDypool')) {
      return 'Thıs vault deposits TUSD into the YPool on Curve.fi. The yCRV are then deposited into the Curve YPool yVault.';
    } else if (name.includes('StrategyVaultUSDC')) {
      return 'This vault deposits aLINK as collateral on Aave to borrow USDC. The USDC is deposited into the v1 USDC yVault. Profits are harvested and used to buy additional LINK, supplied as collateral on Aave in exchange for aLINK and re-deposited into the vault.';
    } else if (name.includes('StrategymUSDCurve')) {
      return 'This vault deposits mUSD into the mUSD/3Crv pool on Curve.fi. The crvMUSD is then deposited into the Curve mUSD Pool yVault.';
    } else if (name.includes('StrategyMakerYFIDAIDelegate')) {
      return 'This debt-based strategy opens a Maker Vault, locks up YFI, draws DAI and earns yield by depositing into Yearn DAI Vault.';
    } else if (name.includes('StrategySynthetixRewardsGeneric')) {
      return 'This universal strategy harvests farm of the week and can be easily refashioned for new farms as they appear.';
    } else if (name.includes('StrategyYearnVECRV')) {
      return 'This strategy claims weekly 3CRV rewards and uses them to acquire more yveCRV via market-buy or mint, depending on which is most efficient at time of harvest.';
    } else if (name.includes('Strategy1INCHGovernance')) {
      return 'Stakes 1INCH token on 1INCH DAO to collect governance rewards. Rewards are harvested and deposited back into the vault.';
    }

    else if (name.includes('StrategyMakerETHDAIDelegate')) {
      return 'This strategy uses ETH to mint DAI at MakerDAO. This newly minted DAI is then deposited into the v2 DAI yVault.';
    } else if (name.includes('PoolTogether')) {
      return `Supplies ${tokens} to the PoolTogether protocol to farm POOL. Rewards are harvested, sold for more ${tokens}, and deposited back into the vault. If it gets the prize of the week it will also be added to the vault.`;
    } else if (name.includes('StrategyAH2Earncy')) {
      return `Lends ${tokens} on Alpha Homora v2 to generate interest. Users of Alpha Homora borrow ${tokens} to perform leveraged yield-farming on Alpha Homora’s platform.`;
    } else if (name.includes('SingleSidedCrv')) {
      return `Deposits ${tokens} to a ${tokens} curve pool on curve.fi, and switches to the most profitable curve pool.`;
    } else if (name.includes('StrategyCurveIBVoterProxy')) {
      return `This vault accepts deposits of ib3CRV tokens obtained by supplying either cyDAI, cyUSDC, or cyUSDT to the liquidity pool on Curve in exchange for ib3CRV tokens. ib3CRV are staked in the gauge on Curve Finance to earn CRV rewards. Rewards are swapped for one of the underlying assets and resupplied to the liquidity pool to obtain more ib3CRV.`;
    } else if (name.includes('Curve') && name.includes('VoterProxy')) {
      return `This vault accepts deposits of ${tokens} tokens obtained by supplying supported tokens to the liquidity pool on Curve. ${tokens} tokens are staked in the gauge on Curve to earn CRV rewards. Rewards are swapped for one of the underlying assets and resupplied to the liquidity pool to obtain more ${tokens}.`;
    } else if (name.includes('StrategystETHCurve')) {
      return 'This vault accepts deposits of steCRV tokens obtained by supplying either ETH or stETH to the liquidity pool on Curve here. steCRV are staked in the gauge on curve.finance to earn CRV and LDO rewards. Rewards are swapped for WETH and resupplied to the liquidity pool to obtain more steCRV.';
    } else if (name.includes('StrategyRook')) {
      return `Supplies ${tokens} to KeeperDAO to farm ROOK. Rewards are harvested, sold for more ${tokens}, and deposited back into the vault.`
    } else if (name.includes('StrategySynthetixSusdMinter')) {
      return `Stakes SNX at Synthetix to mint sUSD. The newly minted sUSD is then deposited into the v2 sUSD yVault to earn yield. Yield from sUSD and rewards from weekly fees plus vested rewards (when claimable) are swapped for more SNX and re-deposited into the vault.`
    } else if (name.includes('Convex')) {
      return `Supplies ${tokens} to Convex Finance to farm CVX. Rewards are harvested, sold for more ${tokens}, and deposited back into the vault.`
    } else if (name === 'Strategy Vesper WBTC') {
      return 'Supplies wBTC to Vesper Finance vWBTC Pool to earn VSP. Rewards are harvested, sold for more wBTC, and re-deposited into the vault.'
    } else if (name === 'Vesper LINK') {
      return 'Supplies LINK to Vesper Finance LINK Pool to earn VSP. Rewards are harvested, sold for more LINK, and re-deposited into the vault.'
    } else if (name === 'AaveWETHLenderUSDTBorrower') {
      return 'Lends WETH on AAVE to gain interest and accumulate staked AAVE as rewards. Also borrows USDT which it then deposits into the USDT yVault for yield. Rewards from vested AAVE and yvUSDT are harvested, sold for more WETH, and re-deposited into the vault.'
    }

    else {
      return "I don't have a description for this strategy yet.";
    }
  }

  mapProtocolToDescription = (name) => {
    switch (name) {
      case 'Curve':
        return `Curve Finance is an automated market maker protocol designed for swapping between stablecoins with low fees and slippage. It's a decentralized liquidity aggregator where anyone can add their assets to several different liquidity pools and earn fees.`
      case 'Convex':
        return `Convex Finance, a platform built to boost rewards for CRV stakers and liquidity providers alike, all in a simple and easy to use interface. Convex aims to simplify staking on Curve, as well as the CRV-locking system with the help of its native fee-earning token: CVX.`
      case 'Maker':
        return `Maker is a smart contract lending platform that enables users to take out loans by locking-in collateral in exchange for Dai. It was founded by the Maker Foundation in 2015 as an open-source project to offer economic freedom and opportunities to anyone, anywhere.`
      case 'Aave':
        return `Aave is a decentralized money market running on the Ethereum blockchain that enables users to lend and borrow a range of crypto assets.`
      case 'Idle.Finance':
        return `Idle is a decentralized rebalancing protocol that allows users to automatically and algorithmically manage their digital asset allocation among different third-party DeFi protocols. You can choose to maximize your interest rate returns through our MaxYield strategy or minimize your risk exposure through our RiskAdjusted allocation strategy.`
      case 'Compound':
        return `Compound is a decentralized, blockchain-based protocol that allows you to lend and borrow crypto — and have a say in its governance with its native COMP token.`
      case 'Vesper':
        return `Vesper Finance is a DeFi ecosystem and growth engine for crypto assets, providing a suite of yield-generating products focused on accessibility, optimization, and longevity.`
      case 'Alpha Homora':
        return `Alpha Homora is the first leveraged yield farming and leveraged liquidity providing product in DeFi and the first product by Alpha Finance Lab`
      case 'PoolTogether':
        return `PoolTogether is a deceptively simple DeFi app that incentivizes users to deposit funds with the opportunity to win prizes. In PoolTogether, there are two types of prize pools: those set up by the PoolTogether project and community prize pools that anyone can set up.`
      case 'KeeperDAO':
        return `KeeperDAO is a mining pool for Keepers. By incentivizing a game theory optimal strategy for cooperation among on-chain arbitrageurs, KeeperDAO provides an efficient mechanism for large scale arbitrage and liquidation trades on all DeFi protocols.`
      case 'Synthetix':
        return `Synthetix is a decentralized synthetic asset issuance protocol founded by Kain Warwick and the Synthetix Foundation. Initially, it was known as Havven when it first launched in September 2017.`
      case '1INCH':
        return `1inch exchange is a decentralized exchange (DEX) aggregator to help users discover the best trade prices for tokens. Instead of swapping tokens from a single liquidity pool of a DEX, 1inch will aggregate across different pools and suggest the most efficient way to trade tokens.`
      case 'Cream':
        return `C.R.E.A.M. Finance is a decentralized lending protocol for individuals, institutions and protocols to access financial services. Part of the yearn finance ecosystem, it is a permissionless, open source and blockchain agnostic protocol serving users on Ethereum, Binance Smart Chain and Fantom. Users who are passively holding Ethereum or Bitcoin can deposit their assets on C.R.E.A.M. to earn yield, similar to a traditional savings account.`
      case 'DyDx':
        return `dYdX is a decentralized margin trading platform based on Ethereum. dYdX allows users to borrow lend and make bets on the future prices of popular cryptocurrencies.`
      case 'Fulcrum':
        return `Fulcrum is a powerful DeFi platform for tokenized lending and margin trading.`
      case 'Yearn':
        return `Yearn Finance is a suite of products in Decentralized Finance (DeFi) that provides lending aggregation, yield generation, and insurance on the Ethereum blockchain.`
          default:
        return `I don't have a description for this yet.`
    }
  }
}

export default Store;
