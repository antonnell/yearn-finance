import AccountStore from './accountStore';
import InvestStore from './investStore';
// import CoverStore from './coverStore';
import LendStore from './lendStore';
// import CDPStore from './cdpStore';
import LTVStore from './ltvStore';
// import FUSDStore from './fixedUSDStore';

const Dispatcher = require('flux').Dispatcher;
const Emitter = require('events').EventEmitter;

const dispatcher = new Dispatcher();
const emitter = new Emitter();

const accountStore = new AccountStore(dispatcher, emitter);
const investStore = new InvestStore(dispatcher, emitter);
// const coverStore = new CoverStore(dispatcher, emitter);
const lendStore = new LendStore(dispatcher, emitter);
// const cdpStore = new CDPStore(dispatcher, emitter);
const ltvStore = new LTVStore(dispatcher, emitter);
// const fusdStore = new FUSDStore(dispatcher, emitter);

export default {
  ltvStore: ltvStore,
  accountStore: accountStore,
  investStore: investStore,
  // coverStore: coverStore,
  lendStore: lendStore,
  // cdpStore: cdpStore,
  // fusdStore: fusdStore,
  dispatcher: dispatcher,
  emitter: emitter,
};
