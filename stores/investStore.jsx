import async from 'async';
import {
  MAX_UINT256,
  YEARN_API,
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
  DEPOSIT_VAULT_RETURNED,
  WITHDRAW_VAULT,
  WITHDRAW_VAULT_RETURNED,
  APPROVE_VAULT,
  APPROVE_VAULT_RETURNED,
  GET_VAULT_TRANSACTIONS,
  VAULT_TRANSACTIONS_RETURNED
} from './constants';

import stores from './'
import { ERC20ABI, VAULTV1ABI, VAULTV2ABI } from './abis'
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
      portfolioBalanceUSD: 0,
      portfolioGrowth: 0,
      highestHoldings: null,
      vaults: [],
      tvlInfo: null
    }

    dispatcher.register(
      function (payload) {
        console.log(payload)
        switch (payload.type) {
          case CONFIGURE_VAULTS:
            this.configure(payload)
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
          case WITHDRAW_VAULT:
            this.withdrawVault(payload);
            break;
          case APPROVE_VAULT:
            this.approveVault(payload);
            break;
          case GET_VAULT_TRANSACTIONS:
            this.getVaultTransactions(payload);
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

  getVault = (address) => {
    const vault = this.store.vaults.filter((v) => {
      return v.address === address
    })

    if(vault && vault.length > 0) {
      return vault[0]
    } else {
      return null
    }
  };

  setVault = (address, newVault) => {
    const vaults = this.store.vaults.map((v) => {
      if(v.address === address) {
        v = newVault
      }
      return v
    })
  };

  configure = async(payload) => {
    try {
      const url = `${YEARN_API}vaults/all`

      const vaultsApiResult = await fetch(url);
      const vaults = await vaultsApiResult.json()
      this.setStore({ vaults: vaults })

      // also get APY values
      // store APY values

      this.emitter.emit(VAULTS_UPDATED)

      if(payload.content.connected) {
        this.dispatcher.dispatch({ type: GET_VAULT_BALANCES })
      } else {
        this.emitter.emit(VAULTS_CONFIGURED)
      }
    } catch (ex) {
      console.log(ex)
    }
  };

  getVaultBalances = async () => {
    const account = stores.accountStore.getStore('account')
    if(!account || !account.address) {
      this.emitter.emit(VAULTS_CONFIGURED)
      this.emitter.emit(VAULTS_UPDATED)
      return false
    }

    const web3 = await stores.accountStore.getWeb3Provider()
    if(!web3) {
      return false
      //maybe throw an error
    }

    let vaultInfo = null
    try {
      const url = `${YEARN_API}vaults`

      const vaultsApiResult = await fetch(url);
      vaultInfo = await vaultsApiResult.json()

    } catch(ex) {
      console.log(ex)
      vaultInfo = []
    }


    let tvlInfo = null
    try {
      const url = `${YEARN_API}tvl`

      const tvlAPIResult = await fetch(url);
      tvlInfo = await tvlAPIResult.json()

    } catch(ex) {
      console.log(ex)
    }

    const vaults = this.getStore('vaults')
    async.map(vaults, async (vault, callback) => {
      try {

        let abi = null

        switch (vault.type) {
          case 'v1':
            abi = VAULTV1ABI
            break;
          case 'v2':
            abi = VAULTV2ABI
            break;
          default:
            abi = 'UNKNOWN'
        }

        const vaultContract = new web3.eth.Contract(abi, vault.address)
        const balanceOf = await vaultContract.methods.balanceOf(account.address).call()
        vault.balance = BigNumber(balanceOf).div(bnDec(vault.decimals)).toFixed(vault.decimals, BigNumber.ROUND_DOWN)

        let pricePerFullShare = 1
        if(vault.type === 'v1') {
          pricePerFullShare = await vaultContract.methods.getPricePerFullShare().call()
        } else {
          pricePerFullShare = await vaultContract.methods.pricePerShare().call()
        }

        vault.pricePerFullShare = BigNumber(pricePerFullShare).div(bnDec(18)).toFixed(vault.tokenMetadata.decimals, BigNumber.ROUND_DOWN)

        vault.balanceInToken = BigNumber(vault.balance).times(vault.pricePerFullShare).toFixed(vault.tokenMetadata.decimals, BigNumber.ROUND_DOWN)

        const erc20Contract = new web3.eth.Contract(ERC20ABI, vault.tokenMetadata.address)
        const tokenBalanceOf = await erc20Contract.methods.balanceOf(account.address).call()
        vault.tokenMetadata.balance = BigNumber(tokenBalanceOf).div(bnDec(vault.tokenMetadata.decimals)).toFixed(vault.tokenMetadata.decimals, BigNumber.ROUND_DOWN)

        const allowance = await erc20Contract.methods.allowance(account.address, vault.address).call()
        vault.tokenMetadata.allowance = BigNumber(allowance).div(bnDec(vault.tokenMetadata.decimals)).toFixed(vault.tokenMetadata.decimals, BigNumber.ROUND_DOWN)

        const data = await CoinGeckoClient.simple.fetchTokenPrice({
          contract_addresses: vault.tokenMetadata.address,
          vs_currencies: 'usd',
        });

         // just do a pricePerShare * 1. Hope it is a USD-pegged based coin for anything that we don't find a price in coingecko.
        let price = 1
        if(data.success) {
          const keys = Object.keys(data.data)

          if(keys.length > 0) {
            price = data.data[keys[0]].usd
          }
        }

        vault.tokenMetadata.priceUSD = price
        vault.balanceUSD = BigNumber(vault.balance).times(vault.pricePerFullShare).times(price)


        if(!vault.strategies || vault.strategies.length === 0) {
          const theVaultInfo = vaultInfo.filter((v) => {
            return v.address === vault.address
          })

          if(theVaultInfo && theVaultInfo.length > 0) {
            vault.strategies = [{
              name: theVaultInfo[0].strategyName,
              address: theVaultInfo[0].strategyAddress
            }]
          }

        }

        if(callback) {
          callback(null, vault)
        } else {
          return vault
        }
      } catch(ex) {
        console.log(ex)
      }
    }, (err, vaultsBalanced) => {
      if(err) {
        console.log(err)
        return this.emitter.emit(ERROR, err)
      }

      const portfolioBalanceUSD = vaultsBalanced.reduce((accumulator, currentValue) => {
        return BigNumber(accumulator).plus(BigNumber(currentValue.balance).times(currentValue.pricePerFullShare).times(currentValue.tokenMetadata.priceUSD)).toNumber()
      }, 0)

      const portfolioGrowth = vaultsBalanced.reduce((accumulator, currentValue) => {
        if(!currentValue.balance || BigNumber(currentValue.balance).eq(0) || !currentValue.apy.oneMonthSample  || BigNumber(currentValue.apy.oneMonthSample).eq(0)) {
          return accumulator
        }

        return BigNumber(accumulator).plus(BigNumber(currentValue.balance).times(currentValue.pricePerFullShare).times(currentValue.tokenMetadata.priceUSD).div(portfolioBalanceUSD).times(currentValue.apy.oneMonthSample*100)).toNumber()
      }, 0)

      let highestHoldings = vaultsBalanced.reduce((prev, current) => (BigNumber(prev.balanceUSD).gt(current.balanceUSD)) ? prev : current)
      if(BigNumber(highestHoldings.balanceUSD).eq(0)) {
        highestHoldings = null
      }

      this.setStore({
        vaults: vaultsBalanced,
        portfolioBalanceUSD: portfolioBalanceUSD,
        portfolioGrowth: portfolioGrowth ? portfolioGrowth : 0,
        highestHoldings: highestHoldings,
        tvlInfo: tvlInfo,
      })

      this.emitter.emit(VAULTS_CONFIGURED)
      this.emitter.emit(VAULTS_UPDATED)
    })

  }

  getVaultPerformance = async (payload) => {

    const { address, duration } = payload.content

    //maybe do this on initial configuration load.

    const account = stores.accountStore.getStore('account')
    if(!account) {
      //maybe throw an error
    }

    const web3 = await stores.accountStore.getWeb3Provider()
    if(!web3) {

    }

    const provider = "https://eth-mainnet.alchemyapi.io/v2/XLj2FWLNMB4oOfFjbnrkuOCcaBIhipOJ";
    const etherscanApiKey = "GEQXZDY67RZ4QHNU1A57QVPNDV3RP1RYH4"

    const options = {
      provider,
      etherscan: {
        apiKey: etherscanApiKey, // Only required if not providing abi in contract request configuration
        delayTime: 300,          // delay time between etherscan ABI reqests. default is 300 ms
      },
    }

    let callOptions = { };

    switch (duration) {
      case 'Week':
        callOptions = {
          blockHeight: 272 * 24 * 7,       // Historical blocks to read (60 * (60/15) = 240)... Enter 240 for one hours worth of data - 272 = 13.2 seconds per block
          blockResolution: 272 * 24,        // Historical block resolution. Enter 4 to scan in one minute intervals    - 1 day intervals - 272 = 13.2 seconds per block
        }
        break;
      case 'Month':
        callOptions = {
          blockHeight: 272 * 24 * 30,       // Historical blocks to read (60 * (60/15) = 240)... Enter 240 for one hours worth of data - 272 = 13.2 seconds per block
          blockResolution: 272 * 24 * 3,        // Historical block resolution. Enter 4 to scan in one minute intervals    - 1 day intervals - 272 = 13.2 seconds per block
        }
        break;
      case 'Year':
        callOptions = {
          blockHeight: 272 * 24 * 365,       // Historical blocks to read (60 * (60/15) = 240)... Enter 240 for one hours worth of data - 272 = 13.2 seconds per block
          blockResolution: 272 * 24 * 36,        // Historical block resolution. Enter 4 to scan in one minute intervals    - 1 day intervals - 272 = 13.2 seconds per block
        }
        break;
      default:
        callOptions = {
          blockHeight: 272 * 24 * 30,       // Historical blocks to read (60 * (60/15) = 240)... Enter 240 for one hours worth of data - 272 = 13.2 seconds per block
          blockResolution: 272 * 24 * 3,        // Historical block resolution. Enter 4 to scan in one minute intervals    - 1 day intervals - 272 = 13.2 seconds per block
        }
    }

    let contracts = {}

    if(!account || !account.address) {
      contracts = [
        {
          namespace: "vaults",
          store: localStorage,
          addresses: [
            address
          ],
          allReadMethods: true,
          groupByNamespace: false,
          logging: false,
          readMethods: [],
        }
      ];
    } else {
      contracts = [
        {
          namespace: "vaults",
          store: localStorage,
          addresses: [
            address
          ],
          allReadMethods: true,
          groupByNamespace: false,
          logging: false,
          readMethods: [
            {
              name: "balanceOf",
              args: [account.address],
            }
          ],
        }
      ];
    }

    const batchCall = new BatchCall(options);
    const result = await batchCall.execute(contracts, callOptions);

    const vault = this.getVault(payload.content.address)

    vault.historicData = result[0]

    this.setVault({
      address: payload.content.address,
      vault: vault
    })

    this.emitter.emit(VAULT_PERFORMANCE_RETURNED)
  }

  depositVault = async (payload) => {
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

    const { vault, amount } = payload.content

    this._callDepositVault(web3, vault, account, amount, (err, depositResult) => {
      if(err) {
        return this.emitter.emit(ERROR, err);
      }

      return this.emitter.emit(DEPOSIT_VAULT_RETURNED, depositResult)
    })
  }

  _callDepositVault = async (web3, vault, account, amount, callback) => {
    let abi = null

    switch (vault.type) {
      case 'v1':
        abi = VAULTV1ABI
        break;
      case 'v2':
        abi = VAULTV2ABI
        break;
      default:
        abi = 'UNKNOWN'
    }

    const vaultContract = new web3.eth.Contract(abi, vault.address)

    const amountToSend = BigNumber(amount).times(10**vault.decimals).toFixed(0)

    const gasPrice = await stores.accountStore.getGasPrice()

    this._callContract(web3, vaultContract, 'deposit', [amountToSend], account, gasPrice, GET_VAULT_BALANCES, callback)
  }


  withdrawVault = async (payload) => {
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

    const { vault, amount } = payload.content

    this._callWithdrawVault(web3, vault, account, amount, (err, withdrawResult) => {
      if(err) {
        return this.emitter.emit(ERROR, err);
      }

      return this.emitter.emit(WITHDRAW_VAULT_RETURNED, withdrawResult)
    })
  }

  _callWithdrawVault = async (web3, vault, account, amount, callback) => {
    let abi = null

    switch (vault.type) {
      case 'v1':
        abi = VAULTV1ABI
        break;
      case 'v2':
        abi = VAULTV2ABI
        break;
      default:
        abi = 'UNKNOWN'
    }

    const vaultContract = new web3.eth.Contract(abi, vault.address)

    const amountToSend = BigNumber(amount).times(10**vault.decimals).toFixed(0)

    const gasPrice = await stores.accountStore.getGasPrice()

    this._callContract(web3, vaultContract, 'withdraw', [amountToSend], account, gasPrice, GET_VAULT_BALANCES, callback)
  }

  _callContract = (web3, contract, method, params, account, gasPrice, dispatchEvent, callback) => {
    //todo: rewrite the callback unfctionality.

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

  approveVault = async (payload) => {
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

    const { vault, amount } = payload.content

    this._callApproveVault(web3, vault, account, amount, (err, approveResult) => {
      if(err) {
        return this.emitter.emit(ERROR, err);
      }

      return this.emitter.emit(APPROVE_VAULT_RETURNED, approveResult)
    })
  }

  _callApproveVault = async (web3, vault, account, amount, callback) => {
    const tokenContract = new web3.eth.Contract(ERC20ABI, vault.tokenMetadata.address)

    let amountToSend = '0'
    if(amount === 'max') {
      amountToSend = MAX_UINT256
    } else {
      amountToSend = BigNumber(amount).times(10**vault.decimals).toFixed(0)
    }

    const gasPrice = await stores.accountStore.getGasPrice()

    this._callContract(web3, tokenContract, 'approve', [vault.address, amountToSend], account, gasPrice, GET_VAULT_BALANCES, callback)
  }

  getVaultTransactions = async (payload) => {
    const { address } = payload.content

    const account = stores.accountStore.getStore('account')
    if(!account || !account.address) {
      //maybe throw an error
      return false
    }

    try {
      const url = `${YEARN_API}user/${account.address}/vaults/transactions`

      const vaultsApiResult = await fetch(url);
      const transactions = await vaultsApiResult.json()

      const vaults = this.getStore('vaults')

      const vaultsPopulated = vaults.map((vault) => {

        const txs = transactions.filter((tx) => {
          return tx.vaultAddress === vault.address
        })

        if(txs && txs.length > 0) {
          const array = []
          array.push(...txs[0].deposits.map((tx) => { tx.description = 'Deposit into vault'; return tx; }))
          array.push(...txs[0].withdrawals.map((tx) => { tx.description = 'Withdraw from vault'; return tx; }))
          array.push(...txs[0].transfersIn.map((tx) => { tx.description = 'Transfer into vault'; return tx; }))
          array.push(...txs[0].transfersOut.map((tx) => { tx.description = 'Transfer out of vault'; return tx; }))

          vault.transactions = array.sort((a, b) => {
            return a.timestamp < b.timestamp ? 1 : -1
          })
        } else {
          vault.transactions = []
        }

        return vault
      })

      this.setStore({ vaults: vaultsPopulated })

      this.emitter.emit(VAULTS_UPDATED)
      this.emitter.emit(VAULT_TRANSACTIONS_RETURNED)
    } catch (ex) {
      console.log(ex)
    }
  }
}

export default Store;
