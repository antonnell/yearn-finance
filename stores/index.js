import AccountStore from "./accountStore";
import InvestStore from "./investStore";
import CoverStore from "./coverStore";
import LendStore from "./lendStore";

const Dispatcher = require('flux').Dispatcher;
const Emitter = require('events').EventEmitter;

const dispatcher = new Dispatcher();
const emitter = new Emitter();

const accountStore = new AccountStore(dispatcher, emitter)
const investStore = new InvestStore(dispatcher, emitter)
const coverStore = new CoverStore(dispatcher, emitter)
const lendStore = new LendStore(dispatcher, emitter)

export default {
  accountStore: accountStore,
  investStore: investStore,
  coverStore: coverStore,
  lendStore: lendStore,
  dispatcher: dispatcher,
  emitter: emitter
};
