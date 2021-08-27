import async from "async";
import * as moment from "moment";
import stores from ".";
import systemJson from "./configurations/system";
// import { LTVMAXIMIZERABI } from "./abis";
import { bnDec } from "../utils/utils";

// import { GET_MAX, MAX_RETURNED, LTV_MAXIMIZER_ADDRESS } from "./constants";

import BigNumber from "bignumber.js";

class Store {
  constructor(dispatcher, emitter) {
    this.dispatcher = dispatcher;
    this.emitter = emitter;

    this.store = {
      systemJson: systemJson,
      assets: systemJson
        .map((asset) => {
          if(asset.token.isCurve) {
            return asset.token.curveTokenSplit.map((token) => {
              return {
                name: token.symbol,
                balance: BigNumber(token.balance).div(10**token.decimals).toNumber(),
                type: asset.type
              }
            })
          }

          return {
            name: asset.token.display_name,
            balance: BigNumber(asset.tvl.tvl).toNumber(),
            type: asset.type
          }
        })
        .flat()
        .reduce((assets, asset) => {
          try {
            if(!assets) {
              assets = []
            }
            const index = assets.findIndex((as) => as.name === asset.name)
            if(index === -1) {
              assets.push({
                name: asset.name,
                balance: BigNumber(asset.balance).toNumber(),
                type: asset.type
              })
            } else {
              assets[index].balance = BigNumber(assets[index].balance).plus(asset.balance).toNumber()
            }

            return assets
          } catch(ex) {
            console.log(ex)
            return []
          }
        }, [])
        .sort((firstEl, secondEl) => {
          if(BigNumber(secondEl.balance).gt(firstEl.balance)) {
            return 1
          } else {
            return -1
          }
        }),
      vaults: systemJson
        .map((asset) => {
          return {
            name: asset.display_name,
            balance: BigNumber(asset.tvl.tvl).toNumber(),
            type: asset.type
          }
        })
        .sort((firstEl, secondEl) => {
          if(BigNumber(secondEl.balance).gt(firstEl.balance)) {
            return 1
          } else {
            return -1
          }
        }),
      strategies: systemJson
        .map((asset) => {
          return asset.strategies
        })
        .flat()
        .reduce((strategies, strategy) => {
          try {
            if(!strategies) {
              strategies = []
            }
            const index = strategies.findIndex((stra) => stra.name === strategy.name)
            if(index === -1) {
              strategies.push({
                name: strategy.name,
                balance: BigNumber(strategy.balanceUSD).toNumber(),
                type: strategy.type
              })
            } else {
              strategies[index].balance = BigNumber(strategies[index].balance).plus(strategy.balanceUSD).toNumber()
            }

            return strategies
          } catch(ex) {
            console.log(ex)
          }
        }, [])
        .sort((firstEl, secondEl) => {
          if(BigNumber(secondEl.balance).gt(firstEl.balance)) {
            return 1
          } else {
            return -1
          }
        }),
      protocols: systemJson
        .map((asset) => {
          return asset.strategies
        })
        .flat()
        .map((strategy) => {
          return strategy.protocols
        })
        .flat()
        .reduce((protocols, protocol) => {
          try {
            if(!protocols) {
              protocols = []
            }
            const index = protocols.findIndex((pro) => pro.name === protocol.name)
            if(index === -1) {
              protocols.push({
                name: protocol.name,
                balance: BigNumber(protocol.balanceUSD).toNumber(),
                type: protocol.type
              })
            } else {
              protocols[index].balance = BigNumber(protocols[index].balance).plus(protocol.balanceUSD).toNumber()
            }

            return protocols
          } catch(ex) {
            console.log(ex)
          }
        }, [])
        .sort((firstEl, secondEl) => {
          if(BigNumber(secondEl.balance).gt(firstEl.balance)) {
            return 1
          } else {
            return -1
          }
        }),
    };

    dispatcher.register(
      function(payload) {
        switch (payload.type) {
          // case GET_MAX:
          //   this.getLTVMax(payload);
          //   break;
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
}

export default Store;
