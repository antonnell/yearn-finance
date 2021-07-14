import async from "async";
import * as moment from "moment";
import stores from "./";
import ltvJson from "./configurations/ltv";
import { LTVMAXIMIZERABI } from "./abis";
import { bnDec } from "../utils";

import { GET_MAX, MAX_RETURNED, LTV_MAXIMIZER_ADDRESS } from "./constants";

import BigNumber from "bignumber.js";

class Store {
  constructor(dispatcher, emitter) {
    this.dispatcher = dispatcher;
    this.emitter = emitter;

    this.store = {
      assets: ltvJson
    };

    dispatcher.register(
      function(payload) {
        switch (payload.type) {
          case GET_MAX:
            this.getLTVMax(payload);
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

  getLTVMax = async payload => {
    const web3 = await stores.accountStore.getWeb3Provider();

    const maxContract = new web3.eth.Contract(
      LTVMAXIMIZERABI,
      LTV_MAXIMIZER_ADDRESS
    );

    const max = await maxContract.methods
      .getLTV(payload.content.address)
      .call();

    const cream = max[0];
    const compound = max[1];
    const ib = max[2];
    const aave1 = max[3];
    const aave2 = max[4];
    const unit = max[5];

    this.emitter.emit(MAX_RETURNED, {
      cream,
      compound,
      ironBank: ib,
      aave1,
      aave2,
      unit
    });
  };
}

export default Store;
