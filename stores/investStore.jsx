import async from 'async';
import {
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
      vaults: []
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
    if(!account) {
      return false
      //maybe throw an error
    }

    const web3 = await stores.accountStore.getWeb3Provider()
    if(!web3) {
      return false
      //maybe throw an error
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

        if(callback) {
          callback(null, vault)
        } else {
          return vault
        }
      } catch(ex) {
        console.log(ex)
        console.log(vault)
      }
    }, (err, vaultsBalanced) => {
      if(err) {
        return this.emitter.emit(ERROR, err)
      }

      this.setStore({
        vaults: vaultsBalanced ,
        portfolioBalanceUSD: vaultsBalanced.reduce((accumulator, currentValue) => {
          return BigNumber(accumulator).plus(BigNumber(currentValue.balance).times(currentValue.pricePerFullShare).times(currentValue.tokenMetadata.priceUSD)).toNumber()
        }, 0)
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
      return false
      //maybe throw an error
    }

    const web3 = await stores.accountStore.getWeb3Provider()
    if(!web3) {
      return false
    }

    const provider = "https://eth-mainnet.alchemyapi.io/v2/XLj2FWLNMB4oOfFjbnrkuOCcaBIhipOJ";
    const etherscanApiKey = "GEQXZDY67RZ4QHNU1A57QVPNDV3RP1RYH4"

    const options = {
      provider,
      web3,                      // Only required if not providing your own provider
      etherscan: {
        apiKey: etherscanApiKey, // Only required if not providing abi in contract request configuration
        delayTime: 300,          // delay time between etherscan ABI reqests. default is 300 ms
      },
    }

    let callOptions = { };

    switch (duration) {
      case 'Week':
        callOptions = {
          blockHeight: 240 * 24 * 7,       // Historical blocks to read (60 * (60/15) = 240)... Enter 240 for one hours worth of data
          blockResolution: 240 * 24,        // Historical block resolution. Enter 4 to scan in one minute intervals    - 1 day intervals
        }
        break;
      case 'Month':
        callOptions = {
          blockHeight: 240 * 24 * 30,       // Historical blocks to read (60 * (60/15) = 240)... Enter 240 for one hours worth of data
          blockResolution: 240 * 24 * 3,        // Historical block resolution. Enter 4 to scan in one minute intervals    - 1 day intervals
        }
        break;
      case 'Year':
        callOptions = {
          blockHeight: 240 * 24 * 365,       // Historical blocks to read (60 * (60/15) = 240)... Enter 240 for one hours worth of data
          blockResolution: 240 * 24 * 36,        // Historical block resolution. Enter 4 to scan in one minute intervals    - 1 day intervals
        }
        break;
      default:
        callOptions = {
          blockHeight: 240 * 24 * 30,       // Historical blocks to read (60 * (60/15) = 240)... Enter 240 for one hours worth of data
          blockResolution: 240 * 24 * 3,        // Historical block resolution. Enter 4 to scan in one minute intervals    - 1 day intervals
        }
    }

    const contracts = [
      {
        namespace: "vaults",
        store: 'localStorage',
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

    this._callContract(web3, vaultContract, 'deposit', [amountToSend], account, gasPrice, null, callback)
  }

  _callContract = (web3, contract, method, params, account, gasPrice, emit, callback) => {
    //todo: rewrite the callback unfctionality.

    contract.methods[method](...params).send({ from: account.address, gasPrice: web3.utils.toWei(gasPrice, 'gwei') })
      .on('transactionHash', function(hash){
        this.emitter.emit(TX_SUBMITTED, hash)
        callback(null, hash)
      })
      .on('confirmation', function(confirmationNumber, receipt){
        if(emit && confirmationNumber === 1) {
          this.emitter.emit(emit)
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
